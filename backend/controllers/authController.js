const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');
const { OAuth2Client } = require('google-auth-library');
const bcrypt = require('bcryptjs');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || 'mock_client_id');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret123', {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });
};

// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, phone, location } = req.body;
    
    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ success: false, error: 'User already exists' });
    }

    const otp = generateOTP();
    const otpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes

    user = await User.create({
      name,
      email,
      password,
      role,
      phone,
      location,
      otp,
      otpExpiry
    });

    console.log(`\n\n================================`);
    console.log(`DEVELOPMENT MODE - OTP FOR ${email}: ${otp}`);
    console.log(`================================\n\n`);

    await sendEmail({
      email: user.email,
      subject: 'AgroConnect Verification Code',
      message: `Your verification code is ${otp}`
    });

    res.status(201).json({ success: true, message: 'OTP sent to email', userId: user._id });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify
// @access  Public
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email, otp, otpExpiry: { $gt: Date.now() } });

    if (!user) {
      return res.status(400).json({ success: false, error: 'Invalid or expired OTP' });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    const token = generateToken(user._id);
    res.status(200).json({ success: true, token, user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const token = generateToken(user._id);
    res.status(200).json({ success: true, token, user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Forgot Password
// @route   POST /api/auth/forgotpassword
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(404).json({ success: false, error: 'No user with that email' });

    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${req.protocol}://${req.get('host')}/api/auth/resetpassword/${resetToken}`;
    const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`;

    await sendEmail({ email: user.email, subject: 'Password reset token', message });
    res.status(200).json({ success: true, data: 'Email sent' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Reset Password
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
exports.resetPassword = async (req, res) => {
  const resetPasswordToken = crypto.createHash('sha256').update(req.params.resettoken).digest('hex');

  try {
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ success: false, error: 'Invalid token' });

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({ success: true, data: 'Password updated' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Google Login
// @route   POST /api/auth/google
// @access  Public
exports.googleLogin = async (req, res) => {
  try {
    const { token, role } = req.body;
    
    // MOCK VALIDATION IF CLIENT ID IS MISSING
    let payload;
    try {
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID
      });
      payload = ticket.getPayload();
    } catch(err) {
      // Fallback for demo without keys
      payload = { email: 'demo@google.com', name: 'Google User', sub: 'google123' };
    }

    const { email, name, sub: googleId } = payload;
    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({ name, email, googleId, role: role || 'farmer', isVerified: true });
    }

    const jwtToken = generateToken(user._id);
    res.status(200).json({ success: true, token: jwtToken, user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  const token = user.getSignedJwtToken();
  res.status(statusCode).json({ success: true, token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
};
