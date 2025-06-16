const { logAuthAttempt } = require('../utils/logger');

const ADMIN_ADDRESS = '0x77c7710051E3e9E135a98525fF496F9cfEc45fc6';

const isAdmin = (req, res, next) => {
  try {
    const userAddress = req.user?.address?.toLowerCase();
    
    if (userAddress === ADMIN_ADDRESS.toLowerCase()) {
      return next();
    }
    
    logAuthAttempt({
      type: 'admin_access',
      address: userAddress,
      status: 'failure',
      ip: req.ip,
      metadata: { reason: 'unauthorized_admin_access' }
    });
    
    return res.status(403).json({ success: false, error: 'Unauthorized: Admin access required' });
  } catch (error) {
    console.error('Admin middleware error:', error);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

module.exports = isAdmin;
