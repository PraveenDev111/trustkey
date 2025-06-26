const { ethers } = require('ethers');
const { userCertificateManagerContract } = require('../utils/web3');
const { logAction } = require('../utils/logger');

/**
 * @desc    Get certificate for a user
 * @route   GET /api/certificates/:address
 * @access  Private (Owner or Admin)
 */
const getUserCertificate = async (req, res) => {
  try {
    const { address } = req.params;
    
    // Only allow users to view their own certificate unless admin
    if (address.toLowerCase() !== req.user.address.toLowerCase() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this certificate'
      });
    }

    // Check if user is registered
    const isRegistered = await userCertificateManagerContract.isUserRegistered(address);
    if (!isRegistered) {
      return res.status(404).json({
        success: false,
        message: 'User not found or not registered'
      });
    }

    // Get certificate info from the contract
    const [
      serialNumber,
      commonName,
      organization,
      validFrom,
      validTo,
      isRevoked
    ] = await userCertificateManagerContract.getCertificateInfo(address);

    // If no certificate exists
    if (serialNumber === '') {
      return res.status(200).json({
        success: true,
        hasCertificate: false
      });
    }

    // Get active public key
    const activePublicKey = await userCertificateManagerContract.getActivePublicKey(address);

    const certificate = {
      serialNumber,
      commonName,
      organization,
      validFrom: new Date(Number(validFrom) * 1000).toISOString(),
      validTo: new Date(Number(validTo) * 1000).toISOString(),
      isRevoked,
      publicKey: activePublicKey,
      userAddress: address
    };

    logAction('get_user_certificate', req.user.address, { targetUser: address });
    
    res.status(200).json({
      success: true,
      hasCertificate: true,
      data: certificate
    });
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
 * @desc    Get user's public keys
 * @route   GET /api/certificates/keys/:address
 * @access  Private
 */
const getUserPublicKeys = async (req, res) => {
  try {
    const { address } = req.params;
    
    // Only allow users to view their own keys unless admin
    if (address.toLowerCase() !== req.user.address.toLowerCase() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view these keys'
      });
    }

    // Check if user is registered
    const isRegistered = await userCertificateManagerContract.isUserRegistered(address);
    if (!isRegistered) {
      return res.status(404).json({
        success: false,
        message: 'User not found or not registered'
      });
    }

    // Get all public keys for the user
    const publicKeys = await userCertificateManagerContract.getUserPublicKeys(address);
    
    // Get the active key index
    const activeKeyIndex = await userCertificateManagerContract.activeKeyIndex(address);

    const formattedKeys = publicKeys.map((key, index) => ({
      index,
      keyData: key.keyData,
      isActive: key.isActive,
      addedAt: new Date(Number(key.addedAt) * 1000).toISOString(),
      isCurrentActive: index === activeKeyIndex
    }));

    logAction('get_user_public_keys', req.user.address, { 
      targetUser: address,
      keyCount: formattedKeys.length 
    });
    
    res.status(200).json({
      success: true,
      data: formattedKeys
    });
  } catch (error) {
    console.error(`Error getting public keys for user ${req.params.address}:`, error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving public keys',
      error: error.message
    });
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
      signatureAlgorithm,
      validDays
    } = req.body;

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

    // Call the issueCertificate function in the contract
    const tx = await userCertificateManagerContract.issueCertificate(
      serialNumber,
      country,
      state,
      locality,
      organization,
      commonName,
      publicKey,
      signatureAlgorithm || 'sha256WithRSAEncryption',
      validDays,
      { from: req.user.address }
    );
    
    await tx.wait();

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

    logAction('certificate_created', req.user.address, {
      targetUser: address,
      serialNumber: certificate.serialNumber
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
