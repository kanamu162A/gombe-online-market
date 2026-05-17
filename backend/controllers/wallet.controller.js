import pool from "../config/database.js";
import axios from "axios";

// ============================
// Helper: get wallet for a user
// ============================
const getUserWallet = async (userId) => {
  const result = await pool.query(
    `SELECT id, balance, locked_balance, currency, status 
     FROM extensions.wallets 
     WHERE user_id = $1`,
    [userId]
  );
  return result.rows[0];
};

// ============================
// CREATE WALLET FOR NEW USER (called from authController)
// ============================
export const createUserWallet = async (userId) => {
  try {
    const result = await pool.query(
      `INSERT INTO extensions.wallets (user_id, balance, locked_balance, currency, status, created_at, updated_at)
       VALUES ($1, 0, 0, 'NGN', 'active', NOW(), NOW())
       RETURNING id`,
      [userId]
    );
    return { success: true, walletId: result.rows[0].id };
  } catch (error) {
    console.error("Create wallet error:", error.message);
    return { success: false, error: error.message };
  }
};

// ============================
// GET WALLET BALANCE
// ============================
export const getWalletBalance = async (req, res) => {
  try {
    const userId = req.user.id;
    const wallet = await getUserWallet(userId);
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found for this user"
      });
    }
    res.status(200).json({
      success: true,
      wallet: {
        balance: parseFloat(wallet.balance),
        locked_balance: parseFloat(wallet.locked_balance),
        currency: wallet.currency,
        status: wallet.status
      }
    });
  } catch (error) {
    console.error("Get wallet balance error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error while fetching wallet"
    });
  }
};

// ============================
// INITIATE DEPOSIT (Paystack)
// ============================
export const initiateDeposit = async (req, res) => {
  try {
    const { amount } = req.body;
    const userId = req.user.id;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be greater than 0"
      });
    }

    const userResult = await pool.query(
      "SELECT email, fullname FROM extensions.users WHERE id = $1",
      [userId]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    const user = userResult.rows[0];

    const wallet = await getUserWallet(userId);
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found"
      });
    }

    const reference = `DEP_${Date.now()}_${userId}_${Math.floor(Math.random() * 10000)}`;

    const transactionResult = await pool.query(
      `INSERT INTO extensions.transactions 
        (reference, user_id, wallet_id, amount, type, status, description, meta_data, created_at)
       VALUES ($1, $2, $3, $4, 'deposit', 'pending', $5, $6, NOW())
       RETURNING id`,
      [reference, userId, wallet.id, amount, `Deposit of ₦${amount}`, JSON.stringify({ initiated_at: new Date() })]
    );

    let paystackData;
    try {
      const paystackRes = await axios.post(
        'https://api.paystack.co/transaction/initialize',
        {
          email: user.email,
          amount: amount * 100,
          reference: reference,
          callback_url: process.env.PAYSTACK_CALLBACK_URL || 'https://your-frontend.com/wallet',
          metadata: {
            user_id: userId,
            wallet_id: wallet.id,
            transaction_id: transactionResult.rows[0].id
          }
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      paystackData = paystackRes.data.data;
    } catch (paystackErr) {
      console.error("Paystack initialization error:", paystackErr.response?.data || paystackErr.message);
      await pool.query(
        "UPDATE extensions.transactions SET status = 'failed', meta_data = meta_data || $1 WHERE reference = $2",
        [JSON.stringify({ paystack_error: paystackErr.message }), reference]
      );
      return res.status(502).json({
        success: false,
        message: "Payment gateway error. Please try again later."
      });
    }

    await pool.query(
      "UPDATE extensions.transactions SET paystack_reference = $1 WHERE reference = $2",
      [paystackData.reference, reference]
    );

    res.status(200).json({
      success: true,
      message: "Deposit initiated",
      data: {
        authorization_url: paystackData.authorization_url,
        reference: reference,
        amount: amount
      }
    });
  } catch (error) {
    console.error("Initiate deposit error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error while initiating deposit"
    });
  }
};

// ============================
// GET WALLET TRANSACTIONS
// ============================
export const getWalletTransactions = async (req, res) => {
  try {
    const userId = req.user.id;
    const wallet = await getUserWallet(userId);
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found"
      });
    }
    const transactions = await pool.query(
      `SELECT reference, amount, type, status, description, paystack_reference, created_at
       FROM extensions.transactions
       WHERE user_id = $1 AND wallet_id = $2
       ORDER BY created_at DESC
       LIMIT 50`,
      [userId, wallet.id]
    );
    res.status(200).json({
      success: true,
      transactions: transactions.rows
    });
  } catch (error) {
    console.error("Get wallet transactions error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error while fetching transactions"
    });
  }
};

// ============================
// CREDIT WALLET AFTER PAYSTACK WEBHOOK
// ============================
export const creditWalletAfterPayment = async (paystackReference, amountPaid) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const txResult = await client.query(
      `SELECT id, user_id, wallet_id, amount, reference 
       FROM extensions.transactions 
       WHERE paystack_reference = $1 AND status = 'pending'`,
      [paystackReference]
    );

    if (txResult.rows.length === 0) {
      console.log(`No pending transaction found for ref: ${paystackReference}`);
      await client.query('ROLLBACK');
      return { success: false, message: "Transaction not found or already processed" };
    }

    const tx = txResult.rows[0];
    if (tx.amount !== amountPaid) {
      await client.query(
        `UPDATE extensions.transactions 
         SET status = 'failed', meta_data = meta_data || $1 
         WHERE id = $2`,
        [JSON.stringify({ webhook_amount_mismatch: true, expected: tx.amount, received: amountPaid }), tx.id]
      );
      await client.query('COMMIT');
      return { success: false, message: "Amount mismatch" };
    }

    await client.query(
      `UPDATE extensions.wallets 
       SET balance = balance + $1, updated_at = NOW() 
       WHERE id = $2`,
      [tx.amount, tx.wallet_id]
    );

    await client.query(
      `UPDATE extensions.transactions 
       SET status = 'success', meta_data = meta_data || $1 
       WHERE id = $2`,
      [JSON.stringify({ webhook_processed: true, processed_at: new Date() }), tx.id]
    );

    await client.query('COMMIT');
    return { success: true, message: "Wallet credited successfully" };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Credit wallet error:", error.message);
    return { success: false, message: error.message };
  } finally {
    client.release();
  }
};