import { dashboardAPI } from '../api.js';
import { showToast, formatCurrency } from '../utils.js';

let currentStatus = 'all';

export async function renderOrders(container) {
  container.innerHTML = `
    <div class="section-card">
      <div class="section-header"><h3>📦 My Orders</h3></div>
      <div class="filter-pills">
        <button class="filter-pill active" data-status="all">All Orders</button>
        <button class="filter-pill" data-status="pending">Pending</button>
        <button class="filter-pill" data-status="processing">Processing</button>
        <button class="filter-pill" data-status="completed">Completed</button>
      </div>
      <div id="ordersList"></div>
    </div>
  `;
  document.querySelectorAll('.filter-pill').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      document.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentStatus = btn.dataset.status;
      await loadOrders();
    });
  });
  await loadOrders();
}

async function loadOrders() {
  const listDiv = document.getElementById('ordersList');
  try {
    const data = await dashboardAPI.getOrders(currentStatus);
    if (!data.data?.length) {
      listDiv.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><p>No orders found</p></div>';
      return;
    }
    listDiv.innerHTML = data.data.map(o => `
      <div class="list-item">
        <div class="list-item-left"><div class="list-item-thumb"><i class="fas fa-receipt"></i></div><div><strong>${o.order_number}</strong><small>${new Date(o.created_at).toLocaleDateString()}</small>${o.items ? '<small>' + o.items.map(i => `${i.product_name} ×${i.quantity}`).join(', ') + '</small>' : ''}</div></div>
        <span class="status-badge status-${o.status}">${o.status}</span>
        <strong>${formatCurrency(o.total_amount)}</strong>
      </div>
    `).join('');
  } catch (e) {
    showToast(e.message, 'error');
  }
}