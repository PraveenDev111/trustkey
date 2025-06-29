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

// Debug route - no auth middleware
router.get('/certificates/debug/:address', async (req, res) => {
  console.log('Debug route hit with address:', req.params.address);
  res.json({
    success: true,
    message: 'Debug route working',
    address: req.params.address,
    timestamp: new Date().toISOString()
  });
});

// Public route to check if server is responding
router.get('/certificates/status', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Main certificate route - temporarily simplified
router.get('/certificates/:address', async (req, res, next) => {
  // Manually set a mock user for testing
  req.user = {
    address: req.params.address.toLowerCase(),
    role: 'user'  // Default role
  };
  next();
}, getUserCertificate);

// Simplified routes for testing
router.post('/certificates/:address/create', async (req, res, next) => {
  // Manually set a mock user for testing
  req.user = {
    address: req.params.address.toLowerCase(),
    role: 'user'  // Default role
  };
  next();
}, createCertificate);
router.post('/certificates/revoke/:address', revokeCertificate);
router.get('/certificates/keys/:address', async (req, res, next) => {
  // Manually set a mock user for testing
  req.user = {
    address: req.params.address.toLowerCase(),
    role: 'user'  // Default role
  };
  next();
}, getUserPublicKeys);
router.post('/certificates/keys', async (req, res, next) => {
  // For adding keys, we expect the address in the request body
  const address = req.body.address || '';
  req.user = {
    address: address.toLowerCase(),
    role: 'user'  // Default role
  };
  next();
}, addPublicKey);

router.delete('/certificates/keys/:keyIndex', async (req, res, next) => {
  // For deactivating keys, we need to get the address from the request body or query
  const address = req.body.address || req.query.address || '';
  req.user = {
    address: address.toLowerCase(),
    role: 'user'  // Default role
  };
  next();
}, deactivatePublicKey);

module.exports = router;
