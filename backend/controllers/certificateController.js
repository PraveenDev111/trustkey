const { ethers } = require('ethers');
const { userCertificateManagerContract, wallet, provider } = require('../utils/web3');
const { logAuthAttempt } = require('../utils/logger');

/**
 * @desc    Get certificate for a user
 * @route   GET /api/certificates/:address
 * @access  Private (Owner or Admin)
 */
/**
 * Helper function to handle certificate not found responses
 */
const handleCertificateNotFound = (res, address, error = null) => {
  const response = {
    success: true,
    hasCertificate: false,
    message: 'No certificate found for this address',
    address: address
  };
  
  if (error) {
    response.error = error.message;
  }
  
  return res.status(200).json(response);
};

/**
 * Helper function to format certificate response
 */
const formatCertificateResponse = (certificateData, additionalData = {}) => {
  const {
    serialNumber,
    commonName,
    organization,
    validFrom,
    validTo,
    isRevoked,
    userAddress
  } = certificateData;
  
  return {
    success: true,
    hasCertificate: true,
    data: {
      serialNumber,
      commonName,
      organization,
      validFrom: validFrom ? validFrom.toString() : null,
      validTo: validTo ? validTo.toString() : null,
      isRevoked: Boolean(isRevoked),
      userAddress,
      ...additionalData
    }
  };
};

const getUserCertificate = async (req, res) => {
  try {
    console.log('=== getUserCertificate called ===');
    const { address } = req.params;
    
    try {
      // Get certificate info
      const [
        serialNumber,
        commonName,
        organization,
        validFrom,
        validTo,
        isRevoked
      ] = await userCertificateManagerContract.getCertificateInfo(address);
      
      console.log('Certificate data received:', {
        serialNumber,
        commonName,
        organization,
        validFrom: validFrom ? validFrom.toString() : null,
        validTo: validTo ? validTo.toString() : null,
        isRevoked
      });
      
      // If no certificate exists
      if (!serialNumber || serialNumber === '') {
        console.log('No certificate found for address:', address);
        return handleCertificateNotFound(res, address);
      }
      
      // Get additional certificate details
      let certificate, publicKey = '';
      
      try {
        // Get the certificate object for additional fields
        certificate = await userCertificateManagerContract.userCertificates(address);
        
        // Try to get public key from certificate first
        if (certificate && certificate.publicKey) {
          publicKey = certificate.publicKey;
        } else {
          // Fallback to getActivePublicKey if not found in certificate
          try {
            const keyBytes = await userCertificateManagerContract.getActivePublicKey(address);
            // Handle different key formats
            if (keyBytes) {
              if (typeof keyBytes === 'string') {
                publicKey = keyBytes;
              } else if (keyBytes._isBigNumber) {
                publicKey = '0x' + keyBytes.toHexString().substring(2);
              } else if (keyBytes instanceof Uint8Array || Array.isArray(keyBytes)) {
                // Handle Uint8Array or array of numbers
                const hex = Array.from(keyBytes)
                  .map(b => b.toString(16).padStart(2, '0'))
                  .join('');
                publicKey = '0x' + hex;
              } else if (keyBytes.hex) {
                // Handle object with hex property
                publicKey = keyBytes.hex;
              } else if (keyBytes.toString) {
                // Last resort: try to stringify
                publicKey = keyBytes.toString('hex');
              }
            }
          } catch (keyError) {
            console.log('Error getting active public key:', keyError.message);
            // Try alternative method to get public key if available
            try {
              const userDetails = await userCertificateManagerContract.getUserDetails(address);
              if (userDetails && userDetails[2]) {
                // Convert the public key bytes to hex string
                const pubKeyBytes = userDetails[2];
                if (typeof pubKeyBytes === 'string') {
                  publicKey = pubKeyBytes;
                } else {
                  publicKey = '0x' + Buffer.from(pubKeyBytes).toString('hex');
                }
              }
            } catch (e) {
              console.log('Alternative public key fetch failed:', e.message);
            }
          }
        }
        
        // Format and return the complete certificate data
        const response = formatCertificateResponse(
          { serialNumber, commonName, organization, validFrom, validTo, isRevoked, userAddress: address },
          {
            publicKey,
            signatureAlgorithm: (certificate && certificate.signatureAlgorithm) || 'sha256WithRSAEncryption'
          }
        );
        
        console.log('Certificate found for address:', address);
        return res.status(200).json(response);
        
      } catch (detailsError) {
        console.error('Error getting certificate details:', detailsError);
        // If we can't get additional details, still return the basic certificate info
        return res.status(200).json(
          formatCertificateResponse(
            { serialNumber, commonName, organization, validFrom, validTo, isRevoked, userAddress: address },
            { publicKey: '', signatureAlgorithm: 'sha256WithRSAEncryption' }
          )
        );
      }
      
    } catch (error) {
      console.error('Error getting certificate info:', error);
      if (error.message.includes('No certificate found') || 
          error.message.includes('revert') ||
          error.message.includes('invalid opcode')) {
        return handleCertificateNotFound(res, address, error);
      }
      throw error; // Re-throw other errors
    }
    
  } catch (error) {
    console.error(`Error getting certificate for user ${req.params.address}:`, error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving certificate',
      error: error.message
    });
  }
};

