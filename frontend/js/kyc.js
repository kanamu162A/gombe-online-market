import { dashboardAPI } from '../api.js';
import { showToast } from '../utils.js';

export async function renderKYC(container) {
  container.innerHTML = `
    <div class="section-card">
      <div class="section-header"><h3>🛡️ KYC Verification</h3></div>
      <div id="kycStatusMsg"></div>
      <form id="kycForm">
        <div class="form-group"><label>Full Name *</label><input type="text" id="kycName" required></div>
        <div class="form-group"><label>ID Type *</label><select id="kycIdType"><option>National ID</option><option>Passport</option><option>Driver's License</option></select></div>
        <div class="form-group"><label>ID Number *</label><input type="text" id="kycIdNumber" required></div>
        <div class="form-group"><label>Address *</label><textarea id="kycAddress" rows="2" required></textarea></div>
        <button type="submit" class="btn-primary">Submit KYC</button>
      </form>
    </div>
  `;
  await loadStatus();
  document.getElementById('kycForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
      fullname: document.getElementById('kycName').value.trim(),
      idType: document.getElementById('kycIdType').value,
      idNumber: document.getElementById('kycIdNumber').value.trim(),
      address: document.getElementById('kycAddress').value.trim(),
    };
    try {
      await dashboardAPI.submitKyc(data);
      showToast('✅ KYC submitted', 'success');
      await loadStatus();
    } catch (err) { showToast(err.message, 'error'); }
  });
}

async function loadStatus() {
  try {
    const data = await dashboardAPI.getKyc();
    const status = data.data.status;
    const msgDiv = document.getElementById('kycStatusMsg');
    const colors = { verified: '#10b981', submitted: '#f59e0b', rejected: '#ef4444', unverified: '#94a3b8' };
    const color = colors[status] || '#94a3b8';
    msgDiv.innerHTML = `<div style="margin-bottom:1rem;padding:0.8rem;background:#f8fafc;border-left:4px solid ${color};"><strong>Status:</strong> <span style="color:${color};">${status}</span></div>`;
    document.getElementById('kycForm').style.display = (status === 'submitted' || status === 'verified') ? 'none' : 'block';
  } catch (e) { console.error(e); }
}