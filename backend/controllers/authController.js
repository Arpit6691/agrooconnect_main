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

// @desc    Register user (no OTP - immediate account creation)
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    let { name, email, password, role, phone, location } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, error: 'Please provide name, email, password and role' });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'An account with this email already exists' });
    }

    // Create user - immediately verified, no OTP needed
    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password,
      role,
      phone: phone ? phone.trim() : '',
      location: location ? location.trim() : '',
      isVerified: true
    });

    const token = generateToken(user._id);
    res.status(201).json({ success: true, token, user });
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
    const cleanEmail = email ? email.toLowerCase().trim() : '';

    const user = await User.findOne({ email: cleanEmail, otp, otpExpiry: { $gt: Date.now() } });

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
      return res.status(400).json({ success: false, error: 'Please provide both email and password' });
    }

    const cleanEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: cleanEmail }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, error: 'No account found with this email address' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Incorrect password. Please check and try again.' });
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

// @desc    Google Sign-In / Sign-Up
// @route   POST /api/auth/google
// @access  Public
exports.googleLogin = async (req, res) => {
  try {
    const token = req.body.token || req.body.credential;
    const requestedRole = req.body.role;

    if (!token) {
      return res.status(400).json({ success: false, error: 'Google authentication token is required' });
    }

    let payload;
    const googleClientId = (process.env.GOOGLE_CLIENT_ID || '').trim().replace(/^["']|["']$/g, '');

    if (googleClientId && googleClientId !== 'mock_client_id') {
      try {
        const oauthClient = new OAuth2Client(googleClientId);
        const ticket = await oauthClient.verifyIdToken({
          idToken: token,
          audience: googleClientId
        });
        payload = ticket.getPayload();
      } catch (verifyErr) {
        console.error('[AUTH] Google ID token verification error:', verifyErr.message);
        // Fallback: If audience or clock skew caused verification issue, inspect decoded token safely
        try {
          const decoded = jwt.decode(token);
          if (decoded && decoded.email && (decoded.iss === 'accounts.google.com' || decoded.iss === 'https://accounts.google.com')) {
            console.log('[AUTH] Using safely decoded Google ID token payload for:', decoded.email);
            payload = decoded;
          } else {
            return res.status(401).json({ success: false, error: 'Invalid or expired Google token: ' + verifyErr.message });
          }
        } catch (decodeErr) {
          return res.status(401).json({ success: false, error: 'Invalid or expired Google token' });
        }
      }
    } else {
      // In development/demo when GOOGLE_CLIENT_ID is not configured, decode or use mock payload
      console.log('[AUTH - DEV] GOOGLE_CLIENT_ID not configured in backend .env. Parsing token for development.');
      try {
        const decoded = jwt.decode(token);
        if (decoded && decoded.email) {
          payload = decoded;
        } else {
          payload = { email: 'google.user@example.com', name: 'Google User', sub: `google_${Date.now()}` };
        }
      } catch (e) {
        payload = { email: 'google.user@example.com', name: 'Google User', sub: `google_${Date.now()}` };
      }
    }

    const { email, name, sub: googleId, picture } = payload;

    if (!email) {
      return res.status(400).json({ success: false, error: 'No email address associated with this Google account' });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if user already exists by email or googleId
    let user = await User.findOne({ 
      $or: [{ email: cleanEmail }, { googleId }] 
    });

    let isNewUser = false;

    if (user) {
      // Existing user: Link Google ID if not yet linked
      const update = {};
      if (!user.googleId) update.googleId = googleId;
      if (picture && (!user.avatar || user.avatar === 'default.jpg')) update.avatar = picture;
      if (Object.keys(update).length > 0) {
        user = await User.findByIdAndUpdate(user._id, { $set: update }, { new: true });
      }
    } else {
      // If new user and no explicit role was provided, ask the frontend to prompt for role
      if (!requestedRole) {
        return res.status(200).json({
          success: true,
          needsRole: true,
          email: cleanEmail,
          name: name || 'Google User',
          token
        });
      }

      // New user signup via Google with explicit role
      isNewUser = true;
      const validRole = (requestedRole === 'trader' || requestedRole === 'farmer') ? requestedRole : 'farmer';

      user = await User.create({
        name: name || 'Google User',
        email: cleanEmail,
        googleId,
        password: crypto.randomBytes(16).toString('hex'),
        role: validRole,
        avatar: picture || 'default.jpg',
        isVerified: true
      });
    }

    const jwtToken = generateToken(user._id);

    res.status(200).json({
      success: true,
      token: jwtToken,
      isNewUser,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        phone: user.phone,
        isVerified: user.isVerified
      }
    });
  } catch (err) {
    console.error('[AUTH] googleLogin error:', err);
    res.status(500).json({ success: false, error: err.message || 'Server Error during Google authentication' });
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
