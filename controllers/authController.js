const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const twilio = require('twilio');
const rateLimit = require('express-rate-limit');

// Create a rate limiter for 2FA requests
const twoFALimit = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // Max 5 requests per hour
    message: "Too many requests. Please try again later.",
});

// Register a new user with RSA key generation
const registerUser = async (req, res) => {
    const { username, email, password } = req.body;

    try {
        // Check if user already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Generate RSA key pair
        const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: {
                type: 'spki',
                format: 'pem',
            },
            privateKeyEncoding: {
                type: 'pkcs8',
                format: 'pem',
            },
        });

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Save the user
        const user = await User.create({
            username,
            email,
            password: hashedPassword,
            publicKey,
        });

        if (user) {
            res.status(201).json({
                message: 'User registered successfully',
                privateKey, // Private key for client storage
                token: generateToken(user.id),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        console.error('Error during registration:', error);
        res.status(500).json({ message: 'Error during registration' });
    }
};

// Login a user (Updated implementation from the update file)
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        res.status(200).json({
            user: {
                id: user._id,
                username: user.username,
                theme: user.theme,
                fontSize: user.fontSize,
            },
        });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Generate and send 2FA code (via email or SMS)
const send2FACode = async (req, res) => {
    const { email, phone } = req.body; // You can pass either email or phone, based on the preferred method

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if the code already exists and has not expired
        if (user.twoFactorExpiry && user.twoFactorExpiry > new Date()) {
            return res.status(400).json({ message: '2FA code already sent, please wait for it to expire.' });
        }

        // Generate a random 6-digit 2FA code
        const twoFactorCode = Math.floor(100000 + Math.random() * 900000).toString();
        const twoFactorExpiry = new Date(Date.now() + 5 * 60 * 1000); // Valid for 5 minutes

        // Store the 2FA code and expiry time
        user.twoFactorCode = twoFactorCode;
        user.twoFactorExpiry = twoFactorExpiry;
        await user.save();

        // Send the code via email or SMS
        if (email) {
            const transporter = nodemailer.createTransport({
                service: 'Gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASSWORD,
                },
            });

            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: user.email,
                subject: 'Your 2FA Code',
                text: `Your verification code is ${twoFactorCode}. It will expire in 5 minutes.`,
            });

            res.status(200).json({ message: '2FA code sent successfully' });
        } else if (phone) {
            const client = new twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

            await client.messages.create({
                body: `Your verification code is ${twoFactorCode}. It will expire in 5 minutes.`,
                from: process.env.TWILIO_PHONE_NUMBER,
                to: phone,
            });

            res.status(200).json({ message: '2FA code sent via SMS successfully' });
        } else {
            res.status(400).json({ message: 'Email or phone number is required' });
        }
    } catch (error) {
        console.error('Error sending 2FA code:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Verify 2FA code
const verify2FACode = async (req, res) => {
    const { email, code } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if the provided code matches the stored code and if the code hasn't expired
        if (user.twoFactorCode === code && user.twoFactorExpiry > new Date()) {
            // Clear the 2FA code after successful verification
            user.twoFactorCode = null;
            user.twoFactorExpiry = null;
            await user.save();

            res.status(200).json({ message: '2FA verification successful' });
        } else if (user.twoFactorExpiry < new Date()) {
            // Handle expired code
            res.status(400).json({ message: 'Your 2FA code has expired. Please request a new one.' });
        } else {
            // Handle wrong code
            res.status(400).json({ message: 'Invalid 2FA code. Please try again.' });
        }
    } catch (error) {
        console.error('Error verifying 2FA code:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Update user preferences (theme and font size)
const updateUserPreferences = async (req, res) => {
    const { userId, theme, fontSize } = req.body;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.theme = theme || user.theme;
        user.fontSize = fontSize || user.fontSize;
        await user.save();

        res.status(200).json({ message: 'Preferences updated successfully' });
    } catch (error) {
        console.error('Error updating preferences:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

module.exports = {
    registerUser,
    loginUser,
    send2FACode,
    verify2FACode,
    updateUserPreferences, // Export the update preferences function
    twoFALimit, // Export the rate limit for use in the routes
};
