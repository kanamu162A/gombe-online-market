import transporter from "../config/mailer.js";
import pool from "../config/database.js";

const OTP_EXPIRY_SECONDS = 60; // 1 minute as per auth controller

// Reusable beautiful email template (updated brand to Gombe)
const emailTemplate = ({ title, heading, message }) => {
  return `
    <div style="font-family: Arial, sans-serif; background:#f4f4f4; padding:30px;">
      <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 2px 10px rgba(0,0,0,0.1);">
        <div style="background:#111827; color:white; padding:20px; text-align:center;">
          <h1 style="margin:0;">Gombe Online Market</h1>
          <p style="margin:5px 0 0;">${title}</p>
        </div>
        <div style="padding:30px; color:#333;">
          <h2 style="margin-top:0;">${heading}</h2>
          <p style="line-height:1.7;">
            ${message}
          </p>
        </div>
        <div style="background:#f9fafb; padding:15px; text-align:center; font-size:12px; color:#777;">
          © ${new Date().getFullYear()} Gombe Online Market • Safe buying & selling
        </div>
      </div>
    </div>
  `;
};

// General mail sender
export const sendMail = async ({ to, subject, text, html }) => {
  try {
    const info = await transporter.sendMail({
      from: `"Gombe Market Support" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html
    });
    console.log("Email sent successfully:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Mail Error:", error.message);
    return { success: false, error: error.message };
  }
};

// Create OTP for a specific purpose, save to extensions.otp_codes, send email
export const createAndSendOTP = async (userId, email, purpose = 'login', expirySeconds = OTP_EXPIRY_SECONDS) => {
  try {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + expirySeconds * 1000);

    // Delete any previous unused OTPs for same user and purpose (optional, but good)
    await pool.query(
      `DELETE FROM extensions.otp_codes 
       WHERE user_id = $1 AND purpose = $2 AND is_used = false`,
      [userId, purpose]
    );

    // Insert new OTP
    await pool.query(
      `INSERT INTO extensions.otp_codes (user_id, otp_code, purpose, expires_at, is_used, created_at)
       VALUES ($1, $2, $3, $4, false, NOW())`,
      [userId, otp, purpose, expiresAt]
    );

    // Send email with the OTP
    let subject, heading, message;
    if (purpose === 'login') {
      subject = "Your Login OTP Code";
      heading = "Login Verification";
      message = `Use the code below to complete your login:<br><br>
                 <strong style="font-size:32px; letter-spacing:5px;">${otp}</strong>
                 <br><br>This OTP will expire in <strong>${expirySeconds} seconds</strong>.
                 <br><br>If this was not you, please ignore this email.`;
    } else if (purpose === 'reset') {
      subject = "Password Reset OTP";
      heading = "Reset Your Password";
      message = `Use the code below to reset your password:<br><br>
                 <strong style="font-size:32px; letter-spacing:5px;">${otp}</strong>
                 <br><br>This OTP will expire in <strong>${expirySeconds} seconds</strong>.
                 <br><br>If you did not request a password reset, please ignore this email.`;
    } else {
      subject = "Your OTP Code";
      heading = "Verification Code";
      message = `Your OTP is: <strong>${otp}</strong>. It expires in ${expirySeconds} seconds.`;
    }

    const emailResult = await sendMail({
      to: email,
      subject,
      text: `Your OTP is ${otp}. It expires in ${expirySeconds} seconds.`,
      html: emailTemplate({ title: subject, heading, message })
    });

    if (!emailResult.success) {
      throw new Error("Failed to send OTP email");
    }

    return { success: true };
  } catch (error) {
    console.error("OTP Error:", error.message);
    return { success: false, error: error.message };
  }
};

// Verify OTP from extensions.otp_codes
export const verifyOTP = async (userId, otp, purpose = 'login') => {
  try {
    const result = await pool.query(
      `SELECT id, expires_at FROM extensions.otp_codes
       WHERE user_id = $1 AND otp_code = $2 AND purpose = $3 AND is_used = false
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId, otp, purpose]
    );

    const otpRecord = result.rows[0];
    if (!otpRecord) {
      return { success: false, message: "Invalid OTP" };
    }

    const now = new Date();
    if (now > otpRecord.expires_at) {
      return { success: false, message: "OTP expired" };
    }

    // Mark as used
    await pool.query(
      "UPDATE extensions.otp_codes SET is_used = true WHERE id = $1",
      [otpRecord.id]
    );

    return { success: true, message: "OTP verified successfully" };
  } catch (error) {
    console.error("Verify OTP Error:", error.message);
    return { success: false, message: "Server error" };
  }
};