const jwt = require('jsonwebtoken');
const { ethers } = require('ethers');
const { logAuthAttempt, trackPerformance } = require('../utils/logger');
const { userCertificateManagerContract } = require('../utils/web3');

// In-memory store for nonces. In production, use a more robust store like Redis.
const nonceStore = new Map();

// @desc    Generate and store a nonce for a given address
const getNonce = async (req, res) => {
  const endOperation = trackPerformance('nonceGeneration');
  try {
    const { address } = req.params;
    const lowerCaseAddress = address.toLowerCase();

    // 1. Check if the user is registered in the smart contract
    try {
      // Try to get user details - will throw if not registered
      await userCertificateManagerContract.getUserDetails(address);
    } catch (error) {
      const logData = {
        type: 'login',
        address,
        status: 'failure',
        ip: req.ip,
        metadata: { reason: 'unregistered_user', error: error.message }
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

    // 1. Recover the signer address from the signature
    let signerAddress;
    try {
      // For ethers v5.x
      signerAddress = ethers.utils.verifyMessage(nonce, signature);
    } catch (error) {
      logAuthAttempt({
        type: 'login',
        address,
        status: 'failure',
        ip: req.ip,
        metadata: { reason: 'invalid_signature', error: error.message }
      });
      endOperation({ status: 'failure', type: 'login', address, ip: req.ip, reason: 'invalid_signature' });
      return res.status(401).json({ error: 'Invalid signature format.' });
    }

    const lowerCaseSigner = signerAddress.toLowerCase();

    if (lowerCaseSigner !== lowerCaseAddress) {
      logAuthAttempt({
        type: 'login',
        address,
        status: 'failure',
        ip: req.ip,
        metadata: { 
          reason: 'signature_mismatch',
          expected: lowerCaseAddress,
          received: lowerCaseSigner 
        }
      });
      endOperation({ 
        status: 'failure', 
        type: 'login', 
        address, 
        ip: req.ip, 
        reason: 'signature_mismatch' 
      });
      return res.status(401).json({ 
        error: 'Signature does not match the provided address.' 
      });
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
        verificationTimeMs: 0,
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
    res.status(500).json({ error: 'An error occurred during signature verification.' });
  }
};

// @desc    Get all registered users
// @access  Private
const getAllUsers = async (req, res) => {
  try {
    // Try to get all users at once first
    let userAddresses = [];
    
    try {
      userAddresses = await userCertificateManagerContract.getAllUsers();
    } catch (error) {
      console.log('getAllUsers() not available, falling back to index-based fetching');
      // Fallback to index-based fetching if getAllUsers fails
      const userCount = await userCertificateManagerContract.getUserCount();
      for (let i = 0; i < userCount; i++) {
        const address = await userCertificateManagerContract.getUserByIndex(i);
        if (address && address !== '0x0000000000000000000000000000000000000000') {
          userAddresses.push(address);
        }
      }
    }

    // Get details for each user
    const users = await Promise.all(
      userAddresses.map(async (userAddress) => {
        try {
          const [username, email, publicKey] = await userCertificateManagerContract.getUserDetails(userAddress);
          return {
            address: userAddress,
            username: username || 'Unknown',
            email: email || 'N/A',
            publicKey: publicKey || 'N/A',
            isRegistered: true
          };
        } catch (error) {
          console.error(`Error fetching details for ${userAddress}:`, error);
          return {
            address: userAddress,
            username: 'Error',
            email: 'Error fetching details',
            publicKey: 'N/A',
            isRegistered: false
          };
        }
      })
    );

    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ 
      error: 'Failed to fetch users',
      details: error.message 
    });
  }
};

// @desc    Get the authenticated user's details
// @access  Private
const getUserDetails = async (req, res) => {
  try {
    const userAddress = req.user.address; // From JWT token
    
    // Get user details from the smart contract
    const [username, email, publicKey] = await userCertificateManagerContract.getUserDetails(userAddress);
    
    res.json({
      success: true,
      user: {
        address: userAddress,
        username: username || 'Unknown',
        email: email || 'N/A',
        publicKey: publicKey || 'N/A',
        isRegistered: true
      }
    });
  } catch (error) {
    console.error('Error fetching user details:', error);
    if (error.message.includes('User not found') || error.message.includes('user does not exist')) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found',
        details: error.message 
      });
    }
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch user details',
      details: error.message 
    });
  }
};

// @desc    Get user details by Ethereum address
// @access  Public
const getUserByAddress = async (req, res) => {
  try {
    const { address } = req.params;
    
    // Basic address validation
    if (typeof address !== 'string' || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      console.log('Invalid address format:', address);
      return res.status(400).json({ success: false, error: 'Invalid Ethereum address format' });
    }
    
    const normalizedAddress = address.toLowerCase();
    console.log('Fetching user details for:', normalizedAddress);
    
    // Get user details from the smart contract
    const [username, email, publicKey] = await userCertificateManagerContract.getUserDetails(normalizedAddress);
    
    console.log('User details fetched:', { 
      username: username || 'Not provided', 
      email: email || 'Not provided',
      hasPublicKey: !!publicKey 
    });
    
    res.json({
      success: true,
      user: {
        address: normalizedAddress,
        username: username || 'Unknown',
        email: email || 'N/A',
        publicKey: publicKey || 'N/A',
        isRegistered: true
      }
    });
    
  } catch (error) {
    console.error('Error in getUserByAddress:', error);
    if (error.message.includes('User not found') || 
        error.message.includes('user does not exist') ||
        error.message.includes('invalid address')) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found',
        details: error.message 
      });
    }
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch user details',
      details: error.message 
    });
  }
};

// @desc    Get protected data for an authenticated user
const getProtectedData = async (req, res) => {
  try {
    // The authMiddleware has already verified the token and attached the user to the request
    const userAddress = req.user.address;
    
    // Get user details from the smart contract
    const [username, email, publicKey] = await userCertificateManagerContract.getUserDetails(userAddress);
    
    res.json({
      success: true,
      data: {
        message: 'This is protected data',
        user: {
          address: userAddress,
          username: username || 'Unknown',
          email: email || 'N/A',
          publicKey: publicKey || 'N/A'
        }
      }
    });
  } catch (error) {
    console.error('Error fetching protected data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch protected data',
      details: error.message
    });
  }
};

// @desc    Logout a user
// @access  Private
const logout = (req, res) => {
  // In a stateless JWT system, the client should delete the token
  // This endpoint is a placeholder for any server-side cleanup if needed
  res.json({ success: true, message: 'Logout successful' });
};

module.exports = {
  getNonce,
  verifySignature,
  getAllUsers,
  getUserDetails,
  getUserByAddress,
  getProtectedData,
  logout
};
