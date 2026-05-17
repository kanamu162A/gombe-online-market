import bcrypt from "bcrypt";
import pool from "../config/database.js";
import { sendMail } from "../services/mailer.js";
import EmailTemplateBuilder from "../services/emailTemplates.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import axios from "axios";

// Load environment variables
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const JWT_SECRET = process.env.JWT_SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL;

const OTP_EXPIRY_MINUTES = 1;        // used for password reset OTPs
const RESET_TOKEN_EXPIRY_MINUTES = 5; // not used in this version but kept for reference

const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Helper: generate unique 10-digit account number
const generateAccountNumber = async () => {
  let accountNumber;
  let exists = true;
  while (exists) {
    accountNumber = Math.floor(1000000000 + Math.random() * 9000000000).toString();
    const check = await pool.query(
      "SELECT id FROM extensions.users WHERE account_number = $1",
      [accountNumber]
    );
    exists = check.rows.length > 0;
  }
  return accountNumber;
};

// Helper: Create or fetch Paystack customer
const getOrCreatePaystackCustomer = async (email, firstName, lastName, phone) => {
  if (!PAYSTACK_SECRET_KEY) {
    console.error("PAYSTACK_SECRET_KEY is missing in environment variables");
    return null;
  }

  try {
    // Try to create customer
    const createRes = await axios.post(
      'https://api.paystack.co/customer',
      { email, first_name: firstName, last_name: lastName, phone },
      { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`, 'Content-Type': 'application/json' } }
    );
    console.log(`Paystack customer created: ${createRes.data.data.customer_code}`);
    return createRes.data.data.customer_code;
  } catch (err) {
    // If customer already exists (status 409), fetch existing
    if (err.response?.status === 409) {
      console.log(`Customer with email ${email} already exists, fetching...`);
      try {
        const fetchRes = await axios.get(
          `https://api.paystack.co/customer?email=${email}`,
          { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } }
        );
        const customers = fetchRes.data.data;
        const existing = customers.find(c => c.email === email);
        if (existing) {
          console.log(`Found existing customer: ${existing.customer_code}`);
          return existing.customer_code;
        }
      } catch (fetchErr) {
        console.error("Failed to fetch existing customer:", fetchErr.message);
      }
    } else {
      console.error("Paystack customer creation error:", err.response?.data || err.message);
    }
    return null;
  }
};

// ============================
// REGISTER USER
// ============================
export const registerUser = async (req, res) => {
  try {
    const { fullname, username, email, phone, password } = req.body;

    console.log("Registration attempt:", { fullname, username, email, phone });

    if (!fullname || !username || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    // Email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: "Invalid email format" });
    }

    // Phone format
    const phoneRegex = /^[0-9]{10,15}$/;
    if (!phoneRegex.test(phone.replace(/[\s\-\(\)\+]/g, ''))) {
      return res.status(400).json({ success: false, message: "Invalid phone number" });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });
    }

    // Check existing user
    const existing = await pool.query(
      "SELECT id, email, phone, username FROM extensions.users WHERE email = $1 OR phone = $2 OR username = $3",
      [email, phone, username]
    );

    if (existing.rows.length > 0) {
      const exist = existing.rows[0];
      let msg = "";
      if (exist.email === email) msg = "Email already registered";
      else if (exist.phone === phone) msg = "Phone number already registered";
      else if (exist.username === username) msg = "Username already taken";
      return res.status(409).json({ success: false, message: msg });
    }

    const hashed = await bcrypt.hash(password, 10);
    const accountNumber = await generateAccountNumber();

    // Create Paystack customer (or get existing)
    const firstName = fullname.split(' ')[0];
    const lastName = fullname.split(' ').slice(1).join(' ') || '';
    const customerCode = await getOrCreatePaystackCustomer(email, firstName, lastName, phone);

    // Insert user
    const result = await pool.query(
      `INSERT INTO extensions.users 
        (fullname, username, email, phone, password_hash, account_number, customer_code, bank_name, account_name, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
       RETURNING id, fullname, username, email, phone, account_number, customer_code`,
      [fullname, username, email, phone, hashed, accountNumber, customerCode, "Gombe Virtual Bank", fullname]
    );

    const user = result.rows[0];

    // Create wallet
    try {
      await pool.query(
        `INSERT INTO extensions.wallets (user_id, balance, locked_balance, currency, status, created_at, updated_at)
         VALUES ($1, 0, 0, 'NGN', 'active', NOW(), NOW())`,
        [user.id]
      );
      console.log(`Wallet created for user ${user.id}`);
    } catch (err) {
      console.warn("Wallet creation failed:", err.message);
    }

    // Send welcome email (non-blocking)
    sendMail({
      to: email,
      subject: "🎉 Welcome to Gombe Online Market",
      html: EmailTemplateBuilder.welcomeEmail(fullname, {
        verificationLink: `${FRONTEND_URL}/verify/${user.id}`,
        role: "buyer"
      })
    }).catch(err => console.error("Welcome email failed:", err.message));

    res.status(201).json({
      success: true,
      message: "Registration successful",
      user: {
        id: user.id,
        fullname: user.fullname,
        username: user.username,
        email: user.email,
        phone: user.phone,
        accountNumber: user.account_number,
        bankName: "Gombe Virtual Bank",
        customerCode: user.customer_code || null
      }
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ success: false, message: "Server error during registration" });
  }
};

