const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Test route to check logs directory
router.get('/logs-dir', (req, res) => {
  const logsDir = path.join(process.cwd(), 'logs');
  const logsDirExists = fs.existsSync(logsDir);
  const permissions = {
    read: false,
    write: false
  };

  try {
    // Try to read the directory
    if (logsDirExists) {
      fs.readdirSync(logsDir);
      permissions.read = true;
      
      // Try to write a test file
      const testFile = path.join(logsDir, 'test-permission.txt');
      fs.writeFileSync(testFile, 'test');
      permissions.write = true;
      
      // Clean up test file
      fs.unlinkSync(testFile);
    }
  } catch (err) {
    console.error('Error checking logs directory:', err);
  }

  res.json({
    logsDir,
    exists: logsDirExists,
    permissions,
    cwd: process.cwd(),
    __dirname: __dirname
  });
});

module.exports = router;
