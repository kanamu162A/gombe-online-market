const brand = {
  name: "Gombe Online Market",
  logo: "/images/logo.png",
  primaryColor: "#0F172A",
  secondaryColor: "#3B82F6",
  accentColor: "#10B981",
  warningColor: "#F59E0B",
  dangerColor: "#EF4444",
  website: "https://gombe-market.com",
  support: "support@gombemarket.com",
  socialLinks: {
    twitter: "https://twitter.com/gombemarket",
    linkedin: "https://linkedin.com/company/gombe-market",
    instagram: "https://instagram.com/gombemarket"
  }
};

class EmailTemplateBuilder {
  static #sanitizeInput(input) {
    if (!input) return '';
    return String(input)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  static #getDeviceIcon(device) {
    const deviceLower = device.toLowerCase();
    if (deviceLower.includes('mobile') || deviceLower.includes('iphone') || deviceLower.includes('android')) return '📱';
    if (deviceLower.includes('tablet') || deviceLower.includes('ipad')) return '📟';
    if (deviceLower.includes('mac')) return '💻';
    if (deviceLower.includes('windows')) return '🖥️';
    if (deviceLower.includes('linux')) return '🐧';
    return '🔌';
  }

  static #formatIP(ip) {
    if (!ip || ip === 'Unknown') return 'Unable to detect';
    if (ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
      const parts = ip.split('.');
      return `${parts[0]}.${parts[1]}.xxx.xxx`;
    }
    return ip;
  }

  static #getResponsiveStyles() {
    return `
      <style>
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes urgentPulse {
          0%, 100% { transform: scale(1); background-position: 0% 50%; }
          50% { transform: scale(1.02); background-position: 100% 50%; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        @media only screen and (max-width: 600px) {
          .container { width: 100% !important; }
          .content { padding: 35px 20px !important; }
          .header { padding: 40px 20px !important; }
          .footer { padding: 30px 15px !important; }
          .button { display: block !important; width: 100% !important; }
          .info-grid { grid-template-columns: 1fr !important; }
          .info-card { margin-bottom: 15px !important; }
          .gradient-card { padding: 25px !important; }
        }
        @media only screen and (max-width: 480px) {
          .logo-text { font-size: 32px !important; }
          .otp-code { font-size: 28px !important; letter-spacing: 4px !important; }
          h1 { font-size: 32px !important; }
          h2 { font-size: 24px !important; }
        }
        .hover-scale {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .hover-scale:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.15);
        }
        .countdown-timer {
          font-family: 'Courier New', monospace;
          font-weight: bold;
          animation: pulse 1s infinite;
        }
      </style>
    `;
  }

  static #buildFooter() {
    const currentYear = new Date().getFullYear();
    
    return `
      <div style="background: linear-gradient(135deg, #1E293B 0%, #0F172A 100%); padding: 40px 20px; text-align:center;">
        <div style="max-width:500px; margin:0 auto;">
          <div style="margin-bottom:30px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 auto;">
              <tr>
                <td align="center" style="padding:0 8px;">
                  <a href="${brand.socialLinks.twitter}" style="display:inline-block; text-decoration:none;">
                    <div style="background:rgba(255,255,255,0.1); width:40px; height:40px; border-radius:50%; display:flex; align-items:center; justify-content:center;">
                      <span style="color:#94A3B8; font-size:18px;">🐦</span>
                    </div>
                  </a>
                </td>
                <td align="center" style="padding:0 8px;">
                  <a href="${brand.socialLinks.linkedin}" style="display:inline-block; text-decoration:none;">
                    <div style="background:rgba(255,255,255,0.1); width:40px; height:40px; border-radius:50%; display:flex; align-items:center; justify-content:center;">
                      <span style="color:#94A3B8; font-size:18px;">🔗</span>
                    </div>
                  </a>
                </td>
                <td align="center" style="padding:0 8px;">
                  <a href="${brand.socialLinks.instagram}" style="display:inline-block; text-decoration:none;">
                    <div style="background:rgba(255,255,255,0.1); width:40px; height:40px; border-radius:50%; display:flex; align-items:center; justify-content:center;">
                      <span style="color:#94A3B8; font-size:18px;">📸</span>
                    </div>
                  </a>
                </td>
              </tr>
            </table>
          </div>
          
          <div style="color:#94A3B8; font-size:13px; line-height:1.8;">
            <p style="margin:0 0 12px 0;">
              © ${currentYear} ${brand.name}. All rights reserved.
            </p>
            <p style="margin:0 0 12px 0; color:#64748B; font-size:12px;">
              🌟 Safe buying & selling platform
            </p>
            <p style="margin:0 0 12px 0;">
              <a href="${brand.website}" style="color:#60A5FA; text-decoration:none;">${brand.website}</a> | 
              <a href="mailto:${brand.support}" style="color:#60A5FA; text-decoration:none;">${brand.support}</a>
            </p>
            <p style="margin:20px 0 0 0; font-size:11px; color:#475569; line-height:1.5;">
              This email was sent to you as a registered user of ${brand.name}. 
              If you didn't request this, please ignore or contact support immediately.
            </p>
          </div>
        </div>
      </div>
    `;
  }

  static #buildButton(text, url, variant = 'primary', icon = '') {
    const variants = {
      primary: { bg: brand.secondaryColor, gradient: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)', text: '#FFFFFF', shadow: '0 8px 20px rgba(59,130,246,0.3)' },
      success: { bg: brand.accentColor, gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', text: '#FFFFFF', shadow: '0 8px 20px rgba(16,185,129,0.3)' },
      warning: { bg: brand.warningColor, gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', text: '#FFFFFF', shadow: '0 8px 20px rgba(245,158,11,0.3)' },
      danger: { bg: brand.dangerColor, gradient: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)', text: '#FFFFFF', shadow: '0 8px 20px rgba(239,68,68,0.3)' },
      outline: { bg: 'transparent', gradient: 'none', text: brand.secondaryColor, border: `2px solid ${brand.secondaryColor}`, shadow: 'none' }
    };
    
    const config = variants[variant] || variants.primary;
    const borderStyle = config.border ? `border: ${config.border};` : 'border: none;';
    
    return `
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:35px 0;">
        <tr>
          <td align="center">
            <a href="${this.#sanitizeInput(url)}" 
               style="background:${config.gradient || config.bg};
                      ${borderStyle}
                      border-radius:50px;
                      color:${config.text};
                      display:inline-flex;
                      align-items:center;
                      justify-content:center;
                      gap:10px;
                      font-size:16px;
                      font-weight:600;
                      line-height:1.5;
                      padding:15px 40px;
                      text-decoration:none;
                      text-align:center;
                      box-shadow:${config.shadow};
                      transition:all 0.3s ease;
                      letter-spacing:0.5px;">
              ${icon ? `<span style="font-size:20px;">${icon}</span>` : ''}
              ${this.#sanitizeInput(text)}
            </a>
          </td>
        </tr>
      </table>
    `;
  }

  static #buildAlert(message, type = 'info') {
    const alerts = {
      info: { bg: '#EFF6FF', border: '#3B82F6', text: '#1E40AF', icon: 'ℹ️', gradient: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)' },
      success: { bg: '#F0FDF4', border: '#10B981', text: '#14532D', icon: '✅', gradient: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)' },
      warning: { bg: '#FEFCE8', border: '#F59E0B', text: '#78350F', icon: '⚠️', gradient: 'linear-gradient(135deg, #FEFCE8 0%, #FEF08A 100%)' },
      error: { bg: '#FEF2F2', border: '#EF4444', text: '#991B1B', icon: '❌', gradient: 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)' }
    };
    
    const alert = alerts[type] || alerts.info;
    
    return `
      <div style="background:${alert.gradient};
                  border-left:4px solid ${alert.border};
                  border-radius:16px;
                  padding:20px 24px;
                  margin:25px 0;
                  box-shadow:0 4px 15px rgba(0,0,0,0.08);
                  backdrop-filter:blur(10px);">
        <div style="color:${alert.text}; font-size:14px; line-height:1.6;">
          <strong style="font-size:15px; display:flex; align-items:center; gap:8px;">
            <span style="font-size:20px;">${alert.icon}</span>
            <span>${type.toUpperCase()}</span>
          </strong>
          <p style="margin:10px 0 0 0;">${this.#sanitizeInput(message)}</p>
        </div>
      </div>
    `;
  }

  static #buildGradientCard(title, items, gradientColors = ['#F8FAFC', '#FFFFFF']) {
    return `
      <div style="background: linear-gradient(135deg, ${gradientColors[0]} 0%, ${gradientColors[1]} 100%);
                  border-radius:24px;
                  padding:30px;
                  margin:30px 0;
                  box-shadow:0 10px 30px rgba(0,0,0,0.08);
                  border:1px solid rgba(255,255,255,0.5);">
        <h3 style="color:#0F172A; margin:0 0 25px 0; font-size:20px; font-weight:700; display:flex; align-items:center; gap:10px;">
          <span style="font-size:24px;">✨</span>
          ${title}
        </h3>
        <div style="display:grid; gap:15px;">
          ${items.map(item => `
            <div class="hover-scale" style="display:flex; align-items:center; padding:15px; background:white; border-radius:16px; box-shadow:0 2px 8px rgba(0,0,0,0.05); transition:all 0.3s ease;">
              <div style="font-size:28px; margin-right:18px;">${item.icon}</div>
              <div style="flex:1;">
                <div style="color:#64748B; font-size:12px; margin-bottom:5px; letter-spacing:0.5px;">${item.label}</div>
                <div style="color:#0F172A; font-weight:600; font-size:16px;">${item.value}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  static #buildOTPBox(otp, expiryMinutes, isUrgent = false) {
    const urgentGradient = "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)";
    const normalGradient = "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
    
    return `
      <div style="background: ${isUrgent ? urgentGradient : normalGradient};
                  border-radius:30px;
                  padding:40px;
                  margin:35px 0;
                  text-align:center;
                  box-shadow:0 20px 40px rgba(0,0,0,0.3);
                  position:relative;
                  overflow:hidden;
                  animation: ${isUrgent ? 'urgentPulse 1.5s ease-in-out infinite' : 'none'};">
        <div style="position:absolute; top:-50%; right:-50%; width:200%; height:200%; background:radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px); background-size:50px 50px;"></div>
        <div style="position:relative; z-index:1;">
          <div style="font-size:18px; color:rgba(255,255,255,0.9); margin-bottom:20px;">
            ${isUrgent ? "⏰ URGENT - ONE TIME CODE" : "🔐 VERIFICATION CODE"}
          </div>
          <div class="otp-code" style="
            font-family:'Courier New', 'SF Mono', monospace;
            font-size:48px;
            letter-spacing:15px;
            font-weight:bold;
            color:white;
            text-shadow:0 2px 10px rgba(0,0,0,0.2);
            background:rgba(255,255,255,0.2);
            display:inline-block;
            padding:20px 35px;
            border-radius:20px;
            backdrop-filter:blur(10px);
          ">
            ${this.#sanitizeInput(otp)}
          </div>
          <p style="color:rgba(255,255,255,0.9); font-size:14px; margin-top:25px;">
            ${isUrgent ? "⏰" : "⏰"} This code expires in <strong style="color:#FEF08A; font-size:${isUrgent ? '22px' : '18px'};" class="countdown-timer">${expiryMinutes} minute${expiryMinutes > 1 ? 's' : ''}</strong>
            ${isUrgent ? '<br><span style="font-size:12px; display:inline-block; margin-top:8px;">⚠️ For security, this code is only valid for 60 seconds</span>' : ''}
          </p>
        </div>
      </div>
    `;
  }

  static baseTemplate({ title, content, headerColor = brand.primaryColor, preheader = "", gradient = false, headerIcon = "🛍️", isUrgent = false }) {
    const headerStyle = gradient 
      ? `background: linear-gradient(135deg, ${headerColor} 0%, ${brand.primaryColor} 100%);`
      : `background: ${headerColor};`;
    
    const urgentBadge = isUrgent ? `
      <div style="background:#EF4444; color:white; padding:6px 18px; border-radius:50px; font-size:12px; font-weight:700; display:inline-block; margin-bottom:15px; letter-spacing:1px; animation:shake 0.5s ease-in-out;">
        ⚡ EXPIRES IN 1 MINUTE
      </div>
    ` : '';
    
    return `<!DOCTYPE html>
      <html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="x-apple-disable-message-reformatting">
        <title>${this.#sanitizeInput(title)} | ${brand.name}</title>
        ${this.#getResponsiveStyles()}
      </head>
      <body style="margin:0; padding:0; background:linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%); font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <div style="display:none; font-size:1px; color:#F1F5F9; line-height:1px; max-height:0; opacity:0;">
          ${preheader || `Important update from ${brand.name}`}
        </div>
        
        <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
          <tr>
            <td align="center" style="padding:50px 20px;">
              <div class="container" style="max-width:680px; width:100%; margin:0 auto; animation:fadeIn 0.6s ease-out;">
                
                <!-- Header -->
                <div class="header" style="${headerStyle}
                                            border-radius:30px 30px 0 0;
                                            padding:50px 30px;
                                            text-align:center;
                                            box-shadow:0 15px 30px rgba(0,0,0,0.1);
                                            position:relative;
                                            overflow:hidden;">
                  <div style="position:absolute; top:0; left:0; right:0; bottom:0; background:radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%);"></div>
                  <div style="position:relative; z-index:1;">
                    ${urgentBadge}
                    <div style="font-size:72px; margin-bottom:15px; animation:${isUrgent ? 'urgentPulse 1s infinite' : 'pulse 2s infinite'};">${headerIcon}</div>
                    <h1 style="color:#FFFFFF; 
                               font-size:38px; 
                               font-weight:800;
                               margin:0 0 12px 0;
                               letter-spacing:-1px;
                               text-shadow:0 2px 10px rgba(0,0,0,0.15);">
                      ${brand.name}
                    </h1>
                    <p style="color:rgba(255,255,255,0.95); 
                              font-size:17px; 
                              margin:0;
                              font-weight:500;">
                      ${this.#sanitizeInput(title)}
                    </p>
                  </div>
                </div>
                
                <!-- Content -->
                <div class="content" style="background:#FFFFFF; 
                                            padding:50px 45px;
                                            border-radius:0 0 30px 30px;
                                            box-shadow:0 15px 35px rgba(0,0,0,0.1);">
                  ${content}
                </div>
                
                <!-- Footer -->
                ${this.#buildFooter()}
                
              </div>
            </td>
          </tr>
        </table>
      </body>
      </html>`;
  }

  static welcomeEmail(name, options = {}) {
    const { verificationLink = null, role = "member" } = options;
    const sanitizedName = this.#sanitizeInput(name);
    
    const features = [
      { icon: "👤", label: "Complete Profile", desc: "Add your photo and details" },
      { icon: "🔍", label: "Browse Items", desc: "Find amazing deals near you" },
      { icon: "💰", label: "Sell Items", desc: "List your products easily" },
      { icon: "💬", label: "Chat Safely", desc: "Connect with buyers/sellers" }
    ];
    
    const content = `
      <div style="text-align:center;">
        <div style="background:linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius:50%; width:80px; height:80px; display:flex; align-items:center; justify-content:center; margin:0 auto 25px auto; animation:pulse 2s infinite;">
          <span style="font-size:48px;">🎉</span>
        </div>
        
        <h2 style="color:#0F172A; font-size:32px; margin:0 0 15px 0; font-weight:800;">
          Welcome to Gombe Market, ${sanitizedName}! 🚀
        </h2>
        
        <p style="color:#475569; font-size:17px; line-height:1.7; margin-bottom:30px;">
          We're absolutely thrilled to have you join our community of ${role}s. 
          Get ready to experience the best local buying and selling platform!
        </p>
        
        ${this.#buildAlert(
          "Your account has been successfully created and verified. You're all set to start!", 
          "success"
        )}
        
        <div style="display:grid; grid-template-columns:repeat(2,1fr); gap:20px; margin:35px 0;">
          ${features.map(feature => `
            <div style="background:linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%); border-radius:16px; padding:20px; text-align:center;">
              <div style="font-size:40px; margin-bottom:10px;">${feature.icon}</div>
              <h4 style="color:#0F172A; margin:10px 0 5px 0; font-size:16px;">${feature.label}</h4>
              <p style="color:#64748B; font-size:12px; margin:0;">${feature.desc}</p>
            </div>
          `).join('')}
        </div>
        
        ${verificationLink ? this.#buildButton("Get Started Now", verificationLink, "primary", "🚀") : ""}
        
        <div style="background:linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%); border-radius:20px; padding:25px; margin-top:30px;">
          <p style="color:#14532D; font-size:14px; margin:0;">
            💡 <strong>Pro Tip:</strong> Complete your profile to get better matches and faster responses!
          </p>
        </div>
        
        <p style="color:#64748B; font-size:14px; margin-top:30px;">
          Need help? <a href="mailto:${brand.support}" style="color:${brand.secondaryColor}; text-decoration:none; font-weight:600;">📧 Contact our support team</a>
        </p>
      </div>
    `;
    
    return this.baseTemplate({
      title: "Welcome Aboard! 🚀",
      content,
      preheader: `Welcome to ${brand.name}, ${sanitizedName}! Get started with your account.`,
      gradient: true,
      headerIcon: "🎉"
    });
  }

  static welcomeBackEmail(name, loginDetails = {}) {
    const { 
      ip = "Unable to detect", 
      device = "Unable to detect", 
      location = "Unable to detect",
      browser = "Unknown",
      os = "Unknown"
    } = loginDetails;
    
    const sanitizedName = this.#sanitizeInput(name);
    const formattedIP = this.#formatIP(ip);
    const deviceIcon = this.#getDeviceIcon(device);
    
    const items = [
      { icon: "📍", label: "LOCATION", value: location !== "Unable to detect" ? location : "Location services unavailable" },
      { icon: deviceIcon, label: "DEVICE", value: device !== "Unable to detect" ? device : "Device information not available" },
      { icon: "🌐", label: "IP ADDRESS", value: formattedIP },
      { icon: "🕐", label: "TIME", value: new Date().toLocaleString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }) },
      { icon: "🔍", label: "BROWSER", value: browser !== "Unknown" ? browser : "Browser information unavailable" },
      { icon: "⚙️", label: "OPERATING SYSTEM", value: os !== "Unknown" ? os : "OS information unavailable" }
    ];
    
    const content = `
      <div>
        <div style="text-align:center; margin-bottom:25px;">
          <div style="background:linear-gradient(135deg, #10B981 0%, #059669 100%); border-radius:50%; width:70px; height:70px; display:flex; align-items:center; justify-content:center; margin:0 auto;">
            <span style="font-size:40px;">👋</span>
          </div>
        </div>
        
        <h2 style="color:#0F172A; font-size:30px; margin:0 0 12px 0; font-weight:800; text-align:center;">
          Welcome Back, ${sanitizedName}! ✨
        </h2>
        
        <p style="color:#475569; font-size:17px; line-height:1.6; text-align:center; margin-bottom:30px;">
          You've successfully signed in to your account. We're happy to see you again!
        </p>
        
        ${this.#buildGradientCard("🔐 Login Session Details", items, ['#EFF6FF', '#FFFFFF'])}
        
        ${this.#buildAlert(
          "If this wasn't you, secure your account immediately by clicking the button below.", 
          "warning"
        )}
        
        ${this.#buildButton("Secure My Account", `${brand.website}/security`, "warning", "🔒")}
        
        <div style="background:linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%); border-radius:20px; padding:20px; margin-top:25px; text-align:center;">
          <p style="color:#78350F; font-size:14px; margin:0;">
            💡 <strong>Security Tip:</strong> Always log out from shared devices and never share your password with anyone.
          </p>
        </div>
      </div>
    `;
    
    return this.baseTemplate({
      title: "Login Notification",
      content,
      preheader: `New sign-in to your ${brand.name} account from ${device !== "Unable to detect" ? device : "a new device"}`,
      gradient: true,
      headerIcon: "👋"
    });
  }

  static otpEmail(name, otp, expiryMinutes = 10, purpose = "verification") {
    const sanitizedName = this.#sanitizeInput(name);
    
    let actualExpiry = expiryMinutes;
    let isUrgent = false;
    let purposeText = "";
    
    switch(purpose) {
      case "password_reset":
        actualExpiry = 1;
        isUrgent = true;
        purposeText = "Password Reset";
        break;
      case "login":
        actualExpiry = Math.min(expiryMinutes, 5);
        purposeText = "Login Verification";
        break;
      case "email_verification":
        actualExpiry = Math.min(expiryMinutes, 10);
        purposeText = "Email Verification";
        break;
      default:
        actualExpiry = Math.min(expiryMinutes, 10);
        purposeText = "Verification";
    }
    
    const content = `
      <div style="text-align:center;">
        <div style="background:linear-gradient(135deg, ${isUrgent ? '#EF4444' : '#3B82F6'} 0%, ${isUrgent ? '#DC2626' : '#2563EB'} 100%); border-radius:50%; width:80px; height:80px; display:flex; align-items:center; justify-content:center; margin:0 auto 25px auto; animation:${isUrgent ? 'urgentPulse 1s infinite' : 'none'};">
          <span style="font-size:48px;">${isUrgent ? "⏰" : "🔐"}</span>
        </div>
        
        <h2 style="color:#0F172A; font-size:30px; margin:0 0 15px 0; font-weight:800;">
          ${purposeText} Code Required
        </h2>
        
        <p style="color:#475569; font-size:17px; line-height:1.6;">
          Hello <strong>${sanitizedName}</strong>,<br>
          Use the verification code below to ${purpose === "password_reset" ? "reset your password" : `complete your ${purpose}`}.
        </p>
        
        ${this.#buildOTPBox(otp, actualExpiry, isUrgent)}
        
        ${isUrgent ? this.#buildAlert(
          "⚠️ This code expires in 60 seconds for maximum security. If it expires, please request a new one.", 
          "error"
        ) : ""}
        
        ${this.#buildAlert(
          "⚠️ Never share this code with anyone, including our support team. We will never ask for it.", 
          "warning"
        )}
        
        <div style="background:linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%); border-radius:16px; padding:20px; margin-top:25px;">
          <p style="color:#475569; font-size:13px; margin:0;">
            🔒 Didn't request this code? You can safely ignore this email. Your account is secure.
          </p>
          ${isUrgent ? `
            <p style="color:#EF4444; font-size:12px; margin:10px 0 0 0;">
              ⚡ For security reasons, this code will expire in 60 seconds. Please use it immediately.
            </p>
          ` : ""}
        </div>
      </div>
    `;
    
    return this.baseTemplate({
      title: `${purposeText} Code Required`,
      content,
      preheader: `Your ${brand.name} verification code is ${otp} - Valid for ${actualExpiry} minute${actualExpiry > 1 ? 's' : ''}`,
      gradient: false,
      headerIcon: isUrgent ? "⏰" : "🔐",
      isUrgent: isUrgent
    });
  }

  static forgotPasswordEmail(name, resetToken, expiryMinutes = 15) {
    const sanitizedName = this.#sanitizeInput(name);
    const resetLink = `${brand.website}/reset-password?token=${resetToken}`;
    
    const actualExpiry = 1;
    const isUrgent = true;
    
    const instructions = [
      { icon: "1️⃣", step: "Click the reset button below (valid for 60 seconds)" },
      { icon: "2️⃣", step: "Enter your new password" },
      { icon: "3️⃣", step: "Confirm your new password" },
      { icon: "4️⃣", step: "Login with your new credentials" }
    ];
    
    const content = `
      <div style="text-align:center;">
        <div style="background:linear-gradient(135deg, #F59E0B 0%, #D97706 100%); border-radius:50%; width:80px; height:80px; display:flex; align-items:center; justify-content:center; margin:0 auto 25px auto; animation:urgentPulse 1s infinite;">
          <span style="font-size:48px;">🔒</span>
        </div>
        
        <h2 style="color:#0F172A; font-size:30px; margin:0 0 15px 0; font-weight:800;">
          Password Reset Request
        </h2>
        
        <p style="color:#475569; font-size:17px; line-height:1.6; margin-bottom:30px;">
          Hello <strong>${sanitizedName}</strong>,<br>
          We received a request to reset your password. Click the button below to create a new one.
        </p>
        
        <div style="background:linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%); border-radius:20px; padding:25px; margin:25px 0;">
          <div style="display:grid; gap:15px; text-align:left; max-width:300px; margin:0 auto;">
            ${instructions.map(inst => `
              <div style="display:flex; align-items:center; gap:15px;">
                <span style="font-size:24px; font-weight:bold;">${inst.icon}</span>
                <span style="color:#78350F; font-size:15px;">${inst.step}</span>
              </div>
            `).join('')}
          </div>
        </div>
        
        ${this.#buildButton("Reset Your Password (Expires in 1 min)", resetLink, "danger", "🔑")}
        
        <div style="margin:25px 0;">
          <p style="color:#64748B; font-size:14px;">Or use this code:</p>
          ${this.#buildOTPBox(resetToken, actualExpiry, isUrgent)}
        </div>
        
        ${this.#buildAlert(
          `⚠️ This password reset link and code will expire in ${actualExpiry} minute for security reasons. If it expires, simply request a new one.`, 
          "error"
        )}
        
        <div style="background:linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%); border-radius:20px; padding:20px; margin:20px 0;">
          <p style="color:#991B1B; font-size:14px; margin:0; display:flex; align-items:center; justify-content:center; gap:10px;">
            <span style="font-size:20px;">🔐</span>
            <strong>Security Notice:</strong> This link expires in 60 seconds for your protection.
          </p>
        </div>
        
        <div style="background:linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%); border-radius:16px; padding:15px; margin-top:20px;">
          <p style="color:#1E40AF; font-size:13px; margin:0;">
            💡 For security reasons, you have <strong class="countdown-timer" style="color:#EF4444; font-size:16px;">60 seconds</strong> to use this link. If it expires, simply request a new one.
          </p>
        </div>
      </div>
    `;
    
    return this.baseTemplate({
      title: "Reset Your Password - Link Expires in 1 Minute",
      headerColor: brand.dangerColor,
      content,
      preheader: `Reset your ${brand.name} account password - Link expires in 1 minute for security`,
      gradient: true,
      headerIcon: "🔒",
      isUrgent: true
    });
  }

  static securityAlert(name, alertType, details = {}) {
    const {
      message = "Suspicious activity detected on your account",
      actionRequired = true,
      timestamp = new Date(),
      ip = "Unable to detect",
      device = "Unable to detect",
      location = "Unable to detect"
    } = details;
    
    const alertConfig = {
      suspicious: { color: brand.warningColor, severity: "Medium", icon: "⚠️", action: "Review Activity", gradient: true },
      locked: { color: brand.dangerColor, severity: "High", icon: "🔒", action: "Unlock Account", gradient: true },
      changed: { color: brand.secondaryColor, severity: "Medium", icon: "🔄", action: "Verify Changes", gradient: true },
      breached: { color: brand.dangerColor, severity: "Critical", icon: "🚨", action: "Secure Now", gradient: true }
    };
    
    const config = alertConfig[alertType] || alertConfig.suspicious;
    const sanitizedName = this.#sanitizeInput(name);
    const formattedIP = this.#formatIP(ip);
    const deviceIcon = this.#getDeviceIcon(device);
    
    const items = [
      { icon: "🕐", label: "TIME", value: timestamp.toLocaleString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }) },
      { icon: deviceIcon, label: "DEVICE", value: device !== "Unable to detect" ? device : "Device information unavailable" },
      { icon: "🌐", label: "IP ADDRESS", value: formattedIP },
      { icon: "📍", label: "LOCATION", value: location !== "Unable to detect" ? location : "Location information unavailable" },
      { icon: "⚠️", label: "ALERT TYPE", value: alertType.toUpperCase() }
    ];
    
    const severityColors = {
      "Low": "#10B981",
      "Medium": "#F59E0B", 
      "High": "#EF4444",
      "Critical": "#DC2626"
    };
    
    const content = `
      <div>
        <div style="text-align:center; margin-bottom:25px;">
          <div style="background:linear-gradient(135deg, ${config.color} 0%, ${brand.primaryColor} 100%); border-radius:50%; width:80px; height:80px; display:flex; align-items:center; justify-content:center; margin:0 auto;">
            <span style="font-size:48px;">${config.icon}</span>
          </div>
        </div>
        
        <h2 style="color:#0F172A; font-size:30px; margin:0 0 12px 0; font-weight:800; text-align:center;">
          Security Alert
        </h2>
        
        <div style="text-align:center; margin-bottom:25px;">
          <span style="display:inline-block; background:${severityColors[config.severity]}; color:white; padding:8px 20px; border-radius:50px; font-size:14px; font-weight:600; letter-spacing:1px;">
            ${config.severity} RISK DETECTED
          </span>
        </div>
        
        <p style="color:#475569; font-size:17px; line-height:1.6; margin-bottom:20px;">
          Hello <strong>${sanitizedName}</strong>,
        </p>
        
        ${this.#buildAlert(message, alertType === "locked" || alertType === "breached" ? "error" : "warning")}
        
        ${this.#buildGradientCard("📋 Alert Details", items, ['#FEF2F2', '#FFFFFF'])}
        
        ${actionRequired ? this.#buildButton(config.action, `${brand.website}/security`, config.severity === "Critical" ? "danger" : "warning", "🛡️") : ""}
        
        <div style="background:linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%); border-radius:20px; padding:20px; margin-top:25px; text-align:center;">
          <p style="color:#475569; font-size:14px; margin:0;">
            🛡️ <strong>Need immediate assistance?</strong> Contact our security team at <a href="mailto:${brand.support}" style="color:${brand.secondaryColor};">${brand.support}</a>
          </p>
        </div>
      </div>
    `;
    
    return this.baseTemplate({
      title: `Security Alert - ${config.severity} Risk Detected`,
      headerColor: config.color,
      content,
      preheader: `Security alert on your ${brand.name} account - ${config.severity} risk detected`,
      gradient: config.gradient,
      headerIcon: config.icon
    });
  }

  static transactionEmail(name, transactionDetails) {
    const {
      type = "purchase",
      amount = 0,
      itemName = "item",
      transactionId = "N/A",
      status = "completed",
      quantity = 1,
      date = new Date()
    } = transactionDetails;
    
    const sanitizedName = this.#sanitizeInput(name);
    const isPurchase = type === "purchase";
    
    const items = [
      { icon: "📦", label: "ITEM", value: itemName },
      { icon: "🔢", label: "QUANTITY", value: quantity },
      { icon: "💰", label: "TOTAL AMOUNT", value: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'NGN' }).format(amount) },
      { icon: "🆔", label: "TRANSACTION ID", value: transactionId },
      { icon: "📅", label: "DATE", value: date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) },
      { icon: "⏰", label: "TIME", value: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) }
    ];
    
    const statusConfig = {
      completed: { color: brand.accentColor, text: "✅ COMPLETED", bg: "#F0FDF4", icon: "✅" },
      pending: { color: brand.warningColor, text: "⏳ PENDING", bg: "#FEFCE8", icon: "⏳" },
      failed: { color: brand.dangerColor, text: "❌ FAILED", bg: "#FEF2F2", icon: "❌" }
    };
    
    const statusInfo = statusConfig[status] || statusConfig.completed;
    
    const content = `
      <div>
        <div style="text-align:center; margin-bottom:25px;">
          <div style="background:linear-gradient(135deg, ${brand.accentColor} 0%, ${brand.primaryColor} 100%); border-radius:50%; width:80px; height:80px; display:flex; align-items:center; justify-content:center; margin:0 auto;">
            <span style="font-size:48px;">${isPurchase ? "🛍️" : "💰"}</span>
          </div>
        </div>
        
        <h2 style="color:#0F172A; font-size:30px; margin:0 0 15px 0; text-align:center; font-weight:800;">
          ${isPurchase ? "Purchase Confirmation" : "Sale Notification"} 🎉
        </h2>
        
        <div style="text-align:center; margin-bottom:30px;">
          <span style="display:inline-block; background:${statusInfo.bg}; color:${statusInfo.color}; padding:8px 25px; border-radius:50px; font-size:14px; font-weight:600;">
            ${statusInfo.text}
          </span>
        </div>
        
        <p style="color:#475569; font-size:17px; line-height:1.6; margin-bottom:25px;">
          Hello <strong>${sanitizedName}</strong>,
        </p>
        
        ${this.#buildGradientCard(isPurchase ? "📋 Purchase Details" : "📋 Sale Details", items, ['#F0FDF4', '#FFFFFF'])}
        
        ${this.#buildButton("View Transaction Details", `${brand.website}/transactions/${transactionId}`, "primary", "🔍")}
        
        <div style="background:linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%); border-radius:20px; padding:25px; margin-top:30px; text-align:center;">
          <p style="color:#14532D; font-size:15px; margin:0;">
            📧 A receipt has been sent to your email. For any issues, contact support within 48 hours.
          </p>
        </div>
        
        <div style="background:linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%); border-radius:16px; padding:15px; margin-top:20px;">
          <p style="color:#1E40AF; font-size:13px; margin:0; display:flex; align-items:center; justify-content:center; gap:8px;">
            <span>⭐</span> Rate your experience with the seller
            <span>⭐</span>
          </p>
        </div>
      </div>
    `;
    
    return this.baseTemplate({
      title: `${isPurchase ? "Purchase" : "Sale"} Confirmation - ${status.toUpperCase()}`,
      headerColor: brand.accentColor,
      content,
      preheader: `Your ${isPurchase ? "purchase" : "sale"} of ${itemName} has been ${status}`,
      gradient: true,
      headerIcon: isPurchase ? "🛍️" : "💰"
    });
  }

  static passwordResetSuccessEmail(name) {
    const sanitizedName = this.#sanitizeInput(name);
    
    const tips = [
      "Use a mix of uppercase, lowercase, numbers, and symbols",
      "Avoid using the same password across multiple sites",
      "Consider using a password manager",
      "Enable two-factor authentication for extra security"
    ];
    
    const content = `
      <div style="text-align:center;">
        <div style="background:linear-gradient(135deg, #10B981 0%, #059669 100%); border-radius:50%; width:80px; height:80px; display:flex; align-items:center; justify-content:center; margin:0 auto 25px auto;">
          <span style="font-size:48px;">✅</span>
        </div>
        
        <h2 style="color:#0F172A; font-size:30px; margin:0 0 15px 0; font-weight:800;">
          Password Reset Successful! 🎉
        </h2>
        
        <p style="color:#475569; font-size:17px; line-height:1.6; margin-bottom:25px;">
          Hello <strong>${sanitizedName}</strong>,<br>
          Your password has been successfully changed. You can now log in with your new credentials.
        </p>
        
        ${this.#buildButton("Login to Your Account", `${brand.website}/login`, "success", "🔑")}
        
        <div style="background:linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%); border-radius:20px; padding:25px; margin:30px 0;">
          <h3 style="color:#14532D; margin:0 0 15px 0; font-size:18px;">💡 Password Security Tips</h3>
          <div style="text-align:left; max-width:350px; margin:0 auto;">
            ${tips.map(tip => `
              <div style="display:flex; align-items:center; gap:12px; margin-bottom:12px;">
                <span style="color:#10B981;">✓</span>
                <span style="color:#14532D; font-size:14px;">${tip}</span>
              </div>
            `).join('')}
          </div>
        </div>
        
        ${this.#buildAlert(
          "If you didn't make this change, please contact our support team immediately.", 
          "warning"
        )}
        
        <div style="background:linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%); border-radius:16px; padding:15px; margin-top:20px;">
          <p style="color:#1E40AF; font-size:13px; margin:0;">
            🔐 Need help? Contact our support team at <a href="mailto:${brand.support}" style="color:${brand.secondaryColor};">${brand.support}</a>
          </p>
        </div>
      </div>
    `;
    
    return this.baseTemplate({
      title: "Password Reset Successful",
      headerColor: brand.accentColor,
      content,
      preheader: `Your ${brand.name} password has been successfully changed`,
      gradient: true,
      headerIcon: "✅"
    });
  }
}

