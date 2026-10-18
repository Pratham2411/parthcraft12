const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { formatUser } = require('../utils/formatUser');
const { isAdminEmail } = require('../config/admins');
const rateLimit = require('express-rate-limit');

const crypto = require('crypto');
const PendingUser = require('../models/PendingUser');
const { sendOtpEmail, sendPasswordResetEmail } = require('../utils/resendEmail');

const Product = require('../models/Product');
const Comment = require('../models/Comment');
const ItemRequest = require('../models/ItemRequest');
const RequestContact = require('../models/RequestContact');

// ─── Rate Limiters for Auth Endpoints ───────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts, please try again after 15 minutes.' },
});

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many OTP requests, please try again after 15 minutes.' },
});

const profileLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // max 20 profile updates/deletes per 15 mins
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many profile updates, please try again after 15 minutes.' },
});

// ─── Helpers ───────────────────────────────────────────────────────────────

const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());

const isStrongPassword = (password) => {
  const p = String(password || '');
  if (p.length < 8) return { ok: false, message: 'Password must be at least 8 characters' };
  if (!/[A-Z]/.test(p)) return { ok: false, message: 'Password must contain at least one uppercase letter' };
  if (!/[a-z]/.test(p)) return { ok: false, message: 'Password must contain at least one lowercase letter' };
  if (!/[0-9]/.test(p)) return { ok: false, message: 'Password must contain at least one number' };
  return { ok: true };
};

const isAllowedSignupEmail = (emailLower) => {
  // All valid emails are allowed for the craft community
  return true;
};

const signToken = (user) => {
  const u = formatUser(user);
  return jwt.sign(
    {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      isAdmin: u.isAdmin,
      avatarUrl: u.avatarUrl,
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

const { createUpload } = require('../middleware/multerUpload');
const { uploadFile, deleteStoredImage } = require('../utils/imageStorage');

const uploadAvatar = createUpload(1, 2).single('image');

// ─── PHONE NORMALIZATION HELPERS ──────────────────────────────────────────

const normalizePhone = (phone) => {
  if (!phone) return '';
  let digits = String(phone).replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  return digits;
};

const isValidPhone = (phone) => {
  const digits = normalizePhone(phone);
  return /^[6-9]\d{9}$/.test(digits);
};

// ─── PHONE AUTHENTICATION ROUTES ─────────────────────────────────────────────

// POST /api/auth/phone-signup — Signup with Full Name + Phone Number (no password, no OTP)
router.post('/phone-signup', authLimiter, async (req, res) => {
  try {
    const { name, phone } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ message: 'Full name is required' });
    }
    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    const trimmedName = String(name).trim();
    if (trimmedName.length < 2) {
      return res.status(400).json({ message: 'Name must be at least 2 characters long' });
    }

    const cleanedPhone = normalizePhone(phone);
    if (!isValidPhone(cleanedPhone)) {
      return res.status(400).json({
        message: 'Please enter a valid 10-digit Indian phone number (e.g. 9876543210).'
      });
    }

    const existingUser = await User.findOne({ phone: cleanedPhone });
    if (existingUser) {
      return res.status(400).json({
        message: 'An account with this phone number already exists. Please log in.'
      });
    }

    const user = await User.create({
      name: trimmedName,
      phone: cleanedPhone,
      role: 'user',
      isEmailVerified: true,
      isVerifiedStudent: true,
      wishlist: []
    });

    return res.status(201).json({
      token: signToken(user),
      user: formatUser(user),
      message: 'Account created successfully!'
    });
  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(400).json({ message: 'An account with this phone number already exists.' });
    }
    console.error('Phone signup error:', err);
    res.status(500).json({ message: err.message || 'Signup failed. Please try again.' });
  }
});

