const jwt            = require('jsonwebtoken');
const User           = require('../models/User');
const { sendOtpEmail, sendSecurityAlertEmail } = require('../utils/email');

/* ── helper: sign JWT ── */
function signToken(userId) {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

/* ══════════════════════════════════════
   REGISTER
   POST /api/auth/register
══════════════════════════════════════ */
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }

    // Check if email already exists
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing && existing.isVerified) {
      return res.status(400).json({ error: 'Email already registered.' });
    }

    // If unverified account exists, reuse it
    let user = existing;
    if (!user) {
      user = new User({ name, email, password });
    } else {
      user.name     = name;
      user.password = password;
    }

    // Generate OTP and send email
    const otp = user.generateOtp('verify');
    await user.save();

    await sendOtpEmail(email, otp, 'verify');

    res.status(201).json({
      message: 'Account created. Check your email for the verification code.',
      userId:  user._id,
      email:   user.email,
    });
  } catch (err) {
    console.error('Register error:', err.message);
    console.error('Full error stack:', err);
    res.status(500).json({ error: 'Registration failed. Please try again.', details: err.message });
  }
};

/* ══════════════════════════════════════
   VERIFY OTP
   POST /api/auth/verify-otp
══════════════════════════════════════ */
exports.verifyOtp = async (req, res) => {
  try {
    const { userId, otp } = req.body;
    if (!userId || !otp) {
      return res.status(400).json({ error: 'userId and otp are required.' });
    }

    const user = await User.findById(userId).select('+otp +otpExpires +otpType');
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const type = user.otpType;
    if (!user.verifyOtp(otp, type)) {
      return res.status(400).json({ error: 'Invalid or expired code.' });
    }

    // Mark verified and clear OTP - but NOT for reset type
    if (type === 'verify') user.isVerified = true;
    if (type !== 'reset') user.clearOtp(); // Don't clear for reset password
    await user.save();

    // Sign token and return
    const token = signToken(user._id);
    res.json({
      message: type === 'verify' ? 'Email verified successfully.' : 'Code verified.',
      token,
      user: {
        id:    user._id,
        name:  user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error('VerifyOtp error:', err.message);
    res.status(500).json({ error: 'Verification failed. Please try again.' });
  }
};

/* ══════════════════════════════════════
   RESEND OTP
   POST /api/auth/resend-otp
══════════════════════════════════════ */
exports.resendOtp = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required.' });
    }

    const user = await User.findById(userId).select('+otp +otpExpires +otpType');
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const otp = user.generateOtp(user.otpType || 'verify');
    await user.save();
    await sendOtpEmail(user.email, otp, user.otpType || 'verify');

    res.json({ message: 'New code sent to your email.' });
  } catch (err) {
    console.error('ResendOtp error:', err.message);
    res.status(500).json({ error: 'Could not resend code. Please try again.' });
  }
};

/* ══════════════════════════════════════
   LOGIN
   POST /api/auth/login
══════════════════════════════════════ */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // Get user with password
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Check verified
    if (!user.isVerified) {
      const otp = user.generateOtp('verify');
      await user.save();
      await sendOtpEmail(user.email, otp, 'verify');
      return res.status(403).json({
        error:  'Email not verified. A new code has been sent.',
        userId: user._id,
        email:  user.email,
      });
    }

    // Send 2FA OTP
    const otp = user.generateOtp('login');
    await user.save();
    await sendOtpEmail(user.email, otp, 'login');

    res.json({
      message: '2FA code sent to your email.',
      userId:  user._id,
      email:   user.email,
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
};

/* ══════════════════════════════════════
   FORGOT PASSWORD
   POST /api/auth/forgot-password
══════════════════════════════════════ */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    
    // CRITICAL SECURITY: Only send reset emails to registered and verified users
    if (!user) {
      return res.status(404).json({ error: 'No account found with this email address.' });
    }
    
    if (!user.isVerified) {
      return res.status(403).json({ error: 'Please verify your email address first.' });
    }

    const otp = user.generateOtp('reset');
    await user.save();
    
    try {
      await sendOtpEmail(user.email, otp, 'reset');
    } catch (emailError) {
      console.error(`❌ Failed to send reset email to ${email}:`, emailError.message);
      return res.status(500).json({ error: 'Failed to send reset email. Please try again later.' });
    }

    res.json({
      message: 'Reset code sent to your email.',
      userId:  user._id,
      email:   user.email,
    });
  } catch (err) {
    console.error('ForgotPassword error:', err.message);
    res.status(500).json({ error: 'Could not send reset email. Please try again.' });
  }
};

