// === CONFIGURATION ===
const API_BASE = 'http://localhost:4040';

// === DOM elements ===
const fullnameEl = document.getElementById('fullname');
const emailEl = document.getElementById('email');
const phoneEl = document.getElementById('phone');
const passEl = document.getElementById('password');
const confirmEl = document.getElementById('confirm');
const registerBtn = document.getElementById('registerBtn');
const toast = document.getElementById('toastMsg');

// Save original button text
const ORIGINAL_BTN_TEXT = '<span>Create account</span> <i class="fas fa-arrow-right"></i>';
const LOADING_BTN_TEXT = '<i class="fas fa-spinner fa-pulse"></i> Creating account...';

// === Helpers ===
function showMessage(text, type = 'error') {
  toast.textContent = text;
  toast.className = `toast-message ${type}`;
  setTimeout(() => {
    toast.style.display = 'none';
    toast.className = 'toast-message';
  }, 5000);
}

function setButtonLoading(isLoading) {
  registerBtn.disabled = isLoading;
  registerBtn.innerHTML = isLoading ? LOADING_BTN_TEXT : ORIGINAL_BTN_TEXT;
}

function generateUsername(fullname) {
  let base = fullname.toLowerCase().replace(/[^a-z0-9]/g, '');
  const rand = Math.floor(Math.random() * 10000);
  return `${base}${rand}`;
}

function validateForm() {
  const fullname = fullnameEl.value.trim();
  const email = emailEl.value.trim();
  const phone = phoneEl.value.trim();
  const pass = passEl.value;
  const confirm = confirmEl.value;

  if (!fullname || !email || !phone || !pass || !confirm) {
    showMessage('All fields are required', 'error');
    return false;
  }
  if (pass !== confirm) {
    showMessage('Passwords do not match', 'error');
    return false;
  }
  if (pass.length < 8) {
    showMessage('Password must be at least 8 characters', 'error');
    return false;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showMessage('Enter a valid email address', 'error');
    return false;
  }
  const phoneDigits = phone.replace(/\D/g, '');
  if (phoneDigits.length < 10 || phoneDigits.length > 15) {
    showMessage('Phone number must be 10–15 digits', 'error');
    return false;
  }
  return true;
}

// === REGISTER API CALL ===
async function registerUser() {
  if (!validateForm()) return;

  const fullname = fullnameEl.value.trim();
  const email = emailEl.value.trim();
  const phone = phoneEl.value.trim();
  const password = passEl.value;
  const username = generateUsername(fullname);

  // Disable button and show loading
  setButtonLoading(true);

  try {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullname, username, email, phone, password })
    });
    const data = await res.json();

    if (res.ok && data.success) {
      const accNumber = data.user.accountNumber;
      showMessage(`✅ Account created! Virtual account: ${accNumber}. Redirecting...`, 'success');
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 2800);
    } else {
      const errMsg = data.message || 'Registration failed. Try again.';
      showMessage(errMsg, 'error');
      setButtonLoading(false); // Re-enable button
    }
  } catch (err) {
    console.error(err);
    showMessage('Network error. Is backend running?', 'error');
    setButtonLoading(false); // Re-enable button
  }
}

// === TOGGLE PASSWORD ===
function setupPasswordToggles() {
  const toggles = document.querySelectorAll('.toggle-pass');
  toggles.forEach(toggle => {
    toggle.addEventListener('click', function () {
      const input = this.previousElementSibling;
      const type = input.type === 'password' ? 'text' : 'password';
      input.type = type;
      this.classList.toggle('fa-eye');
      this.classList.toggle('fa-eye-slash');
    });
  });
}

// === SOCIAL PLACEHOLDERS ===
function socialSignup(provider) {
  showMessage(`${provider} signup coming soon. Use email registration.`, 'error');
}

// === INIT ===
document.addEventListener('DOMContentLoaded', () => {
  registerBtn.addEventListener('click', registerUser);
  setupPasswordToggles();

  // Allow Enter key on any field
  const inputs = [fullnameEl, emailEl, phoneEl, passEl, confirmEl];
  inputs.forEach(inp => inp.addEventListener('keypress', e => {
    if (e.key === 'Enter') registerUser();
  }));

  // Social buttons
  const googleBtn = document.querySelector('.social.google');
  const fbBtn = document.querySelector('.social.facebook');
  if (googleBtn) googleBtn.addEventListener('click', () => socialSignup('Google'));
  if (fbBtn) fbBtn.addEventListener('click', () => socialSignup('Facebook'));
});