// POST /api/auth/phone-login — Login with Full Name + Phone Number
router.post('/phone-login', authLimiter, async (req, res) => {
  try {
    const { name, phone } = req.body;

    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }
    if (!name || !String(name).trim()) {
      return res.status(400).json({ message: 'Full name is required' });
    }

    const cleanedPhone = normalizePhone(phone);
    if (!isValidPhone(cleanedPhone)) {
      return res.status(400).json({ message: 'Please enter a valid 10-digit phone number.' });
    }

    const user = await User.findOne({ phone: cleanedPhone });
    if (!user) {
      return res.status(404).json({
        message: 'No account found with this phone number. Please check the number or sign up.'
      });
    }

    if (user.isBanned) {
      return res.status(403).json({ message: 'This account has been suspended.' });
    }

    const inputName = String(name).trim().toLowerCase();
    const storedName = String(user.name || '').trim().toLowerCase();

    if (inputName !== storedName) {
      return res.status(400).json({
        nameMismatch: true,
        message: 'The name does not match the registered name for this phone number. If you forgot your name, click "Forgot your name?" to change it.'
      });
    }

    return res.json({
      token: signToken(user),
      user: formatUser(user)
    });
  } catch (err) {
    console.error('Phone login error:', err);
    res.status(500).json({ message: 'Login failed. Please try again.' });
  }
});

// POST /api/auth/lookup-phone — Check if phone exists (for Forgot Name)
router.post('/lookup-phone', authLimiter, async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    const cleanedPhone = normalizePhone(phone);
    if (!isValidPhone(cleanedPhone)) {
      return res.status(400).json({ message: 'Please enter a valid 10-digit phone number.' });
    }

    const user = await User.findOne({ phone: cleanedPhone });
    if (!user) {
      return res.status(404).json({
        message: 'No account found with this phone number. Please sign up.'
      });
    }

    return res.json({
      found: true,
      phone: cleanedPhone,
      currentName: user.name,
      message: 'Account found.'
    });
  } catch (err) {
    console.error('Lookup phone error:', err);
    res.status(500).json({ message: 'Lookup failed. Please try again.' });
  }
});

// POST /api/auth/change-name — Allows user who forgot their name to update it via phone number
router.post('/change-name', authLimiter, async (req, res) => {
  try {
    const { phone, newName } = req.body;

    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }
    if (!newName || !String(newName).trim()) {
      return res.status(400).json({ message: 'New name is required' });
    }

    const trimmedName = String(newName).trim();
    if (trimmedName.length < 2) {
      return res.status(400).json({ message: 'Name must be at least 2 characters long' });
    }

    const cleanedPhone = normalizePhone(phone);
    const user = await User.findOne({ phone: cleanedPhone });
    if (!user) {
      return res.status(404).json({ message: 'No account found with this phone number.' });
    }

    user.name = trimmedName;
    await user.save();

    return res.json({
      token: signToken(user),
      user: formatUser(user),
      message: 'Name updated successfully! You are now logged in.'
    });
  } catch (err) {
    console.error('Change name error:', err);
    res.status(500).json({ message: 'Failed to update name. Please try again.' });
  }
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
// Supports BOTH phone auth ({ name, phone }) and admin email auth ({ email, password })
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password, phone, name } = req.body;

    // 1. Phone + Name login
    if (phone || (!email && name)) {
      const targetPhone = phone;
      if (!targetPhone) {
        return res.status(400).json({ message: 'Phone number is required' });
      }
      if (!name || !String(name).trim()) {
        return res.status(400).json({ message: 'Full name is required' });
      }

      const cleanedPhone = normalizePhone(targetPhone);
      if (!isValidPhone(cleanedPhone)) {
        return res.status(400).json({ message: 'Please enter a valid 10-digit phone number.' });
      }

      const user = await User.findOne({ phone: cleanedPhone });
      if (!user) {
        return res.status(404).json({
          message: 'No account found with this phone number. Please check the number or sign up.'
        });
      }

      if (user.isBanned) {
        return res.status(403).json({ message: 'This account has been suspended.' });
      }

      const inputName = String(name).trim().toLowerCase();
      const storedName = String(user.name || '').trim().toLowerCase();

      if (inputName !== storedName) {
        return res.status(400).json({
          nameMismatch: true,
          message: 'The name does not match the registered name for this phone number. If you forgot your name, click "Forgot your name?" to change it.'
        });
      }

      return res.json({ token: signToken(user), user: formatUser(user) });
    }

    // 2. Email + Password login (used by Admin and legacy users)
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const emailLower = email.toLowerCase().trim();
    const user = await User.findOne({ email: emailLower });
    if (!user) return res.status(400).json({ message: 'Invalid email or password' });
    if (user.isBanned) return res.status(403).json({ message: 'This account has been suspended' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid email or password' });

    res.json({ token: signToken(user), user: formatUser(user) });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
});