/**
 * @desc    Revoke a user's certificate
 * @route   POST /api/certificates/revoke/:address
 * @access  Private/Admin
 */
const revokeCertificate = async (req, res) => {
  try {
    const { address } = req.params;
    const { reason = 'No reason provided' } = req.body;

    // Only admins can revoke certificates
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to revoke certificates'
      });
    }

    // Check if user exists and has a certificate
    const isRegistered = await userCertificateManagerContract.isUserRegistered(address);
    if (!isRegistered) {
      return res.status(404).json({
        success: false,
        message: 'User not found or not registered'
      });
    }

    const [serialNumber] = await userCertificateManagerContract.getCertificateInfo(address);
    if (serialNumber === '') {
      return res.status(400).json({
        success: false,
        message: 'User does not have a certificate to revoke'
      });
    }

    // Call the revoke function in the contract
    const tx = await userCertificateManagerContract.revokeCertificate(reason);
    await tx.wait();

    logAction('certificate_revoked', req.user.address, {
      targetUser: address,
      reason
    });

    res.status(200).json({
      success: true,
      message: 'Certificate revoked successfully',
      data: {
        userAddress: address,
        revokedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error(`Error revoking certificate for user ${req.params.address}:`, error);
    res.status(500).json({
      success: false,
      message: 'Error revoking certificate',
      error: error.message
    });
  }
};

/**
 * @desc    Get user's active public key
 * @route   GET /api/certificates/keys/:address
 * @access  Private
 */
const getUserPublicKeys = async (req, res) => {
  try {
    const { address } = req.params;
    
    // Basic validation
    if (!req.user || !req.user.address) {
      return res.status(400).json({ success: false, message: 'Authentication required' });
    }
    
    // Authorization check
    if (address.toLowerCase() !== req.user.address.toLowerCase() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Get all public keys
    let publicKeys = await userCertificateManagerContract.getUserPublicKeys(address);
    // Defensive: some providers may return an object instead of array, handle both
    if (!Array.isArray(publicKeys) && typeof publicKeys === 'object' && publicKeys.length !== undefined) {
      publicKeys = Array.from(publicKeys);
    }

    // Format the keys for frontend (ensure hex for keyData, readable timestamps)
    const formattedKeys = publicKeys.map((key, idx) => {
      let keyHex;
      if (typeof key.keyData === 'string') {
        // Convert UTF-8 string to hex for consistency
        keyHex = '0x' + Buffer.from(key.keyData, 'utf8').toString('hex');
      } else if (key.keyData instanceof Uint8Array || Array.isArray(key.keyData)) {
        keyHex = '0x' + Buffer.from(key.keyData).toString('hex');
      } else if (Buffer.isBuffer(key.keyData)) {
        keyHex = '0x' + key.keyData.toString('hex');
      } else {
        keyHex = String(key.keyData);
      }
      return {
        keyData: keyHex,
        isActive: key.isActive,
        addedAt: key.addedAt ? new Date(Number(key.addedAt) * 1000).toISOString() : null,
        index: idx
      };
    });

    res.json({
      success: true,
      publicKeys: formattedKeys
    });
    
  } catch (error) {
    console.error('Error getting public keys:', error);
    // Handle common errors
    if (error.message.includes('User not registered')) {
      return res.status(404).json({ success: false, message: 'User not registered' });
    }
    
    if (error.message.includes('No public keys found') || error.message.includes('No active public key')) {
      return res.status(404).json({ success: false, message: 'No active public key' });
    }
    
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @desc    Add a new public key for a user
 * @route   POST /api/certificates/keys
 * @access  Private
 */
const addPublicKey = async (req, res) => {
  try {
    const { keyData } = req.body;
    const userAddress = req.user.address;

    if (!keyData) {
      return res.status(400).json({
        success: false,
        message: 'Public key data is required'
      });
    }

    // Call the addPublicKey function in the contract
    const tx = await userCertificateManagerContract.addPublicKey(keyData, { from: userAddress });
    await tx.wait();

    logAction('public_key_added', userAddress, {
      keyLength: keyData.length
    });

    res.status(201).json({
      success: true,
      message: 'Public key added successfully',
      data: {
        addedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error adding public key:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding public key',
      error: error.message
    });
  }
};

/**
 * @desc    Deactivate a public key
 * @route   DELETE /api/certificates/keys/:keyIndex
 * @access  Private
 */
const deactivatePublicKey = async (req, res) => {
  try {
    const { keyIndex } = req.params;
    const userAddress = req.user.address;

    // Call the deactivatePublicKey function in the contract
    const tx = await userCertificateManagerContract.deactivatePublicKey(parseInt(keyIndex), { from: userAddress });
    await tx.wait();

    logAction('public_key_deactivated', userAddress, {
      keyIndex: parseInt(keyIndex)
    });

    res.status(200).json({
      success: true,
      message: 'Public key deactivated successfully'
    });
  } catch (error) {
    console.error('Error deactivating public key:', error);
    res.status(500).json({
      success: false,
      message: 'Error deactivating public key',
      error: error.message
    });
  }
};

/**
 * @desc    Create a new certificate for a user
 * @route   POST /api/certificates/:address/create
 * @access  Private
 */
const createCertificate = async (req, res) => {
  console.log('=== createCertificate called ===');
  console.log('Params:', req.params);
  console.log('User:', req.user);
  
  try {
    const { address } = req.params;
    const {
      serialNumber,
      country,
      state,
      locality,
      organization,
      commonName,
      publicKey,
      signatureAlgorithm = 'sha256WithRSAEncryption',
      validDays = 365 // Default to 1 year if not specified
    } = req.body;
    
    console.log('Using wallet address for transaction:', wallet.address);

    // Log the incoming request details
    console.log('Request body:', {
      serialNumber,
      country,
      state,
      locality,
      organization,
      commonName,
      publicKey: publicKey ? `${publicKey.substring(0, 20)}...` : 'none',
      signatureAlgorithm,
      validDays
    });

    // Validate required fields
    const requiredFields = {
      serialNumber,
      country,
      state,
      locality,
      organization,
      commonName,
      publicKey,
      validDays
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([_, value]) => !value)
      .map(([key]) => key);

    if (missingFields.length > 0) {
      console.error('Missing required fields:', missingFields);
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        missingFields
      });
    }

    // Ensure we have a user object with address
    if (!req.user || !req.user.address) {
      console.error('No user information available in request');
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
    }

    // Validate required fields
    if (!serialNumber || !country || !state || !locality || !organization || !commonName || !publicKey || !validDays) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Check if user exists and is registered
    const isRegistered = await userCertificateManagerContract.isUserRegistered(address);
    if (!isRegistered) {
      return res.status(400).json({
        success: false,
        message: 'User is not registered'
      });
    }

    // Check if certificate already exists
    const [existingSerial] = await userCertificateManagerContract.getCertificateInfo(address);
    if (existingSerial !== '') {
      return res.status(400).json({
        success: false,
        message: 'Certificate already exists for this user'
      });
    }

    console.log('Sending transaction to issue certificate...');
    
    try {
      // Always use the admin wallet and issueCertificateFor
      const tx = await userCertificateManagerContract.issueCertificateFor(
        address, // Target user address
        serialNumber,
        country,
        state,
        locality,
        organization,
        commonName,
        publicKey,
        signatureAlgorithm,
        validDays,
        { 
          gasLimit: 1000000, // Adjust gas limit as needed
          gasPrice: ethers.utils.parseUnits('10', 'gwei') // Adjust gas price as needed
        }
      );
      
      console.log('Transaction hash:', tx.hash);
      console.log('Waiting for transaction to be mined...');
      
      // Wait for the transaction to be mined
      const receipt = await tx.wait();
      console.log('Transaction mined in block:', receipt.blockNumber);
      
      // Get the transaction details
      const txDetails = await provider.getTransactionReceipt(tx.hash);
      console.log('Transaction details:', {
        blockHash: txDetails.blockHash,
        blockNumber: txDetails.blockNumber,
        gasUsed: txDetails.gasUsed.toString(),
        status: txDetails.status === 1 ? 'Success' : 'Failed'
      });
    } catch (txError) {
      console.error('Transaction error:', txError);
      if (txError.reason) {
        console.error('Transaction reverted with reason:', txError.reason);
      }
      if (txError.transaction) {
        console.error('Transaction that caused the error:', txError.transaction);
      }
      throw txError;
    }

    // Get the created certificate
    const [
      certSerialNumber,
      certCommonName,
      certOrganization,
      certValidFrom,
      certValidTo,
      certIsRevoked
    ] = await userCertificateManagerContract.getCertificateInfo(address);

    const certificate = {
      serialNumber: certSerialNumber,
      commonName: certCommonName,
      organization: certOrganization,
      validFrom: new Date(Number(certValidFrom) * 1000).toISOString(),
      validTo: new Date(Number(certValidTo) * 1000).toISOString(),
      isRevoked: certIsRevoked,
      publicKey: publicKey,
      userAddress: address
    };

    logAuthAttempt({
      type: 'certificate_created',
      address: req.user.address,
      status: 'success',
      ip: req.ip,
      metadata: {
        targetUser: address,
        serialNumber: certificate.serialNumber
      }
    });

    res.status(201).json({
      success: true,
      message: 'Certificate created successfully',
      certificate
    });
  } catch (error) {
    console.error('Error creating certificate:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating certificate',
      error: error.message
    });
  }
};

module.exports = {
  getUserCertificate,
  revokeCertificate,
  getUserPublicKeys,
  addPublicKey,
  deactivatePublicKey,
  createCertificate
};
