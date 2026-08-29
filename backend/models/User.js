const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Please add a name'] },
  email: { type: String, required: [true, 'Please add an email'], unique: true, match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please add a valid email'] },
  role: { type: String, enum: ['farmer', 'trader', 'admin'], default: 'farmer' },
  password: { 
    type: String, 
    required: function() { return !this.googleId; }, 
    minlength: 6, 
    select: false 
  },
  googleId: { type: String },
  phone: { type: String },
  address: { type: String },
  village: { type: String },
  district: { type: String },
  state: { type: String },
  businessName: { type: String },
  businessAddress: { type: String },
  avatar: { type: String, default: 'default.jpg' },
  rating: { type: Number, default: 0 },
  isVerified: { type: Boolean, default: true },
  otp: { type: String },
  otpExpiry: { type: Date },
  resetPasswordToken: { type: String },
  resetPasswordExpire: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

// Encrypt password using bcrypt
UserSchema.pre('save', async function () {
  if (!this.password || !this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id, role: this.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
