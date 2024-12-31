// authRoutes.js file 
const express = require('express');
const { 
    send2FACode, 
    verify2FACode, 
    registerUser, 
    loginUser, 
    updateUserPreferences // Added updateUserPreferences function 
} = require('../controllers/authController');

const router = express.Router();

router.post('/send-2fa', send2FACode); // Send 2FA code
router.post('/verify-2fa', verify2FACode); // Verify 2FA code
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/update-preferences', updateUserPreferences); // Added route for updating preferences

module.exports = router;
