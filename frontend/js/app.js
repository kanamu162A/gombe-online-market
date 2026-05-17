import { renderOverview } from './pages/overview.js';
import { renderOrders } from './pages/orders.js';
import { renderTransactions } from './pages/transactions.js';
import { renderSell } from './pages/sell.js';
import { renderKYC } from './pages/kyc.js';
import { renderSettings } from './pages/settings.js';

const token = localStorage.getItem('token');
if (!token) window.location.href = 'login.html';

const pageMap = {
  overview: renderOverview,
  orders: renderOrders,
  transactions: renderTransactions,
  sell: renderSell,
  kyc: renderKYC,
  settings: renderSettings,
};

const pageTitles = {
  overview: 'Dashboard',
  orders: 'My Orders',
  transactions: 'Transaction History',
  sell: 'My Store',
  kyc: 'KYC Verification',
  settings: 'Profile Settings',
};

const breadcrumbs = {
  overview: 'Overview',
  orders: 'Orders & Tracking',
  transactions: 'Wallet Transactions',
  sell: 'Manage Products',
  kyc: 'Identity Verification',
  settings: 'Account',
};

let currentPage = null;

window.switchPage = async function(page) {
  if (currentPage === page) return;
  currentPage = page;
  const container = document.getElementById('pageContainer');
  container.innerHTML = '<div class="loading">Loading...</div>';
  await pageMap[page](container);
  document.querySelectorAll('.nav-link').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.page === page);
  });
  document.getElementById('pageTitle').innerText = pageTitles[page];
  document.getElementById('breadcrumb').innerText = breadcrumbs[page];
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('show');
};

// Event listeners after DOM ready
document.addEventListener('DOMContentLoaded', () => {
  // nav buttons
  document.querySelectorAll('.nav-link').forEach(btn => {
    btn.addEventListener('click', () => window.switchPage(btn.dataset.page));
  });
  // menu toggle
  document.getElementById('menuBtn').addEventListener('click', () => {
    document.getElementById('sidebar').classList.add('open');
    document.getElementById('sidebarOverlay').classList.add('show');
  });
  document.getElementById('sidebarOverlay').addEventListener('click', () => {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('show');
  });
  // logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = 'login.html';
  };
  document.getElementById('logoutBtn').addEventListener('click', handleLogout);
  document.getElementById('logoutSidebarBtn').addEventListener('click', handleLogout);
  // announcement close
  document.getElementById('closeAnnouncementBtn')?.addEventListener('click', () => {
    document.getElementById('announcementBar').style.display = 'none';
    localStorage.setItem('announcementDismissed', Date.now().toString());
  });
  // load seasonal announcement (optional)
  loadAnnouncement();
  // start with overview
  window.switchPage('overview');
});

async function loadAnnouncement() {
  try {
    const res = await fetch(`${window.location.origin}/api/announcements/active`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.message) {
        showAnnouncement(data.message);
        return;
      }
    }
  } catch (e) {}
  const seasonal = getSeasonalMessage();
  if (seasonal) showAnnouncement(seasonal.text);
  else showAnnouncement('🔥 New: Upload product images directly! List your items now.');
}

function showAnnouncement(text) {
  const bar = document.getElementById('announcementBar');
  if (!bar) return;
  document.getElementById('announcementText').innerText = text;
  const dismissed = localStorage.getItem('announcementDismissed');
  if (!dismissed || (Date.now() - parseInt(dismissed) > 86400000)) bar.style.display = 'flex';
}

function getSeasonalMessage() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  if (month === 12 && day >= 20) return { text: '🎄 Merry Christmas & Happy Holidays! 🎄' };
  if (month === 1 && day <= 5) return { text: '🎉 Happy New Year! Welcome 2025! 🎉' };
  if (month === 10 && day === 1) return { text: '🇳🇬 Happy Independence Day Nigeria! 🇳🇬' };
  if ((month === 4 && day >= 10) || (month === 5 && day <= 15)) return { text: '🌙 Eid Mubarak! 🌙' };
  if (month === 6 && day === 12) return { text: '🎉 Happy Democracy Day Nigeria! 🇳🇬' };
  return null;
}