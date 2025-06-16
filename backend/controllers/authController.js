const jwt = require('jsonwebtoken');
const { ethers } = require('ethers');
const { logAuthAttempt, trackPerformance, logPerformance } = require('../utils/logger');
const { userAuthContract } = require('../utils/web3');

// In-memory store for nonces. In production, use a more robust store like Redis.
const nonceStore = new Map();

// @desc    Generate and store a nonce for a given address
const getNonce = async (req, res) => {
  const endOperation = trackPerformance('nonceGeneration');
  try {
    const { address } = req.params;
    const lowerCaseAddress = address.toLowerCase();

    // 1. Check if the user is registered in the smart contract
    const isRegistered = await userAuthContract.isUserRegistered(address);
    if (!isRegistered) {
      const logData = {
        type: 'login',
        address,
        status: 'failure',
        ip: req.ip,
        metadata: { reason: 'unregistered_user' }
      };
      logAuthAttempt(logData);
      endOperation({ status: 'failure', ...logData });
      return res.status(403).json({ error: 'User is not registered. Please register first.' });
    }

    // 2. If registered, proceed with nonce generation
    const nonce = `trustkey-login-${Math.floor(Math.random() * 1000000).toString()}`;
    nonceStore.set(lowerCaseAddress, nonce);
    
    logAuthAttempt({
      type: 'nonce_issued',
      address,
      status: 'pending',
      ip: req.ip
    });
    
    endOperation({ status: 'success', type: 'nonce_issued', address, ip: req.ip });
    console.log(`Generated nonce for registered user ${address}: ${nonce}`);
    res.json({ nonce });
  } catch (error) {
    console.error('Error during registration check or nonce generation:', error);
    endOperation({ status: 'error', error: error.message });
    res.status(500).json({ error: 'An internal error occurred.' });
  }
};

// @desc    Verify a signature and issue a JWT
const verifySignature = async (req, res) => {
  const endOperation = trackPerformance('signatureVerification');
  const endJwtOperation = trackPerformance('jwtIssuance');
  
  try {
    const { address, signature } = req.body;
    const lowerCaseAddress = address.toLowerCase();
    const nonce = nonceStore.get(lowerCaseAddress);

    if (!nonce) {
      const logData = {
        type: 'login',
        address,
        status: 'failure',
        ip: req.ip,
        metadata: { reason: 'invalid_nonce' }
      };
      logAuthAttempt(logData);
      endOperation({ status: 'failure', ...logData });
      return res.status(400).json({ error: 'Nonce not found or has expired. Please try again.' });
    }

    // Recover the address from the signature and the original message (nonce)
    const endSigVerification = trackPerformance('signatureVerification');
    const signerAddr = ethers.verifyMessage(nonce, signature);
    const sigDuration = endSigVerification({ operation: 'verifyMessage' });

    // Check if the recovered address matches the provided address
    if (signerAddr.toLowerCase() !== lowerCaseAddress) {
      const logData = {
        type: 'login',
        address,
        status: 'failure',
        ip: req.ip,
        metadata: { 
          reason: 'signature_mismatch',
          expected: lowerCaseAddress,
          received: signerAddr.toLowerCase(),
          verificationTimeMs: sigDuration
        }
      };
      logAuthAttempt(logData);
      endOperation({ status: 'failure', ...logData });
      return res.status(401).json({ error: 'Invalid signature. Verification failed.' });
    }

    // Signature is valid, create JWT token
    const endJwtOperation = trackPerformance('jwtIssuance');
    const token = jwt.sign(
      { address: lowerCaseAddress },
      process.env.JWT_SECRET,
      { expiresIn: '1h' } // Token expires in 1 hour
    );
    const tokenDuration = endJwtOperation({ operation: 'sign' });

    // Important: Invalidate the nonce after use to prevent replay attacks
    nonceStore.delete(lowerCaseAddress);

    // Log successful login
    const logData = {
      type: 'login',
      address,
      status: 'success',
      ip: req.ip,
      metadata: { 
        tokenExpiresIn: '1h',
        verificationTimeMs: sigDuration,
        tokenGenerationTimeMs: tokenDuration
      }
    };
    
    logAuthAttempt(logData);
    endOperation({ status: 'success', ...logData });
    endJwtOperation({ status: 'success', ...logData });

    console.log(`Successfully verified signature for ${address}. JWT issued.`);
    res.json({ token });
  } catch (error) {
    console.error('Error during signature verification:', error);
    endOperation({ status: 'error', error: error.message });
    endJwtOperation({ status: 'error', error: error.message });
    res.status(500).json({ error: 'An error occurred during signature verification.' });
  }
};

// @desc    Get protected data for an authenticated user
// @desc    Get all registered users
const getAllUsers = async (req, res) => {
  try {
    // Get user count first
    const userCount = await userAuthContract.getUserCount();
    
    // Fetch each user's address
    const users = [];
    for (let i = 0; i < userCount; i++) {
      try {
        const userAddress = await userAuthContract.getUserByIndex(i);
        const [username, email, publicKey] = await userAuthContract.getUserDetails(userAddress);
        users.push({
          address: userAddress,
          username,
          email,
          publicKey: publicKey.toString('hex').substring(0, 20) + '...' // Just show part of the public key
        });
      } catch (err) {
        console.error(`Error fetching user at index ${i}:`, err);
        // Continue with next user even if one fails
      }
    }
    
    res.json({ success: true, users });
  } catch (error) {
    console.error('Error in getAllUsers:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
};

// @desc    Get the authenticated user's details
// @access  Private
const getUserDetails = async (req, res) => {
  try {
    const userAddress = req.user.address; // From JWT token
    
    // Get user details from the smart contract
    const [username, email, publicKey] = await userAuthContract.getUserDetails(userAddress);
    
    res.json({
      success: true,
      user: {
        address: userAddress,
        username,
        email,
        publicKey: publicKey ? publicKey.toString('hex') : null
      }
    });
  } catch (error) {
    console.error('Error fetching user details:', error);
    if (error.message.includes('User not found')) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.status(500).json({ success: false, error: 'Failed to fetch user details' });
  }
};

// @desc    Get protected data for an authenticated user
const getProtectedData = async (req, res) => {
  try {
    // The authMiddleware has already verified the token and attached the user to the request
    const userAddress = req.user.address;
    
    // Here you could fetch additional user data from your smart contract
    // For example: const userData = await userAuthContract.getUserDetails(userAddress);
    
    res.json({
      success: true,
      message: 'Welcome to your TrustKey Dashboard!',
      user: {
        address: userAddress,
        // Add any additional user data from your smart contract here
        registrationDate: new Date().toISOString(),
        // userLevel, subscriptionStatus, etc.
      },
      dashboardData: {
        // Add any dashboard-specific data here
        recentActivity: [],
        stats: {
          // Example stats
          documentsSigned: 0,
          keysManaged: 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching protected data:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to load dashboard data' 
    });
  }
};

// @desc    Logout a user
// @access  Private
const logout = async (req, res) => {
  try {
    const { address } = req.user; // Get address from authenticated user
    
    // Log the logout action
    logAuthAttempt({
      type: 'logout',
      address,
      status: 'success',
      ip: req.ip,
      metadata: { action: 'user_logged_out' }
    });
    
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ success: false, error: 'Logout failed' });
  }
};

module.exports = { 
  getNonce, 
  verifySignature, 
  getProtectedData, 
  getAllUsers, 
  logout, 
  getUserDetails 
};
