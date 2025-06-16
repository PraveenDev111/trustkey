const express = require('express');
const router = express.Router();
const { getNonce, verifySignature, getProtectedData, getAllUsers, logout, getUserDetails } = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

// @route   GET api/auth/nonce/:address
// @desc    Get a nonce for a user to sign
// @access  Public
router.get('/nonce/:address', getNonce);

// @route   POST api/auth/verify
// @desc    Verify a signature and return a JWT
// @access  Public
router.post('/verify', verifySignature);

// @route   GET api/auth/protected
// @desc    Get protected data for the logged-in user
// @access  Private
router.get('/protected', authMiddleware, getProtectedData);

// @route   GET api/auth/users
// @desc    Get all registered users (admin only)
// @access  Private
router.get('/users', authMiddleware, getAllUsers);

// @route   GET api/auth/me
// @desc    Get details for the currently authenticated user
// @access  Private
router.get('/me', authMiddleware, getUserDetails);

// @route   POST api/auth/logout
// @desc    Logout user and clear token
// @access  Private
router.post('/logout', authMiddleware, logout);

module.exports = router;
