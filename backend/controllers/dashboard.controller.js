import pool from '../config/database.js';

// Helper: get wallet balance (read‑only)
const getUserWalletBalance = async (userId) => {
    const res = await pool.query(
        `SELECT balance FROM extensions.wallets WHERE user_id = $1`,
        [userId]
    );
    return res.rows[0] ? parseFloat(res.rows[0].balance) : 0;
};

// ========== DASHBOARD STATS ==========
export const getDashboardStats = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRes = await pool.query(
            `SELECT id, fullname, email, phone, kyc_status, account_number 
             FROM extensions.users WHERE id = $1`,
            [userId]
        );
        if (userRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        const user = userRes.rows[0];
        const walletBalance = await getUserWalletBalance(userId);

        // Order statistics (pending / completed)
        const ordersStat = await pool.query(
            `SELECT status, COUNT(*) as count, COALESCE(SUM(total_amount),0) as total 
             FROM extensions.orders WHERE user_id = $1 GROUP BY status`,
            [userId]
        );
        const stats = { totalOrders: 0, totalSpent: 0, pendingOrders: 0, completedOrders: 0 };
        ordersStat.rows.forEach(row => {
            stats.totalOrders += parseInt(row.count);
            stats.totalSpent += parseFloat(row.total);
            if (row.status === 'pending') stats.pendingOrders = parseInt(row.count);
            if (row.status === 'completed') stats.completedOrders = parseInt(row.count);
        });

        // Recent 5 orders
        const recentOrders = await pool.query(
            `SELECT order_number, total_amount, status, created_at 
             FROM extensions.orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5`,
            [userId]
        );

        res.json({
            success: true,
            data: {
                user: {
                    name: user.fullname,
                    email: user.email,
                    phone: user.phone,
                    walletBalance,
                    kycStatus: user.kyc_status || 'pending',
                    accountNumber: user.account_number || 'Not assigned'
                },
                stats,
                recentOrders: recentOrders.rows
            }
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ========== ORDERS (view with status filter) ==========
export const getUserOrders = async (req, res) => {
    try {
        const userId = req.user.id;
        const { status } = req.query; // 'all', 'pending', 'completed'
        let query = `SELECT o.* FROM extensions.orders o WHERE o.user_id = $1`;
        let params = [userId];
        if (status && status !== 'all') {
            query += ` AND o.status = $2`;
            params.push(status);
        }
        query += ` ORDER BY o.created_at DESC`;
        const ordersRes = await pool.query(query, params);
        const orders = await Promise.all(ordersRes.rows.map(async (order) => {
            const items = await pool.query(
                `SELECT oi.*, p.name as product_name 
                 FROM extensions.order_items oi 
                 JOIN extensions.products p ON oi.product_id = p.id 
                 WHERE oi.order_id = $1`,
                [order.id]
            );
            return { ...order, items: items.rows };
        }));
        res.json({ success: true, data: orders });
    } catch (error) {
        console.error('Orders error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ========== TRANSACTIONS (view with type filter) ==========
export const getUserTransactions = async (req, res) => {
    try {
        const userId = req.user.id;
        const { type } = req.query; // 'all', 'credit', 'debit'
        let query = `SELECT * FROM extensions.transactions WHERE user_id = $1`;
        let params = [userId];
        if (type === 'credit') query += ` AND amount > 0`;
        else if (type === 'debit') query += ` AND amount < 0`;
        query += ` ORDER BY created_at DESC LIMIT 50`;
        const result = await pool.query(query, params);
        const transactions = result.rows.map(tx => ({
            ...tx,
            type: tx.amount > 0 ? 'credit' : 'debit',
            amount: Math.abs(tx.amount)
        }));
        res.json({ success: true, data: transactions });
    } catch (error) {
        console.error('Transactions error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ========== PRODUCT MANAGEMENT (seller) ==========
export const getSellerProducts = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await pool.query(
            `SELECT id, name, price, stock, category, status, created_at 
             FROM extensions.products WHERE seller_id = $1 ORDER BY created_at DESC`,
            [userId]
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const addProduct = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, price, stock, category, description, images } = req.body;
        if (!name || !price) {
            return res.status(400).json({ success: false, message: 'Name and price required' });
        }
        const result = await pool.query(
            `INSERT INTO extensions.products (seller_id, name, price, stock, category, description, images, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) RETURNING id`,
            [userId, name, price, stock || 0, category || 'uncategorized', description || '', images || []]
        );
        res.json({ success: true, message: 'Product added', productId: result.rows[0].id });
    } catch (error) {
        console.error('Add product error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const updateProduct = async (req, res) => {
    try {
        const userId = req.user.id;
        const productId = req.params.id;
        const { name, price, stock, category, description, status } = req.body;
        // ownership check
        const check = await pool.query(
            `SELECT id FROM extensions.products WHERE id = $1 AND seller_id = $2`,
            [productId, userId]
        );
        if (check.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Product not found or unauthorized' });
        }
        await pool.query(
            `UPDATE extensions.products 
             SET name = COALESCE($1, name),
                 price = COALESCE($2, price),
                 stock = COALESCE($3, stock),
                 category = COALESCE($4, category),
                 description = COALESCE($5, description),
                 status = COALESCE($6, status)
             WHERE id = $7`,
            [name, price, stock, category, description, status, productId]
        );
        res.json({ success: true, message: 'Product updated' });
    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const deleteProduct = async (req, res) => {
    try {
        const userId = req.user.id;
        const productId = req.params.id;
        const check = await pool.query(
            `SELECT id FROM extensions.products WHERE id = $1 AND seller_id = $2`,
            [productId, userId]
        );
        if (check.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Product not found or unauthorized' });
        }
        await pool.query(`DELETE FROM extensions.products WHERE id = $1`, [productId]);
        res.json({ success: true, message: 'Product deleted' });
    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ========== KYC ==========
export const getKycStatus = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await pool.query(
            `SELECT kyc_status, kyc_data FROM extensions.users WHERE id = $1`,
            [userId]
        );
        res.json({
            success: true,
            data: {
                status: result.rows[0]?.kyc_status || 'pending',
                data: result.rows[0]?.kyc_data || null
            }
        });
    } catch (error) {
        console.error('KYC status error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const submitKyc = async (req, res) => {
    try {
        const userId = req.user.id;
        const { fullname, idType, idNumber, address } = req.body;
        if (!fullname || !idType || !idNumber || !address) {
            return res.status(400).json({ success: false, message: 'All KYC fields required' });
        }
        const kycData = { fullname, idType, idNumber, address, submittedAt: new Date() };
        await pool.query(
            `UPDATE extensions.users SET kyc_status = 'submitted', kyc_data = $1 WHERE id = $2`,
            [kycData, userId]
        );
        res.json({ success: true, message: 'KYC submitted for review' });
    } catch (error) {
        console.error('Submit KYC error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ========== PROFILE ==========
export const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, phone } = req.body;
        await pool.query(
            `UPDATE extensions.users SET fullname = COALESCE($1, fullname), phone = COALESCE($2, phone) WHERE id = $3`,
            [name, phone, userId]
        );
        res.json({ success: true, message: 'Profile updated' });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};