/* ==============================================================================
   LEGACY / PRESERVED SERVICES (Email OTP & Password Reset)
   Preserved as requested: "dont remove the current services just comment them"
   
   - POST /register/send-otp
   - POST /register/verify-otp
   - POST /register/resend-otp
   - POST /register (direct email+password registration)
   - POST /forgot-password (email OTP reset code)
   - POST /reset-password (verify OTP and update password)
   ==============================================================================

// ─── OTP SIGNUP FLOW (PRESERVED / COMMENTED) ──────────────────────────────────

router.post('/register/send-otp', otpLimiter, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }

    const passwordCheck = isStrongPassword(password);
    if (!passwordCheck.ok) {
      return res.status(400).json({ message: passwordCheck.message });
    }

    const emailLower = email.toLowerCase().trim();

    if (!isAllowedSignupEmail(emailLower)) {
      return res.status(400).json({ message: 'Please enter a valid email address to sign up' });
    }

    const existingUser = await User.findOne({ email: emailLower });
    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    let pendingUser = await PendingUser.findOne({ email: emailLower });
    if (pendingUser) {
      const timeSinceLastSent = (Date.now() - pendingUser.lastSentAt.getTime()) / 1000;
      if (timeSinceLastSent < 60) {
        return res.status(429).json({ message: `Please wait ${Math.ceil(60 - timeSinceLastSent)} seconds before resending` });
      }
    }

    const otp = crypto.randomInt(100000, 1000000).toString();
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
    const hashedPassword = await bcrypt.hash(password, 12);
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    if (pendingUser) {
      pendingUser.name = String(name).trim();
      pendingUser.password = hashedPassword;
      pendingUser.otpHash = otpHash;
      pendingUser.otpExpires = otpExpires;
      pendingUser.attempts = 0;
      pendingUser.lastSentAt = new Date();
      await pendingUser.save();
    } else {
      pendingUser = await PendingUser.create({
        email: emailLower,
        name: String(name).trim(),
        password: hashedPassword,
        otpHash,
        otpExpires,
        lastSentAt: new Date()
      });
    }

    const emailResult = await sendOtpEmail(emailLower, otp, pendingUser.name);
    if (!emailResult.success) {
      return res.status(500).json({ message: 'Failed to send OTP email. Please try again later.' });
    }

    res.status(200).json({ message: 'OTP sent to your email', email: emailLower });
  } catch (err) {
    console.error('Send OTP error:', err);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
});

router.post('/register/verify-otp', authLimiter, async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' });

    const emailLower = email.toLowerCase().trim();
    const pendingUser = await PendingUser.findOne({ email: emailLower });

    if (!pendingUser) {
      return res.status(404).json({ message: 'Signup session expired or not found. Please register again.' });
    }

    if (pendingUser.attempts >= 5) {
      await PendingUser.deleteOne({ _id: pendingUser._id });
      return res.status(400).json({ message: 'Too many failed attempts. Please register again.' });
    }

    if (new Date() > pendingUser.otpExpires) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    const otpHash = crypto.createHash('sha256').update(otp.trim()).digest('hex');
    if (pendingUser.otpHash !== otpHash) {
      pendingUser.attempts += 1;
      await pendingUser.save();
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    const existingUser = await User.findOne({ email: emailLower });
    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    const role = isAdminEmail(emailLower) ? 'admin' : 'user';
    let insertResult;
    try {
      insertResult = await User.collection.insertOne({
        name: pendingUser.name,
        email: pendingUser.email,
        password: pendingUser.password,
        role: role,
        isEmailVerified: true,
        isBanned: false,
        emailVerificationTokenHash: '',
        emailVerificationExpires: null,
        phone: '',
        avatarUrl: '',
        isVerifiedStudent: true,
        wishlist: [],
        createdAt: new Date(),
        updatedAt: new Date()
      });
    } catch (dbErr) {
      if (dbErr.code === 11000) {
        return res.status(400).json({ message: 'An account with this email already exists' });
      }
      throw dbErr;
    }

    const user = await User.findById(insertResult.insertedId);
    await PendingUser.deleteOne({ _id: pendingUser._id });

    return res.status(201).json({ token: signToken(user), user: formatUser(user) });
  } catch (err) {
    console.error('Verify OTP error:', err);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
});

router.post('/register/resend-otp', otpLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const emailLower = email.toLowerCase().trim();
    const pendingUser = await PendingUser.findOne({ email: emailLower });

    if (!pendingUser) {
      return res.status(404).json({ message: 'Signup session expired. Please register again.' });
    }

    const timeSinceLastSent = (Date.now() - pendingUser.lastSentAt.getTime()) / 1000;
    if (timeSinceLastSent < 60) {
      return res.status(429).json({ message: `Please wait ${Math.ceil(60 - timeSinceLastSent)} seconds before resending` });
    }

    const otp = crypto.randomInt(100000, 1000000).toString();
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
    
    pendingUser.otpHash = otpHash;
    pendingUser.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    pendingUser.attempts = 0;
    pendingUser.lastSentAt = new Date();
    await pendingUser.save();

    const emailResult = await sendOtpEmail(emailLower, otp, pendingUser.name);
    if (!emailResult.success) {
      return res.status(500).json({ message: 'Failed to send OTP email. Please try again later.' });
    }

    res.status(200).json({ message: 'New OTP sent to your email' });
  } catch (err) {
    console.error('Resend OTP error:', err);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
});

// ─── POST /api/auth/register (PRESERVED / COMMENTED) ─────────────────────────

router.post('/register', authLimiter, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }

    const passwordCheck = isStrongPassword(password);
    if (!passwordCheck.ok) {
      return res.status(400).json({ message: passwordCheck.message });
    }

    const emailLower = email.toLowerCase().trim();

    if (!isAllowedSignupEmail(emailLower)) {
      return res.status(400).json({ message: 'Please enter a valid email address to sign up' });
    }

    const existingUser = await User.findOne({ email: emailLower });
    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    const user = await User.create({
      name: String(name).trim(),
      email: emailLower,
      password,
      isEmailVerified: true,
      emailVerificationTokenHash: '',
      emailVerificationExpires: null,
      isVerifiedStudent: true,
      wishlist: []
    });

    return res.status(201).json({ token: signToken(user), user: formatUser(user) });
  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    console.error('Register error:', err);
    res.status(err.statusCode || 500).json({ message: err.message });
  }
});

// ─── POST /api/auth/forgot-password (PRESERVED / COMMENTED) ──────────────────

router.post('/forgot-password', otpLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const emailLower = email.toLowerCase().trim();
    const user = await User.findOne({ email: emailLower });

    if (!user) {
      return res.status(200).json({ message: 'If an account with that email exists, a reset code has been sent.' });
    }

    if (user.isBanned) {
      return res.status(200).json({ message: 'If an account with that email exists, a reset code has been sent.' });
    }

    if (user.resetPasswordOtpExpires && user.resetPasswordOtpHash) {
      const timeSinceIssued = Date.now() - (user.resetPasswordOtpExpires.getTime() - 10 * 60 * 1000);
      if (timeSinceIssued < 60 * 1000) {
        return res.status(429).json({ message: `Please wait before requesting another code.` });
      }
    }

    const otp = crypto.randomInt(100000, 1000000).toString();
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

    user.resetPasswordOtpHash = otpHash;
    user.resetPasswordOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
    user.resetPasswordAttempts = 0;
    await user.save();

    const emailResult = await sendPasswordResetEmail(emailLower, otp, user.name);
    if (!emailResult.success) {
      return res.status(500).json({ message: 'Failed to send reset email. Please try again later.' });
    }

    res.status(200).json({ message: 'If an account with that email exists, a reset code has been sent.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
});

// ─── POST /api/auth/reset-password (PRESERVED / COMMENTED) ───────────────────

router.post('/reset-password', authLimiter, async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Email, OTP, and new password are required' });
    }

    const passwordCheck = isStrongPassword(newPassword);
    if (!passwordCheck.ok) {
      return res.status(400).json({ message: passwordCheck.message });
    }

    const emailLower = email.toLowerCase().trim();
    const user = await User.findOne({ email: emailLower });

    if (!user || !user.resetPasswordOtpHash || !user.resetPasswordOtpExpires) {
      return res.status(400).json({ message: 'Invalid or expired reset code. Please request a new one.' });
    }

    if (new Date() > user.resetPasswordOtpExpires) {
      user.resetPasswordOtpHash = '';
      user.resetPasswordOtpExpires = null;
      await user.save();
      return res.status(400).json({ message: 'Reset code has expired. Please request a new one.' });
    }

    if (user.resetPasswordAttempts >= 5) {
      user.resetPasswordOtpHash = '';
      user.resetPasswordOtpExpires = null;
      user.resetPasswordAttempts = 0;
      await user.save();
      return res.status(400).json({ message: 'Too many failed attempts. Please request a new reset code.' });
    }

    const otpHash = crypto.createHash('sha256').update(otp.trim()).digest('hex');
    if (user.resetPasswordOtpHash !== otpHash) {
      user.resetPasswordAttempts = (user.resetPasswordAttempts || 0) + 1;
      await user.save();
      return res.status(400).json({ message: 'Invalid reset code.' });
    }

    user.password = newPassword;
    user.resetPasswordOtpHash = '';
    user.resetPasswordOtpExpires = null;
    user.resetPasswordAttempts = 0;
    await user.save();

    res.status(200).json({ message: 'Password reset successfully. You can now log in with your new password.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
});
============================================================================== */

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────