// HTML Form for Password Reset Page (to be displayed when user clicks the link)
const PasswordResetForm = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Password - Gombe Online Market</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    
    .reset-container {
      background: white;
      border-radius: 30px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      max-width: 500px;
      width: 100%;
      overflow: hidden;
      animation: slideUp 0.5s ease-out;
    }
    
    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .reset-header {
      background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%);
      padding: 40px 30px;
      text-align: center;
      color: white;
    }
    
    .reset-header .logo {
      font-size: 64px;
      margin-bottom: 10px;
    }
    
    .reset-header h1 {
      font-size: 28px;
      font-weight: 800;
      margin-bottom: 8px;
    }
    
    .reset-header p {
      font-size: 14px;
      opacity: 0.9;
    }
    
    .reset-content {
      padding: 40px 35px;
    }
    
    .form-group {
      margin-bottom: 25px;
    }
    
    label {
      display: block;
      margin-bottom: 8px;
      color: #0F172A;
      font-weight: 600;
      font-size: 14px;
    }
    
    .input-wrapper {
      position: relative;
    }
    
    .input-icon {
      position: absolute;
      left: 15px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 18px;
    }
    
    input {
      width: 100%;
      padding: 14px 15px 14px 45px;
      border: 2px solid #E2E8F0;
      border-radius: 12px;
      font-size: 16px;
      transition: all 0.3s ease;
      font-family: inherit;
    }
    
    input:focus {
      outline: none;
      border-color: #3B82F6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
    
    .password-strength {
      margin-top: 10px;
      height: 4px;
      background: #E2E8F0;
      border-radius: 2px;
      overflow: hidden;
    }
    
    .strength-bar {
      height: 100%;
      width: 0%;
      transition: all 0.3s ease;
      border-radius: 2px;
    }
    
    .strength-text {
      font-size: 12px;
      margin-top: 8px;
      color: #64748B;
    }
    
    .requirements {
      background: #F8FAFC;
      border-radius: 12px;
      padding: 15px;
      margin-top: 15px;
    }
    
    .requirement {
      font-size: 12px;
      color: #64748B;
      margin: 8px 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .requirement.valid {
      color: #10B981;
    }
    
    .requirement.invalid {
      color: #EF4444;
    }
    
    button {
      width: 100%;
      padding: 16px;
      background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
      color: white;
      border: none;
      border-radius: 50px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      margin-top: 10px;
      font-family: inherit;
    }
    
    button:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 10px 25px -5px rgba(59, 130, 246, 0.4);
    }
    
    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    
    .error-message {
      background: #FEF2F2;
      border-left: 4px solid #EF4444;
      padding: 12px 15px;
      border-radius: 8px;
      margin-bottom: 20px;
      color: #991B1B;
      font-size: 14px;
    }
    
    .success-message {
      background: #F0FDF4;
      border-left: 4px solid #10B981;
      padding: 12px 15px;
      border-radius: 8px;
      margin-bottom: 20px;
      color: #14532D;
      font-size: 14px;
      text-align: center;
    }
    
    .show-password {
      position: absolute;
      right: 15px;
      top: 50%;
      transform: translateY(-50%);
      cursor: pointer;
      font-size: 18px;
      user-select: none;
    }
    
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-5px); }
      75% { transform: translateX(5px); }
    }
    
    .shake {
      animation: shake 0.3s ease-in-out;
    }
    
    .expiry-warning {
      background: #FEF2F2;
      border: 1px solid #EF4444;
      border-radius: 12px;
      padding: 12px;
      margin-bottom: 20px;
      text-align: center;
      animation: pulse 1s infinite;
    }
    
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }
  </style>
