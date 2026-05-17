  const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:4040'
    : 'https://94kgn103-4040.uks1.devtunnels.ms/';  // change to your live domain

        const token = localStorage.getItem('token');
        if (!token) window.location.href = 'login.html';

        function showToast(msg, type = 'success') {
            const container = document.getElementById('toastContainer');
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            toast.textContent = msg;
            container.appendChild(toast);
            requestAnimationFrame(() => toast.classList.add('show'));
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 350);
            }, 3000);
        }

        function formatCurrency(amt) {
            return '₦' + Number(amt).toLocaleString('en-NG', { minimumFractionDigits: 2 });
        }

        async function apiCall(endpoint, options = {}) {
            const url = `${BASE_URL}/api/dashboard${endpoint}`;
            const res = await fetch(url, {
                ...options,
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', ...options.headers }
            });
            if (!res.ok) {
                const text = await res.text();
                let message;
                try { message = JSON.parse(text).message; } catch { message = text || `HTTP ${res.status}`; }
                throw new Error(message);
            }
            return res.json();
        }

        function escapeHtml(text) {
            const div = document.createElement('div');
            div.appendChild(document.createTextNode(text));
            return div.innerHTML;
        }

        function getSeasonalMessage() {
            const now = new Date();
            const month = now.getMonth() + 1;
            const day = now.getDate();
            if (month === 12 && day >= 20) return { text: '🎄 Merry Christmas & Happy Holidays! 🎄', icon: 'fa-tree' };
            if (month === 1 && day <= 5) return { text: '🎉 Happy New Year! Welcome 2025! 🎉', icon: 'fa-champagne-glasses' };
            if (month === 10 && day === 1) return { text: '🇳🇬 Happy Independence Day Nigeria! 🇳🇬', icon: 'fa-flag' };
            if ((month === 4 && day >= 10) || (month === 5 && day <= 15)) return { text: '🌙 Eid Mubarak! 🌙', icon: 'fa-star-and-crescent' };
            if (month === 6 && day === 12) return { text: '🎉 Happy Democracy Day Nigeria! 🇳🇬', icon: 'fa-democrat' };
            return null;
        }

        async function loadAnnouncement() {
            try {
                const res = await fetch(`${BASE_URL}/api/announcements/active`, { headers: { 'Authorization': `Bearer ${token}` } });
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.message) { displayAnnouncement(data.message, data.icon || 'fa-bullhorn'); return; }
                }
            } catch (e) {}
            const seasonal = getSeasonalMessage();
            if (seasonal) { displayAnnouncement(seasonal.text, seasonal.icon); return; }
            displayAnnouncement('🔥 New: Upload product images directly! List your items now.', 'fa-image');
        }

        function displayAnnouncement(text, iconClass) {
            const bar = document.getElementById('announcementBar');
            document.getElementById('announcementText').innerText = text;
            bar.querySelector('i').className = `fas ${iconClass}`;
            const dismissed = localStorage.getItem('announcementDismissed');
            if (!dismissed || (Date.now() - parseInt(dismissed) > 24 * 60 * 60 * 1000)) bar.style.display = 'flex';
        }

        function dismissAnnouncement() {
            document.getElementById('announcementBar').style.display = 'none';
            localStorage.setItem('announcementDismissed', Date.now().toString());
        }

        async function loadDashboard() {
            try {
                const data = await apiCall('/stats');
                if (!data.data || !data.data.user || !data.data.stats) throw new Error('Invalid dashboard data');
                const user = data.data.user;
                const stats = data.data.stats;
                document.getElementById('sidebarUserName').innerText = user.name || 'User';
                document.getElementById('userAvatarLarge').innerText = (user.name || 'U').charAt(0).toUpperCase();
                document.getElementById('walletBalance').innerHTML = formatCurrency(user.walletBalance || 0);
                document.getElementById('virtualAccount').innerText = user.accountNumber || 'Not assigned';
                document.getElementById('totalOrders').innerText = stats.totalOrders ?? 0;
                document.getElementById('totalSpent').innerHTML = formatCurrency(stats.totalSpent ?? 0);
                document.getElementById('pendingOrders').innerText = stats.pendingOrders ?? 0;
                document.getElementById('completedOrders').innerText = stats.completedOrders ?? 0;
                document.getElementById('pendingBadge').innerText = stats.pendingOrders ?? 0;
                const recent = data.data.recentOrders;
                const rList = document.getElementById('recentOrdersList');
                if (recent && recent.length) {
                    rList.innerHTML = recent.map(o => `
                        <div class="list-item">
                            <div class="list-item-left">
                                <div class="list-item-thumb"><i class="fas fa-box"></i></div>
                                <div class="list-item-info">
                                    <strong>${o.order_number}</strong>
                                    <small>${new Date(o.created_at).toLocaleDateString('en-NG', {day:'numeric',month:'short',year:'numeric'})}</small>
                                </div>
                            </div>
                            <span class="status-badge status-${o.status}">${o.status}</span>
                            <strong>${formatCurrency(o.total_amount)}</strong>
                        </div>`).join('');
                } else {
                    rList.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><p>No recent orders</p></div>';
                }
            } catch (e) { showToast(e.message, 'error'); }
        }

        async function loadOrders(status = 'all') {
            try {
                const url = status !== 'all' ? `/orders?status=${status}` : '/orders';
                const data = await apiCall(url);
                const list = document.getElementById('ordersList');
                if (!data.data || !data.data.length) {
                    list.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><p>No orders found</p></div>';
                    return;
                }
                list.innerHTML = data.data.map(o => `
                    <div class="list-item">
                        <div class="list-item-left">
                            <div class="list-item-thumb"><i class="fas fa-receipt"></i></div>
                            <div class="list-item-info">
                                <strong>${o.order_number}</strong>
                                <small>${new Date(o.created_at).toLocaleDateString('en-NG', {day:'numeric',month:'short',year:'numeric'})}</small>
                                ${o.items ? '<small>' + o.items.map(i => `${i.product_name} ×${i.quantity}`).join(', ') + '</small>' : ''}
                            </div>
                        </div>
                        <span class="status-badge status-${o.status}">${o.status}</span>
                        <strong>${formatCurrency(o.total_amount)}</strong>
                    </div>`).join('');
            } catch (e) { showToast(e.message, 'error'); }
        }

        async function loadTransactions(type = 'all') {
            try {
                const url = type !== 'all' ? `/transactions?type=${type}` : '/transactions';
                const data = await apiCall(url);
                const list = document.getElementById('transactionsList');
                if (!data.data || !data.data.length) {
                    list.innerHTML = '<div class="empty-state"><i class="fas fa-receipt"></i><p>No transactions yet</p></div>';
                    return;
                }
                list.innerHTML = data.data.map(t => `
                    <div class="list-item">
                        <div class="list-item-left">
                            <div class="list-item-thumb" style="background:${t.type==='credit'?'#ecfdf5':'#fef2f2'};color:${t.type==='credit'?'#10b981':'#ef4444'};">
                                <i class="fas fa-${t.type==='credit'?'arrow-down':'arrow-up'}"></i>
                            </div>
                            <div class="list-item-info">
                                <strong>${t.description}</strong>
                                <small>${new Date(t.created_at).toLocaleString('en-NG')}</small>
                            </div>
                        </div>
                        <span class="${t.type==='credit'?'amount-credit':'amount-debit'}">${t.type==='credit'?'+':'−'}${formatCurrency(t.amount)}</span>
                    </div>`).join('');
            } catch (e) { showToast(e.message, 'error'); }
        }

        function fileToBase64(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve(reader.result);
                reader.onerror = error => reject(error);
            });
        }

        document.getElementById('productImageFile').addEventListener('change', function(e) {
            const preview = document.getElementById('imagePreview');
            const uploadArea = document.getElementById('imageUploadArea');
            if (e.target.files && e.target.files[0]) {
                const reader = new FileReader();
                reader.onload = function(ev) {
                    preview.innerHTML = `<img src="${ev.target.result}" class="image-preview-thumb" style="width:100px;height:100px;" alt="Preview">`;
                    uploadArea.style.borderColor = '#10b981';
                    uploadArea.querySelector('i').style.color = '#10b981';
                };
                reader.readAsDataURL(e.target.files[0]);
            } else {
                preview.innerHTML = '';
                uploadArea.style.borderColor = '#cbd5e1';
                uploadArea.querySelector('i').style.color = '#94a3b8';
            }
        });

        document.getElementById('editProductImageFile').addEventListener('change', function(e) {
            const preview = document.getElementById('editImagePreview');
            if (e.target.files && e.target.files[0]) {
                const reader = new FileReader();
                reader.onload = function(ev) {
                    preview.innerHTML = `<img src="${ev.target.result}" class="image-preview-thumb" style="width:100px;height:100px;" alt="Preview">`;
                };
                reader.readAsDataURL(e.target.files[0]);
            } else { preview.innerHTML = ''; }
        });

        document.getElementById('productForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('productName').value.trim();
            const price = parseFloat(document.getElementById('productPrice').value);
            const stock = parseInt(document.getElementById('productStock').value) || 1;
            const category = document.getElementById('productCategory').value.trim();
            const description = document.getElementById('productDesc').value.trim();
            const imageFile = document.getElementById('productImageFile').files[0];
            let images = [];
            if (imageFile) {
                try { images = [await fileToBase64(imageFile)]; } catch (e) { showToast('Image conversion failed', 'error'); return; }
            }
            try {
                await apiCall('/products', { method: 'POST', body: JSON.stringify({ name, price, stock, category, description, images }) });
                showToast('✅ Product posted successfully!', 'success');
                document.getElementById('productForm').reset();
                document.getElementById('imagePreview').innerHTML = '';
                document.getElementById('imageUploadArea').style.borderColor = '#cbd5e1';
                document.getElementById('imageUploadArea').querySelector('i').style.color = '#94a3b8';
                loadMyProducts();
            } catch (err) { showToast(err.message, 'error'); }
        });

        window.productsMap = new Map();

        async function loadMyProducts() {
            try {
                const data = await apiCall('/products');
                const list = document.getElementById('myProductsList');
                if (!data.data || !data.data.length) {
                    list.innerHTML = '<div class="empty-state"><i class="fas fa-store-slash"></i><p>No products listed yet</p></div>';
                    window.productsMap.clear();
                    return;
                }
                window.productsMap = new Map(data.data.map(p => [p.id, p]));
                list.innerHTML = data.data.map(p => `
                    <div class="list-item" data-product-id="${p.id}">
                        <div class="list-item-left">
                            <div class="list-item-thumb">
                                ${p.images && p.images[0] ? `<img src="${p.images[0]}" style="width:100%;height:100%;object-fit:cover;border-radius:10px;" alt="${escapeHtml(p.name)}">` : '<i class="fas fa-box"></i>'}
                            </div>
                            <div class="list-item-info">
                                <strong>${escapeHtml(p.name)}</strong>
                                <small>${escapeHtml(p.category || 'General')} · Stock: ${p.stock || 1}</small>
                            </div>
                        </div>
                        <strong style="color:var(--primary);">${formatCurrency(p.price)}</strong>
                        <div class="list-item-actions">
                            <button class="action-btn edit edit-product-btn" title="Edit"><i class="fas fa-pen"></i></button>
                            <button class="action-btn delete delete-product-btn" title="Delete"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>`).join('');

                list.onclick = (e) => {
                    const editBtn = e.target.closest('.edit-product-btn');
                    const deleteBtn = e.target.closest('.delete-product-btn');
                    const item = e.target.closest('.list-item');
                    if (!item) return;
                    const id = parseInt(item.dataset.productId);
                    if (editBtn) openEditModalFromData(id);
                    if (deleteBtn) deleteProduct(id);
                };
            } catch (e) { showToast(e.message, 'error'); }
        }

        function openEditModalFromData(id) {
            const p = window.productsMap.get(id);
            if (!p) return;
            document.getElementById('editProductId').value = id;
            document.getElementById('editProductName').value = p.name;
            document.getElementById('editProductPrice').value = p.price;
            document.getElementById('editProductStock').value = p.stock;
            document.getElementById('editProductCategory').value = p.category || 'General';
            document.getElementById('editProductDesc').value = p.description || '';
            document.getElementById('editImagePreview').innerHTML = p.images && p.images[0] ? `<img src="${p.images[0]}" class="image-preview-thumb" style="width:100px;height:100px;" alt="Current">` : '';
            document.getElementById('editProductImageFile').value = '';
            document.getElementById('editModalOverlay').classList.add('show');
        }

        function closeEditModal() {
            document.getElementById('editModalOverlay').classList.remove('show');
        }
        document.getElementById('editModalOverlay').addEventListener('click', function(e) { if (e.target === this) closeEditModal(); });

        document.getElementById('editProductForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            const id = document.getElementById('editProductId').value;
            const name = document.getElementById('editProductName').value.trim();
            const price = parseFloat(document.getElementById('editProductPrice').value);
            const stock = parseInt(document.getElementById('editProductStock').value) || 1;
            const category = document.getElementById('editProductCategory').value.trim();
            const description = document.getElementById('editProductDesc').value.trim();
            const imageFile = document.getElementById('editProductImageFile').files[0];
            const updateData = { name, price, stock, category, description };
            if (imageFile) {
                try { updateData.images = [await fileToBase64(imageFile)]; } catch (e) { showToast('Image conversion failed', 'error'); return; }
            }
            try {
                await apiCall(`/products/${id}`, { method: 'PUT', body: JSON.stringify(updateData) });
                showToast('✅ Product updated!', 'success');
                closeEditModal();
                loadMyProducts();
            } catch (err) { showToast(err.message, 'error'); }
        });

        window.deleteProduct = async (id) => {
            if (confirm('Delete this product?')) {
                try {
                    await apiCall(`/products/${id}`, { method: 'DELETE' });
                    showToast('🗑️ Product deleted', 'success');
                    loadMyProducts();
                } catch (e) { showToast(e.message, 'error'); }
            }
        };

        async function loadKycStatus() {
            try {
                const data = await apiCall('/kyc');
                const status = data.data.status;
                const msgDiv = document.getElementById('kycStatusMsg');
                const colors = { verified: '#10b981', submitted: '#f59e0b', rejected: '#ef4444', unverified: '#94a3b8' };
                const color = colors[status] || '#94a3b8';
                msgDiv.innerHTML = `<div style="margin-bottom:1rem;padding:0.8rem 1rem;background:#f8fafc;border-radius:12px;border-left:4px solid ${color};"><strong>Status:</strong> <span style="color:${color};text-transform:capitalize;">${status}</span></div>`;
                document.getElementById('kycForm').style.display = (status === 'submitted' || status === 'verified') ? 'none' : 'block';
            } catch (e) { console.error(e); }
        }

        document.getElementById('kycForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const kycData = {
                fullname: document.getElementById('kycName').value.trim(),
                idType: document.getElementById('kycIdType').value,
                idNumber: document.getElementById('kycIdNumber').value.trim(),
                address: document.getElementById('kycAddress').value.trim()
            };
            try {
                await apiCall('/kyc', { method: 'POST', body: JSON.stringify(kycData) });
                showToast('✅ KYC submitted', 'success');
                loadKycStatus();
            } catch (e) { showToast(e.message, 'error'); }
        });

        async function loadProfile() {
            try {
                const data = await apiCall('/stats');
                document.getElementById('settingsName').value = data.data.user.name || '';
                document.getElementById('settingsPhone').value = data.data.user.phone || '';
            } catch (e) { showToast(e.message, 'error'); }
        }

        document.getElementById('settingsForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const profile = {
                name: document.getElementById('settingsName').value.trim(),
                phone: document.getElementById('settingsPhone').value.trim()
            };
            try {
                await apiCall('/profile', { method: 'PUT', body: JSON.stringify(profile) });
                showToast('✅ Profile updated', 'success');
                loadDashboard();
            } catch (e) { showToast(e.message, 'error'); }
        });

        const pageTitles = { overview:'Dashboard', orders:'My Orders', transactions:'Transaction History', sell:'Sell Products', kyc:'KYC Verification', settings:'Profile Settings' };
        const breadcrumbs = { overview:'Overview', orders:'Orders & Tracking', transactions:'Wallet Transactions', sell:'Product Management', kyc:'Identity Verification', settings:'Account Settings' };

        function switchPage(page) {
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
            document.getElementById(`${page}Page`).classList.add('active');
            document.querySelectorAll('.nav-link').forEach(n => n.classList.remove('active'));
            document.querySelector(`[data-page="${page}"]`).classList.add('active');
            document.getElementById('pageTitle').innerText = pageTitles[page] || page;
            document.getElementById('breadcrumb').innerText = breadcrumbs[page] || '';
            document.getElementById('sidebar').classList.remove('open');
            document.getElementById('sidebarOverlay').classList.remove('show');
            if (page === 'overview') loadDashboard();
            if (page === 'orders') loadOrders();
            if (page === 'transactions') loadTransactions();
            if (page === 'sell') loadMyProducts();
            if (page === 'kyc') loadKycStatus();
            if (page === 'settings') loadProfile();
        }
        window.switchPage = switchPage;

        document.querySelectorAll('.nav-link').forEach(item => item.addEventListener('click', () => switchPage(item.dataset.page)));
        document.querySelectorAll('#ordersPage .filter-pill').forEach(pill => pill.addEventListener('click', function() {
            document.querySelectorAll('#ordersPage .filter-pill').forEach(p => p.classList.remove('active'));
            this.classList.add('active');
            loadOrders(this.dataset.status);
        }));
        document.querySelectorAll('#transactionsPage .filter-pill').forEach(pill => pill.addEventListener('click', function() {
            document.querySelectorAll('#transactionsPage .filter-pill').forEach(p => p.classList.remove('active'));
            this.classList.add('active');
            loadTransactions(this.dataset.tx);
        }));

        document.getElementById('menuBtn').addEventListener('click', () => {
            document.getElementById('sidebar').classList.add('open');
            document.getElementById('sidebarOverlay').classList.add('show');
        });
        document.getElementById('sidebarOverlay').addEventListener('click', () => {
            document.getElementById('sidebar').classList.remove('open');
            document.getElementById('sidebarOverlay').classList.remove('show');
        });

        function handleLogout() {
            localStorage.removeItem('token');
            window.location.href = 'login.html';
        }
        document.getElementById('logoutBtn').addEventListener('click', handleLogout);
        document.getElementById('logoutSidebarBtn').addEventListener('click', handleLogout);

        document.getElementById('copyAccountBtn').addEventListener('click', () => {
            const acc = document.getElementById('virtualAccount').innerText;
            if (acc && acc !== 'Not assigned') {
                navigator.clipboard.writeText(acc).then(() => showToast('📋 Account number copied!', 'success'))
                    .catch(() => showToast('Failed to copy', 'error'));
            } else showToast('No account assigned', 'error');
        });

        loadDashboard();
        loadOrders('all');
        loadTransactions('all');
        loadAnnouncement();