// ============================
// LOGIN – Instant (email + password → JWT)
// ============================
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password required" });
    }

    // Fetch user with all needed fields
    const result = await pool.query(
      `SELECT id, fullname, email, password_hash, is_admin, account_number, bank_name, username, phone, profile_image 
       FROM extensions.users WHERE email = $1`,
      [email]
    );
    const user = result.rows[0];
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(401).json({ success: false, message: "Invalid credentials" });

    // Update last login time
    await pool.query("UPDATE extensions.users SET last_login = NOW() WHERE id = $1", [user.id]);

    // Generate JWT token (no OTP)
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        fullname: user.fullname,
        is_admin: user.is_admin
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Return user data and token instantly
    res.json({
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        fullname: user.fullname,
        username: user.username,
        email: user.email,
        phone: user.phone,
        profile_image: user.profile_image || "",
        is_admin: user.is_admin,
        accountNumber: user.account_number,
        bankName: user.bank_name || "Gombe Virtual Bank"
      },
      token
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ============================
// FORGOT PASSWORD (sends OTP for reset)
// ============================
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email required" });

    const userResult = await pool.query(
      "SELECT id, fullname, email FROM extensions.users WHERE email = $1",
      [email]
    );
    if (userResult.rows.length === 0) {
      // For security, do not reveal that email doesn't exist
      return res.status(200).json({ success: true, message: "If an account exists, a reset OTP has been sent." });
    }
    const user = userResult.rows[0];

    // Delete old unused reset OTPs
    await pool.query("DELETE FROM extensions.otp_codes WHERE user_id = $1 AND purpose = 'reset' AND is_used = false", [user.id]);

    const otp = generateOTP();
    const expires = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
    await pool.query(
      `INSERT INTO extensions.otp_codes (user_id, otp_code, purpose, expires_at, created_at)
       VALUES ($1, $2, 'reset', $3, NOW())`,
      [user.id, otp, expires]
    );

    await sendMail({
      to: user.email,
      subject: "🔑 Password Reset OTP - Gombe Market",
      html: EmailTemplateBuilder.otpEmail(user.fullname, otp, OTP_EXPIRY_MINUTES, "reset")
    });

    res.json({ success: true, message: "Password reset OTP sent to your email", userId: user.id });
  } catch (error) {
    console.error("Forgot password error:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ============================
// RESET PASSWORD (using OTP)
// ============================
export const resetPassword = async (req, res) => {
  try {
    const { userId, otp, newPassword } = req.body;
    if (!userId || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: "User ID, OTP, and new password required" });
    }

    // Strong password validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters, contain uppercase, lowercase, number, and special character" });
    }

    // Verify OTP
    const otpResult = await pool.query(
      `SELECT id FROM extensions.otp_codes
       WHERE user_id = $1 AND otp_code = $2 AND purpose = 'reset'
       AND expires_at > NOW() AND is_used = false`,
      [userId, otp]
    );
    if (otpResult.rows.length === 0) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
    }

    // Mark OTP as used
    await pool.query("UPDATE extensions.otp_codes SET is_used = true WHERE id = $1", [otpResult.rows[0].id]);

    // Hash new password and update
    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query(
      "UPDATE extensions.users SET password_hash = $1, updated_at = NOW() WHERE id = $2",
      [hashed, userId]
    );

    // Send confirmation email
    const userEmail = await pool.query("SELECT email, fullname FROM extensions.users WHERE id = $1", [userId]);
    if (userEmail.rows.length > 0) {
      sendMail({
        to: userEmail.rows[0].email,
        subject: "✅ Password Reset Successful - Gombe Market",
        html: EmailTemplateBuilder.passwordResetSuccessEmail(userEmail.rows[0].fullname)
      }).catch(err => console.error("Reset success email failed:", err.message));
    }

    res.json({ success: true, message: "Password reset successful. You can now log in with your new password." });
  } catch (error) {
    console.error("Reset password error:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ============================
// GET USER BY ID (public profile)
// ============================
export const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query(
      `SELECT id, fullname, username, email, phone, profile_image, bio, gender, state, city, address, 
              is_email_verified, is_phone_verified, account_number, bank_name, account_name, created_at
       FROM extensions.users WHERE id = $1`,
      [userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    console.error("Get user error:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ============================
// CHANGE PASSWORD (authenticated user)
// ============================
export const changePassword = async (req, res) => {
  try {
    const { userId } = req.user; // Set by auth middleware
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "Current password and new password are required" });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({ success: false, message: "New password is too weak" });
    }

    const userResult = await pool.query(
      "SELECT password_hash, email, fullname FROM extensions.users WHERE id = $1",
      [userId]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    const isMatch = await bcrypt.compare(currentPassword, userResult.rows[0].password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Current password is incorrect" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query(
      "UPDATE extensions.users SET password_hash = $1, updated_at = NOW() WHERE id = $2",
      [hashed, userId]
    );

    // Send security alert email
    sendMail({
      to: userResult.rows[0].email,
      subject: "🔐 Password Changed - Gombe Market",
      html: EmailTemplateBuilder.securityAlert(
        userResult.rows[0].fullname,
        "changed",
        { message: "Your password was changed successfully. If this wasn't you, please contact support immediately." }
      )
    }).catch(err => console.error("Password change alert failed:", err.message));

    res.json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

