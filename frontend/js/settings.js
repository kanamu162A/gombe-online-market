import { dashboardAPI } from '../api.js';
import { showToast } from '../utils.js';

export async function renderSettings(container) {
  container.innerHTML = `
    <div class="section-card">
      <div class="section-header"><h3>⚙️ Profile Settings</h3></div>
      <form id="settingsForm">
        <div class="form-group"><label>Display Name *</label><input type="text" id="settingsName" required></div>
        <div class="form-group"><label>Phone Number</label><input type="tel" id="settingsPhone"></div>
        <button type="submit" class="btn-primary">Save Changes</button>
      </form>
    </div>
  `;
  await loadProfile();
  document.getElementById('settingsForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const profile = {
      name: document.getElementById('settingsName').value.trim(),
      phone: document.getElementById('settingsPhone').value.trim(),
    };
    try {
      await dashboardAPI.updateProfile(profile);
      showToast('✅ Profile updated');
      await loadProfile();
      // update sidebar user name
      document.getElementById('sidebarUserName').innerText = profile.name || 'User';
      document.getElementById('userAvatarLarge').innerText = (profile.name || 'U').charAt(0).toUpperCase();
    } catch (err) { showToast(err.message, 'error'); }
  });
}

async function loadProfile() {
  try {
    const data = await dashboardAPI.getStats();
    const user = data.data.user;
    document.getElementById('settingsName').value = user.name || '';
    document.getElementById('settingsPhone').value = user.phone || '';
  } catch (e) { showToast(e.message, 'error'); }
}