/* ══════════════════════════════════════
   RESET PASSWORD
   POST /api/auth/reset-password
══════════════════════════════════════ */
exports.resetPassword = async (req, res) => {
  try {
    const { userId, otp, newPassword } = req.body;
    if (!userId || !otp || !newPassword) {
      return res.status(400).json({ error: 'userId, otp and newPassword are required.' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }

    const user = await User.findById(userId).select('+otp +otpExpires +otpType');
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (!user.verifyOtp(otp, 'reset')) {
      return res.status(400).json({ error: 'Invalid or expired reset code.' });
    }

    user.password = newPassword;
    user.clearOtp();
    await user.save();

    // Send password reset notification email
    try {
      await sendSecurityAlertEmail(user.email, user.name, 'password_changed', {
        device: 'Password Reset Flow',
        location: 'Unknown',
        time: new Date().toLocaleString()
      });
    } catch (emailError) {
      // Don't fail the password reset if email fails
    }

    res.json({ message: 'Password reset successfully. Please log in.' });
  } catch (err) {
    console.error('ResetPassword error:', err.message);
    res.status(500).json({ error: 'Password reset failed. Please try again.' });
  }
};

/* ══════════════════════════════════════
   GET ME
   GET /api/auth/me
══════════════════════════════════════ */
exports.getMe = async (req, res) => {
  res.json({
    user: {
      id:         req.user._id,
      name:       req.user.name,
      email:      req.user.email,
      isVerified: req.user.isVerified,
      createdAt:  req.user.createdAt,
    },
  });
};

/* ══════════════════════════════════════
   UPDATE PROFILE
   PUT /api/auth/update-profile
══════════════════════════════════════ */
exports.updateProfile = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Name is required.' });
    }

    req.user.name = name.trim();
    await req.user.save();

    res.json({
      message: 'Profile updated.',
      user: {
        id:    req.user._id,
        name:  req.user.name,
        email: req.user.email,
      },
    });
  } catch (err) {
    console.error('UpdateProfile error:', err.message);
    res.status(500).json({ error: 'Could not update profile.' });
  }
};

/* ══════════════════════════════════════
   CHANGE PASSWORD
   PUT /api/auth/change-password
══════════════════════════════════════ */
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required.' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters.' });
    }

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }

    user.password = newPassword;
    await user.save();

    // Send password change notification email
    try {
      await sendSecurityAlertEmail(user.email, user.name, 'password_changed', {
        device: 'Web Browser',
        location: 'Unknown',
        time: new Date().toLocaleString()
      });
    } catch (emailError) {
      // Don't fail the password change if email fails
    }

    res.json({ message: 'Password changed successfully.' });
  } catch (err) {
    console.error('ChangePassword error:', err.message);
    res.status(500).json({ error: 'Could not change password.' });
  }
};

/* ══════════════════════════════════════
   DELETE ACCOUNT
   DELETE /api/auth/delete-account
══════════════════════════════════════ */
exports.deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ error: 'Password is required to delete account.' });
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect password.' });
    }

    // Capture user info before deletion for the email notification
    const userEmail = user.email;
    const userName = user.name;

    // Delete all vault items first
    const VaultItem = require('../models/VaultItem');
    await VaultItem.deleteMany({ user: user._id });

    // Delete user
    await User.findByIdAndDelete(user._id);

    // Send account deletion notification email
    try {
      const { sendAccountDeletedEmail } = require('../utils/email');
      await sendAccountDeletedEmail(userEmail, userName);
    } catch (emailError) {
      console.error('Failed to send account deletion email:', emailError.message);
      // Don't fail the deletion if email fails
    }

    res.json({ message: 'Account deleted successfully.' });
  } catch (err) {
    console.error('DeleteAccount error:', err.message);
    res.status(500).json({ error: 'Could not delete account.' });
  }
};