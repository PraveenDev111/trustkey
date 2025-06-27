const { body, param } = require('express-validator');
const { validationResult } = require('express-validator');

/**
 * Middleware to validate Ethereum address parameter
 */
const validateAddressParam = [
  param('address')
    .isEthereumAddress()
    .withMessage('Invalid Ethereum address')
    .toLowerCase()
    .customSanitizer(value => value.toLowerCase())
];

/**
 * Middleware to validate key index parameter
 */
const validateKeyIndexParam = [
  param('keyIndex')
    .isInt({ min: 0 })
    .withMessage('Key index must be a non-negative integer')
    .toInt()
];

/**
 * Middleware to validate create certificate request body
 */
const validateCreateCertificate = [
  body('serialNumber')
    .isString()
    .notEmpty()
    .withMessage('Serial number is required'),
  body('country')
    .isString()
    .notEmpty()
    .withMessage('Country is required'),
  body('state')
    .isString()
    .notEmpty()
    .withMessage('State is required'),
  body('locality')
    .isString()
    .notEmpty()
    .withMessage('Locality is required'),
  body('organization')
    .isString()
    .notEmpty()
    .withMessage('Organization is required'),
  body('commonName')
    .isString()
    .notEmpty()
    .withMessage('Common name is required'),
  body('publicKey')
    .isString()
    .notEmpty()
    .withMessage('Public key is required'),
  body('signatureAlgorithm')
    .optional()
    .isString()
    .withMessage('Signature algorithm must be a string'),
  body('validDays')
    .isInt({ min: 1 })
    .withMessage('Valid days must be a positive integer')
    .toInt()
];

/**
 * Middleware to validate add public key request
 */
const validateAddPublicKey = [
  body('keyData')
    .isString()
    .notEmpty()
    .withMessage('Public key data is required')
];

/**
 * Middleware to authorize certificate access (owner or admin)
 */
const authorizeCertificateAccess = (req, res, next) => {
  console.log('authorizeCertificateAccess - Start');
  console.log('Request params:', req.params);
  console.log('User from token:', req.user);
  
  const { address } = req.params;
  
  if (!address) {
    console.error('No address in params');
    return res.status(400).json({
      success: false,
      message: 'Address parameter is required'
    });
  }
  
  if (!req.user || !req.user.address) {
    console.error('No user in request');
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }
  
  const isOwner = address.toLowerCase() === req.user.address.toLowerCase();
  const isAdmin = req.user.role === 'admin';
  
  console.log(`Access check - isOwner: ${isOwner}, isAdmin: ${isAdmin}`);
  
  if (!isOwner && !isAdmin) {
    console.log('Access denied - not owner or admin');
    return res.status(403).json({
      success: false,
      message: 'Not authorized to access this resource',
      details: {
        requestedAddress: address,
        userAddress: req.user.address,
        userRole: req.user.role || 'user'
      }
    });
  }
  
  console.log('Access granted');
  next();
};

/**
 * Middleware to handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

module.exports = {
  validateAddressParam,
  validateKeyIndexParam,
  validateCreateCertificate,
  validateAddPublicKey,
  authorizeCertificateAccess,
  handleValidationErrors
};
