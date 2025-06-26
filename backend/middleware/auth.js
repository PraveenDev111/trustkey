const jwt = require('jsonwebtoken');

// Middleware to verify JWT token and attach user to request
const authMiddleware = (req, res, next) => {
  // Get token from header, which is expected to be in the format "Bearer <token>"
  const authHeader = req.header('Authorization');

  // Check if auth header exists
  if (!authHeader) {
    return res.status(401).json({ error: 'No token, authorization denied' });
  }

  const tokenParts = authHeader.split(' ');

  if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
    return res.status(401).json({ error: 'Token format is invalid, must be "Bearer <token>"' });
  }

  const token = tokenParts[1];

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Add user from payload to the request object
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token is not valid' });
  }
};

// Middleware to check if user has required role
const authorizeRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (typeof roles === 'string') {
      roles = [roles];
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    next();
  };
};

module.exports = {
  authMiddleware,
  authorizeRole
};
