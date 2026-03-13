const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const crypto   = require('crypto');

const userSchema = new mongoose.Schema(
  {
    name: {
      type:     String,
      required: [true, 'Name is required'],
      trim:     true,
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },

    email: {
      type:      String,
      required:  [true, 'Email is required'],
      unique:    true,
      lowercase: true,
      trim:      true,
      match:     [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },

    password: {
      type:      String,
      required:  [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select:    false, // never returned in queries by default
    },

    isVerified: {
      type:    Boolean,
      default: false,
    },

    /* ── OTP fields (used for verify / login 2FA / reset) ── */
    otp:          { type: String,  select: false },
    otpExpires:   { type: Date,    select: false },
    otpType:      { type: String,  select: false }, // 'verify' | 'login' | 'reset'

    /* ── Notification Preferences ── */
    notificationPreferences: {
      emailNotif: { type: Boolean, default: true },
      loginAlert: { type: Boolean, default: true },
      weakAlert: { type: Boolean, default: true }
    }

  },
  {
    timestamps: true, // adds createdAt, updatedAt automatically
  }
);

/* ══════════════════════════════════════
   HASH PASSWORD BEFORE SAVING
══════════════════════════════════════ */
userSchema.pre('save', async function (next) {
  // Only hash if password was changed
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

/* ══════════════════════════════════════
   INSTANCE METHODS
══════════════════════════════════════ */

// Compare entered password with hashed password in DB
userSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// Generate a 6-digit OTP and save it with expiry
userSchema.methods.generateOtp = function (type = 'verify') {
  const otp          = Math.floor(100000 + Math.random() * 900000).toString();
  this.otp           = otp;
  this.otpExpires    = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  this.otpType       = type;
  return otp;
};

// Verify OTP — checks code + expiry + type
userSchema.methods.verifyOtp = function (enteredOtp, type) {
  if (!this.otp || !this.otpExpires)          return false;
  if (this.otpType !== type)                  return false;
  if (this.otpExpires < new Date())           return false;
  if (this.otp !== enteredOtp)                return false;
  return true;
};

// Clear OTP after use
userSchema.methods.clearOtp = function () {
  this.otp        = undefined;
  this.otpExpires = undefined;
  this.otpType    = undefined;
};

const User = mongoose.model('User', userSchema);
module.exports = User;