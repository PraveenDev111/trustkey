const express = require('express');
const router = express.Router();
const { 
  getUserCertificate,
  revokeCertificate,
  getUserPublicKeys,
  addPublicKey,
  deactivatePublicKey,
  createCertificate
} = require('../controllers/certificateController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const {
  validateAddressParam,
  validateKeyIndexParam,
  validateCreateCertificate,
  validateAddPublicKey,
  authorizeCertificateAccess,
  handleValidationErrors
} = require('../middleware/certificateMiddleware');

// Apply authentication middleware to all routes
router.use(authenticateToken);

/**
 * @route   GET /api/certificates/:address
 * @desc    Get certificate for a user
 * @access  Private (Owner or Admin)
 */
router.get(
  '/:address',
  validateAddressParam,
  authorizeCertificateAccess,
  getUserCertificate
);

/**
 * @route   POST /api/certificates/:address/create
 * @desc    Create a new certificate for a user
 * @access  Private (Owner or Admin)
 */
router.post(
  '/:address/create',
  validateAddressParam,
  validateCreateCertificate,
  authorizeCertificateAccess,
  handleValidationErrors,
  createCertificate
);

/**
 * @route   POST /api/certificates/revoke/:address
 * @desc    Revoke a user's certificate
 * @access  Private (Admin only)
 */
router.post(
  '/revoke/:address',
  validateAddressParam,
  authorizeRole('admin'),
  handleValidationErrors,
  revokeCertificate
);

/**
 * @route   GET /api/certificates/keys/:address
 * @desc    Get user's public keys
 * @access  Private (Owner or Admin)
 */
router.get(
  '/keys/:address',
  validateAddressParam,
  authorizeCertificateAccess,
  handleValidationErrors,
  getUserPublicKeys
);

/**
 * @route   POST /api/certificates/keys
 * @desc    Add a new public key for the current user
 * @access  Private
 */
router.post(
  '/keys',
  validateAddPublicKey,
  handleValidationErrors,
  addPublicKey
);

/**
 * @route   DELETE /api/certificates/keys/:keyIndex
 * @desc    Deactivate a public key
 * @access  Private
 */
router.delete(
  '/keys/:keyIndex',
  validateKeyIndexParam,
  handleValidationErrors,
  deactivatePublicKey
);

module.exports = router;
