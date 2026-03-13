const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const {
  register,
  verifyOtp,
  resendOtp,
  login,
  forgotPassword,
  resetPassword,
  getMe,
  updateProfile,
  changePassword,
  deleteAccount,
} = require('../controllers/authController');

// Public routes
router.post('/register',       register);
router.post('/verify-otp',     verifyOtp);
router.post('/resend-otp',     resendOtp);
router.post('/login',          login);
router.post('/forgot-password',forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes (need JWT token)
router.get ('/me',              auth, getMe);
router.put ('/update-profile',  auth, updateProfile);
router.put ('/change-password', auth, changePassword);
router.delete('/delete-account',auth, deleteAccount);

module.exports = router;