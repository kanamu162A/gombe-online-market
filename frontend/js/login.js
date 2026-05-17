
  // ---------- Auto-detect API base URL ----------
  const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:4040'
    : 'https://your-production-api.com';  // change to your live domain

  const AUTH_API = `${API_BASE_URL}/api/auth`;

  // ---------- DOM elements ----------
  const panels = {
    login: document.getElementById('loginPanel'),
    forgot: document.getElementById('forgotPanel'),
    resetOtp: document.getElementById('resetOtpPanel'),
    newPassword: document.getElementById('newPasswordPanel')
  };
  const loginEmail = document.getElementById('loginEmail');
  const loginPassword = document.getElementById('loginPassword');
  const loginBtn = document.getElementById('loginBtn');
  const loginMessage = document.getElementById('loginMessage');
  const resetEmail = document.getElementById('resetEmail');
  const sendResetOtpBtn = document.getElementById('sendResetOtpBtn');
  const resetMessage = document.getElementById('resetMessage');
  const resetOtpDigits = document.querySelectorAll('.reset-otp-digit');
  const verifyResetOtpBtn = document.getElementById('verifyResetOtpBtn');
  const resendResetOtpBtn = document.getElementById('resendResetOtpBtn');
  const resetOtpMessage = document.getElementById('resetOtpMessage');
  const resetTimerSpan = document.getElementById('resetTimer');
  const newPassInput = document.getElementById('newPass');
  const confirmPassInput = document.getElementById('confirmPass');
  const resetPasswordBtn = document.getElementById('resetPasswordBtn');
  const newPassMessage = document.getElementById('newPassMessage');
  const strengthFill = document.getElementById('strengthFill');
  const strengthText = document.getElementById('strengthText');
  const reqElements = {
    len: document.getElementById('lenReq'),
    upper: document.getElementById('upperReq'),
    lower: document.getElementById('lowerReq'),
    num: document.getElementById('numReq'),
    spec: document.getElementById('specReq')
  };

  let resetUserId = null;
  let resetTimerInterval = null;

  // ---------- Helper functions ----------
  function showMessage(el, text, isSuccess = false) {
    if (!el) return;
    el.textContent = text;
    el.className = `toast-msg ${isSuccess ? 'success' : 'error'}`;
    setTimeout(() => { if (el) el.style.display = 'none'; }, 4000);
  }

  function clearMessage(el) { if (el) el.className = 'toast-msg'; }

  function setButtonLoading(btn, isLoading, originalText) {
    if (!btn) return;
    if (isLoading) {
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    } else {
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  }

  function switchPanel(panelId) {
    Object.values(panels).forEach(p => p.classList.remove('active'));
    panels[panelId].classList.add('active');
  }

  async function postJSON(url, body) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);
      return data;
    } finally {
      clearTimeout(timer);
    }
  }

  // OTP input handling
  function setupOtpInputs() {
    resetOtpDigits.forEach((input, idx) => {
      input.addEventListener('input', (e) => {
        let val = e.target.value.replace(/\D/g, '');
        if (val.length > 1) val = val.slice(0, 1);
        e.target.value = val;
        if (val && idx < resetOtpDigits.length - 1) resetOtpDigits[idx + 1].focus();
      });
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !input.value && idx > 0) resetOtpDigits[idx - 1].focus();
      });
    });
  }

  function startResetTimer(seconds) {
    clearInterval(resetTimerInterval);
    let sec = seconds;
    const tick = () => {
      resetTimerSpan.textContent = `⏱️ ${String(sec).padStart(2, '0')}:00`;
      if (sec-- <= 0) {
        clearInterval(resetTimerInterval);
        resetTimerSpan.textContent = '';
      }
    };
    tick();
    resetTimerInterval = setInterval(tick, 1000);
  }

  function stopResetTimer() {
    clearInterval(resetTimerInterval);
    resetTimerSpan.textContent = '';
  }

  function updatePasswordStrength() {
    const val = newPassInput.value;
    const checks = {
      len: val.length >= 8,
      upper: /[A-Z]/.test(val),
      lower: /[a-z]/.test(val),
      num: /[0-9]/.test(val),
      spec: /[@$!%*?&]/.test(val)
    };
    const score = Object.values(checks).filter(Boolean).length;
    const colors = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981'];
    const labels = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong'];
    strengthFill.style.width = `${score * 20}%`;
    strengthFill.style.background = colors[score] || colors[0];
    strengthText.textContent = labels[score] || 'Very weak';
    if (reqElements.len) {
      reqElements.len.classList.toggle('valid', checks.len);
      reqElements.len.querySelector('span').textContent = checks.len ? '✅' : '🔘';
      reqElements.upper.classList.toggle('valid', checks.upper);
      reqElements.upper.querySelector('span').textContent = checks.upper ? '✅' : '🔘';
      reqElements.lower.classList.toggle('valid', checks.lower);
      reqElements.lower.querySelector('span').textContent = checks.lower ? '✅' : '🔘';
      reqElements.num.classList.toggle('valid', checks.num);
      reqElements.num.querySelector('span').textContent = checks.num ? '✅' : '🔘';
      reqElements.spec.classList.toggle('valid', checks.spec);
      reqElements.spec.querySelector('span').textContent = checks.spec ? '✅' : '🔘';
    }
  }

  // ---------- Login handler ----------
  async function handleLogin() {
    const email = loginEmail.value.trim();
    const password = loginPassword.value;
    if (!email || !password) {
      showMessage(loginMessage, 'Please fill in both fields.', false);
      return;
    }
    const originalText = loginBtn.innerHTML;
    setButtonLoading(loginBtn, true, originalText);
    try {
      const data = await postJSON(`${AUTH_API}/login`, { email, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      window.location.href = 'dashboard.html';
    } catch (err) {
      showMessage(loginMessage, err.message, false);
      setButtonLoading(loginBtn, false, originalText);
    }
  }

  // ---------- Forgot password: send OTP ----------
  async function handleSendResetOtp() {
    const email = resetEmail.value.trim();
    if (!email) {
      showMessage(resetMessage, 'Enter your email address.', false);
      return;
    }
    const originalText = sendResetOtpBtn.innerHTML;
    setButtonLoading(sendResetOtpBtn, true, originalText);
    try {
      const data = await postJSON(`${AUTH_API}/forgot-password`, { email });
      resetUserId = data.userId;
      showMessage(resetMessage, 'Reset code sent!', true);
      switchPanel('resetOtp');
      startResetTimer(60);
    } catch (err) {
      showMessage(resetMessage, err.message, false);
    } finally {
      setButtonLoading(sendResetOtpBtn, false, originalText);
    }
  }

  async function handleResendResetOtp() {
    const email = resetEmail.value.trim();
    if (!email) {
      showMessage(resetOtpMessage, 'Email is missing.', false);
      return;
    }
    const originalText = resendResetOtpBtn.innerHTML;
    setButtonLoading(resendResetOtpBtn, true, originalText);
    try {
      await postJSON(`${AUTH_API}/forgot-password`, { email });
      showMessage(resetOtpMessage, 'New code sent', true);
      startResetTimer(60);
    } catch (err) {
      showMessage(resetOtpMessage, err.message, false);
    } finally {
      setButtonLoading(resendResetOtpBtn, false, originalText);
    }
  }

  function handleVerifyResetOtp() {
    const otp = Array.from(resetOtpDigits).map(d => d.value).join('');
    if (otp.length !== 6) {
      showMessage(resetOtpMessage, 'Enter the 6‑digit code.', false);
      return;
    }
    window.tempResetOtp = otp;
    clearMessage(resetOtpMessage);
    stopResetTimer();
    switchPanel('newPassword');
    resetOtpDigits.forEach(d => d.value = '');
  }

  // ---------- Reset password ----------
  async function handleResetPassword() {
    const newPass = newPassInput.value;
    const confirm = confirmPassInput.value;
    if (!newPass || !confirm) {
      showMessage(newPassMessage, 'Fill both password fields.', false);
      return;
    }
    if (newPass !== confirm) {
      showMessage(newPassMessage, 'Passwords do not match.', false);
      return;
    }
    if (newPass.length < 8 || !/[A-Z]/.test(newPass) || !/[a-z]/.test(newPass) || !/[0-9]/.test(newPass)) {
      showMessage(newPassMessage, 'Password must be at least 8 characters with uppercase, lowercase and a number.', false);
      return;
    }
    const otp = window.tempResetOtp;
    if (!otp || !resetUserId) {
      showMessage(newPassMessage, 'Session expired. Please restart.', false);
      return;
    }
    const originalText = resetPasswordBtn.innerHTML;
    setButtonLoading(resetPasswordBtn, true, originalText);
    try {
      await postJSON(`${AUTH_API}/reset-password`, {
        userId: resetUserId,
        otp,
        newPassword: newPass
      });
      showMessage(newPassMessage, 'Password reset successful!', true);
      setTimeout(() => {
        newPassInput.value = '';
        confirmPassInput.value = '';
        switchPanel('login');
        window.tempResetOtp = null;
        resetUserId = null;
      }, 1500);
    } catch (err) {
      showMessage(newPassMessage, err.message, false);
    } finally {
      setButtonLoading(resetPasswordBtn, false, originalText);
    }
  }

  // ---------- Password visibility toggles ----------
  document.querySelectorAll('.toggle-pass').forEach(icon => {
    icon.addEventListener('click', () => {
      const targetId = icon.getAttribute('data-target');
      const input = document.getElementById(targetId);
      if (input) {
        const show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        icon.classList.toggle('fa-eye-slash', !show);
        icon.classList.toggle('fa-eye', show);
      }
    });
  });

  // ---------- Event listeners ----------
  loginBtn.addEventListener('click', handleLogin);
  sendResetOtpBtn.addEventListener('click', handleSendResetOtp);
  resendResetOtpBtn.addEventListener('click', handleResendResetOtp);
  verifyResetOtpBtn.addEventListener('click', handleVerifyResetOtp);
  resetPasswordBtn.addEventListener('click', handleResetPassword);
  document.getElementById('forgotPasswordBtn').addEventListener('click', (e) => {
    e.preventDefault();
    clearMessage(resetMessage);
    switchPanel('forgot');
  });
  document.getElementById('backToLoginFromForgotBtn').addEventListener('click', () => switchPanel('login'));
  document.getElementById('backToForgotFromResetBtn').addEventListener('click', () => {
    stopResetTimer();
    clearMessage(resetOtpMessage);
    switchPanel('forgot');
  });
  document.getElementById('backToLoginFromNewBtn').addEventListener('click', () => switchPanel('login'));

  newPassInput.addEventListener('input', updatePasswordStrength);

  // ---------- Initialization ----------
  setupOtpInputs();
