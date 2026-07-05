const express = require('express');
const { register, login, getMe, verifyOTP, forgotPassword, resetPassword, googleLogin } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/verify', verifyOTP);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);
router.post('/google', googleLogin);
router.get('/me', protect, getMe);

module.exports = router;