router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user: formatUser(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── PATCH /api/auth/me ───────────────────────────────────────────────────────

router.patch('/me', auth, profileLimiter, uploadAvatar, async (req, res) => {
  try {
    const user = req.userDoc;
    if (!user) return res.status(401).json({ message: 'User not found' });

    const { phone, removeAvatar, bio, displayName } = req.body;

    if (typeof phone === 'string') {
      const cleaned = phone.replace(/[\s-]/g, '');
      if (cleaned && !/^(\+91)?[6-9]\d{9}$/.test(cleaned)) {
        return res.status(400).json({ message: 'Please enter a valid Indian mobile number.' });
      }
      user.phone = cleaned;
    }

    if (typeof bio === 'string') user.bio = bio.trim().slice(0, 500);
    if (typeof displayName === 'string') user.displayName = displayName.trim().slice(0, 100);

    const shouldRemoveAvatar =
      removeAvatar === true ||
      removeAvatar === 'true' ||
      removeAvatar === '1';

    if (shouldRemoveAvatar) {
      await deleteStoredImage(user.avatarUrl);
      user.avatarUrl = '';
    } else if (req.file) {
      await deleteStoredImage(user.avatarUrl);
      user.avatarUrl = await uploadFile(req.file, 'avatars');
    }

    await user.save();
    res.json({ user: formatUser(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── DELETE /api/auth/me ──────────────────────────────────────────────────────

router.delete('/me', auth, profileLimiter, async (req, res) => {
  try {
    const userId = req.userDoc?._id?.toString() || req.user.id;

    await deleteStoredImage(req.userDoc?.avatarUrl);

    const { unlinkProductImages } = require('../utils/productImages');
    const products = await Product.find({ seller: userId });
    await Promise.all(products.map((p) => unlinkProductImages(p)));

    await Promise.all([
      Product.deleteMany({ seller: userId }),
      Comment.deleteMany({ user: userId }),
      Message.deleteMany({ $or: [{ sender: userId }, { receiver: userId }] }),
      ItemRequest.deleteMany({ requester: userId }),
      RequestContact.deleteMany({ $or: [{ requester: userId }, { provider: userId }] }),
      User.deleteOne({ _id: userId }),
    ]);

    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── POST /api/auth/wishlist/:productId ─────────────────────────────────────
router.post('/wishlist/:productId', auth, async (req, res) => {
  try {
    const user = req.userDoc;
    if (!user.wishlist.includes(req.params.productId)) {
      user.wishlist.push(req.params.productId);
      await user.save();
    }
    res.json({ wishlist: user.wishlist });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── DELETE /api/auth/wishlist/:productId ───────────────────────────────────
router.delete('/wishlist/:productId', auth, async (req, res) => {
  try {
    const user = req.userDoc;
    user.wishlist = user.wishlist.filter((id) => id.toString() !== req.params.productId);
    await user.save();
    res.json({ wishlist: user.wishlist });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
