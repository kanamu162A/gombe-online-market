import { dashboardAPI } from '../api.js';
import { showToast, formatCurrency } from '../utils.js';

export async function renderOverview(container) {
  container.innerHTML = `
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-icon orange"><i class="fas fa-shopping-cart"></i></div><div><div class="stat-value" id="totalOrders">0</div><div class="stat-label">Total Orders</div></div></div>
      <div class="stat-card"><div class="stat-icon blue"><i class="fas fa-naira-sign"></i></div><div><div class="stat-value" id="totalSpent">₦0</div><div class="stat-label">Total Spent</div></div></div>
      <div class="stat-card"><div class="stat-icon purple"><i class="fas fa-clock"></i></div><div><div class="stat-value" id="pendingOrders">0</div><div class="stat-label">Pending</div></div></div>
      <div class="stat-card"><div class="stat-icon green"><i class="fas fa-check-circle"></i></div><div><div class="stat-value" id="completedOrders">0</div><div class="stat-label">Completed</div></div></div>
    </div>
    <div class="wallet-card">
      <div><div class="wallet-label">💰 Wallet Balance</div><div class="wallet-balance" id="walletBalance">₦0.00</div><div class="wallet-account" id="copyAccountBtn"><span id="virtualAccount">Not assigned</span> <i class="fas fa-copy"></i></div></div>
      <button class="btn-primary" id="goToTransactionsBtn">History</button>
    </div>
    <div class="section-card"><div class="section-header"><h3>📦 Recent Orders</h3><button class="link-btn" id="goToOrdersBtn">View All →</button></div><div id="recentOrdersList"></div></div>
  `;

  await loadData();
  document.getElementById('goToTransactionsBtn')?.addEventListener('click', () => window.switchPage('transactions'));
  document.getElementById('goToOrdersBtn')?.addEventListener('click', () => window.switchPage('orders'));
  document.getElementById('copyAccountBtn')?.addEventListener('click', () => {
    const acc = document.getElementById('virtualAccount')?.innerText;
    if (acc && acc !== 'Not assigned') {
      navigator.clipboard.writeText(acc).then(() => showToast('📋 Copied!')).catch(() => showToast('Failed to copy', 'error'));
    } else showToast('No account assigned', 'error');
  });
}

async function loadData() {
  try {
    const data = await dashboardAPI.getStats();
    const { user, stats, recentOrders } = data.data;
    document.getElementById('totalOrders').innerText = stats.totalOrders ?? 0;
    document.getElementById('totalSpent').innerHTML = formatCurrency(stats.totalSpent ?? 0);
    document.getElementById('pendingOrders').innerText = stats.pendingOrders ?? 0;
    document.getElementById('completedOrders').innerText = stats.completedOrders ?? 0;
    document.getElementById('walletBalance').innerHTML = formatCurrency(user.walletBalance || 0);
    document.getElementById('virtualAccount').innerText = user.accountNumber || 'Not assigned';
    document.getElementById('pendingBadge').innerText = stats.pendingOrders ?? 0;
    const recentDiv = document.getElementById('recentOrdersList');
    if (recentOrders?.length) {
      recentDiv.innerHTML = recentOrders.map(o => `
        <div class="list-item">
          <div class="list-item-left"><div class="list-item-thumb"><i class="fas fa-box"></i></div><div><strong>${o.order_number}</strong><small>${new Date(o.created_at).toLocaleDateString()}</small></div></div>
          <span class="status-badge status-${o.status}">${o.status}</span>
          <strong>${formatCurrency(o.total_amount)}</strong>
        </div>
      `).join('');
    } else {
      recentDiv.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><p>No recent orders</p></div>';
    }
    // also update sidebar user name
    document.getElementById('sidebarUserName').innerText = user.name || 'User';
    document.getElementById('userAvatarLarge').innerText = (user.name || 'U').charAt(0).toUpperCase();
  } catch (e) {
    showToast(e.message, 'error');
  }
}