</head>
<body>
  <div class="reset-container">
    <div class="reset-header">
      <div class="logo">🛍️</div>
      <h1>Gombe Market</h1>
      <p>Create a New Password</p>
    </div>
    <div class="reset-content">
      <div id="expiryWarning" class="expiry-warning" style="display:none;">
        ⚠️ This reset link will expire in <span id="countdown">60</span> seconds!
      </div>
      <div id="messageContainer"></div>
      
      <form id="resetForm">
        <div class="form-group">
          <label>🔐 New Password</label>
          <div class="input-wrapper">
            <span class="input-icon">🔒</span>
            <input type="password" id="newPassword" placeholder="Enter your new password" required>
            <span class="show-password" onclick="togglePassword('newPassword', this)">👁️</span>
          </div>
          <div class="password-strength">
            <div class="strength-bar" id="strengthBar"></div>
          </div>
          <div class="strength-text" id="strengthText">Enter a password</div>
        </div>
        
        <div class="form-group">
          <label>✓ Confirm Password</label>
          <div class="input-wrapper">
            <span class="input-icon">✅</span>
            <input type="password" id="confirmPassword" placeholder="Confirm your new password" required>
            <span class="show-password" onclick="togglePassword('confirmPassword', this)">👁️</span>
          </div>
        </div>
        
        <div class="requirements" id="requirements">
          <div class="requirement" id="lengthReq">
            <span>🔘</span> At least 8 characters
          </div>
          <div class="requirement" id="upperReq">
            <span>🔘</span> At least 1 uppercase letter
          </div>
          <div class="requirement" id="lowerReq">
            <span>🔘</span> At least 1 lowercase letter
          </div>
          <div class="requirement" id="numberReq">
            <span>🔘</span> At least 1 number
          </div>
          <div class="requirement" id="specialReq">
            <span>🔘</span> At least 1 special character
          </div>
        </div>
        
        <button type="submit" id="submitBtn">Reset Password 🔄</button>
      </form>
    </div>
  </div>

  <script>
    // Get token from URL and check timestamp
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const timestamp = urlParams.get('ts');
    
    if (!token) {
      showMessage('Invalid or missing reset token. Please request a new password reset link.', 'error');
      document.getElementById('resetForm').style.display = 'none';
    }
    
    // Check if token is expired (1 minute)
    if (timestamp) {
      const tokenTime = parseInt(timestamp);
      const currentTime = Date.now();
      const elapsedSeconds = (currentTime - tokenTime) / 1000;
      
      if (elapsedSeconds > 60) {
        showMessage('This password reset link has expired (valid for 60 seconds). Please request a new one.', 'error');
        document.getElementById('resetForm').style.display = 'none';
      } else {
        // Show countdown timer
        const expiryWarning = document.getElementById('expiryWarning');
        expiryWarning.style.display = 'block';
        const countdownSpan = document.getElementById('countdown');
        const remainingSeconds = 60 - elapsedSeconds;
        countdownSpan.textContent = Math.ceil(remainingSeconds);
        
        // Countdown timer
        const countdownInterval = setInterval(() => {
          const now = Date.now();
          const elapsed = (now - tokenTime) / 1000;
          const remaining = 60 - elapsed;
          
          if (remaining <= 0) {
            clearInterval(countdownInterval);
            expiryWarning.style.display = 'none';
            showMessage('This password reset link has expired. Please request a new one.', 'error');
            document.getElementById('resetForm').style.display = 'none';
          } else {
            countdownSpan.textContent = Math.ceil(remaining);
            if (remaining <= 10) {
              expiryWarning.style.background = '#FEE2E2';
              expiryWarning.style.border = '2px solid #EF4444';
            }
          }
        }, 1000);
      }
    }
    
    // Password validation
    const newPassword = document.getElementById('newPassword');
    const confirmPassword = document.getElementById('confirmPassword');
    const submitBtn = document.getElementById('submitBtn');
    
    const requirements = {
      length: { regex: /.{8,}/, element: 'lengthReq', valid: false },
      uppercase: { regex: /[A-Z]/, element: 'upperReq', valid: false },
      lowercase: { regex: /[a-z]/, element: 'lowerReq', valid: false },
      number: { regex: /[0-9]/, element: 'numberReq', valid: false },
      special: { regex: /[!@#$%^&*(),.?":{}|<>]/, element: 'specialReq', valid: false }
    };
    
    function validatePassword(password) {
      let strength = 0;
      
      for (const [key, req] of Object.entries(requirements)) {
        const isValid = req.regex.test(password);
        req.valid = isValid;
        const element = document.getElementById(req.element);
        const span = element.querySelector('span');
        
        if (isValid) {
          element.classList.add('valid');
          element.classList.remove('invalid');
          span.innerHTML = '✅';
          strength++;
        } else {
          element.classList.add('invalid');
          element.classList.remove('valid');
          span.innerHTML = '❌';
        }
      }
      
      // Update strength bar
      const strengthBar = document.getElementById('strengthBar');
      const strengthText = document.getElementById('strengthText');
      const percentage = (strength / 5) * 100;
      strengthBar.style.width = percentage + '%';
      
      if (strength === 0) {
        strengthBar.style.background = '#E2E8F0';
        strengthText.textContent = 'Enter a password';
        strengthText.style.color = '#64748B';
      } else if (strength <= 2) {
        strengthBar.style.background = '#EF4444';
        strengthText.textContent = 'Weak password';
        strengthText.style.color = '#EF4444';
      } else if (strength <= 4) {
        strengthBar.style.background = '#F59E0B';
        strengthText.textContent = 'Medium password';
        strengthText.style.color = '#F59E0B';
      } else {
        strengthBar.style.background = '#10B981';
        strengthText.textContent = 'Strong password!';
        strengthText.style.color = '#10B981';
      }
      
      return strength === 5;
    }
    
    function checkPasswordsMatch() {
      const pass = newPassword.value;
      const confirm = confirmPassword.value;
      
      if (confirm.length > 0 && pass !== confirm) {
        confirmPassword.style.borderColor = '#EF4444';
        return false;
      } else {
        confirmPassword.style.borderColor = '#E2E8F0';
        return pass === confirm;
      }
    }
    
    function validateForm() {
      const isStrong = validatePassword(newPassword.value);
      const doMatch = checkPasswordsMatch();
      submitBtn.disabled = !(isStrong && doMatch && newPassword.value.length > 0);
      return submitBtn.disabled;
    }
    
    newPassword.addEventListener('input', validateForm);
    confirmPassword.addEventListener('input', validateForm);
    
    function togglePassword(fieldId, element) {
      const field = document.getElementById(fieldId);
      if (field.type === 'password') {
        field.type = 'text';
        element.textContent = '🙈';
      } else {
        field.type = 'password';
        element.textContent = '👁️';
      }
    }
    
    function showMessage(message, type) {
      const container = document.getElementById('messageContainer');
      container.innerHTML = \`<div class="\${type === 'error' ? 'error-message' : 'success-message'}">\${message}</div>\`;
      setTimeout(() => {
        const msgDiv = container.querySelector('div');
        if (msgDiv) msgDiv.style.opacity = '0';
        setTimeout(() => {
          if (container.innerHTML.includes(message)) {
            container.innerHTML = '';
          }
        }, 300);
      }, 5000);
    }
    
    document.getElementById('resetForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      if (submitBtn.disabled) return;
      
      const newPasswordValue = newPassword.value;
      const confirmPasswordValue = confirmPassword.value;
      
      if (newPasswordValue !== confirmPasswordValue) {
        showMessage('Passwords do not match!', 'error');
        confirmPassword.classList.add('shake');
        setTimeout(() => confirmPassword.classList.remove('shake'), 300);
        return;
      }
      
      submitBtn.disabled = true;
      submitBtn.textContent = 'Resetting Password... ⏳';
      
      try {
        const response = await fetch('/api/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, newPassword: newPasswordValue })
        });
        
        const data = await response.json();
        
        if (response.ok) {
          showMessage('✅ Password reset successfully! Redirecting to login...', 'success');
          setTimeout(() => {
            window.location.href = '/login';
          }, 3000);
        } else {
          showMessage(data.message || 'Failed to reset password. Please try again.', 'error');
          submitBtn.disabled = false;
          submitBtn.textContent = 'Reset Password 🔄';
        }
      } catch (error) {
        showMessage('Network error. Please check your connection and try again.', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Reset Password 🔄';
      }
    });
    
    validateForm();
  </script>
</body>
</html>
`;

export { EmailTemplateBuilder as default, PasswordResetForm };