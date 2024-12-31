const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Define the User schema
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true, // Ensure username is unique
    },
    email: {
      type: String,
      required: true,
      unique: true, // Ensure email is unique
    },
    password: {
      type: String,
      required: true,
    },
    bio: {
      type: String,
      default: '', // Default value for bio
    },
    profilePicture: {
      type: String, // URL or file path to the profile picture
      default: '', // Default can be an image URL if needed
    },
    status: {
      type: String, // User's status
      default: 'Available', // Default status is 'Available'
    },
    lastSeen: {
      type: Date,
      default: Date.now, // Last seen field, default to current time
    },
    blockedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to other User models
      },
    ],
    reportedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to other User models
      },
    ],
    fcmToken: {
      type: String, // Field to store push notification token
    },
    publicKey: {
      type: String, // Optional field for public key
    },
    // Fields for Two-Factor Authentication (2FA)
    phone: {
      type: String, // Optional phone number for SMS-based 2FA
    },
    twoFactorCode: {
      type: String, // Code sent to the user for 2FA
    },
    twoFactorExpiry: {
      type: Date, // Expiry time for the 2FA code
    },
    // New fields for theme and font size preferences
    theme: { 
      type: String, 
      default: 'light'  // Options: 'light' or 'dark'
    },
    fontSize: { 
      type: String, 
      default: 'medium' // Options: 'small', 'medium', 'large'
    },
  },
  { timestamps: true } // Add createdAt and updatedAt fields
);

// Hash the password before saving the user
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12); // Salt rounds = 12
  next();
});

// Define a method to verify a user's password
userSchema.methods.verifyPassword = async function (inputPassword) {
  return bcrypt.compare(inputPassword, this.password);
};

// Check if the model is already defined to prevent OverwriteModelError
const User = mongoose.models.User || mongoose.model('User', userSchema);

module.exports = User;
