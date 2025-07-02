require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const certificateRoutes = require('./routes/certificateRoutes');
const registrationLogsRoutes = require('./routes/registrationLogs');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', certificateRoutes);
app.use('/api', registrationLogsRoutes);

// Debug route to test if server is responding
app.get('/api/ping', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

app.get('/api/test', (req, res) => {
  console.log('Test route hit');
  res.json({ status: 'test route working 2' });
});

// Debug route to test user context
app.get('/api/debug-context', (req, res) => {
  console.log('=== Debug Route (server.js) ===');
  console.log('Request URL:', req.originalUrl);
  console.log('Request method:', req.method);
  console.log('Request headers:', req.headers);
  console.log('Request user:', req.user || 'No user object');
  console.log('Request auth header:', req.headers.authorization || 'No auth header');
  
  res.json({
    success: true,
    message: 'Debug information from server.js',
    user: req.user || 'No user object',
    headers: req.headers,
    originalUrl: req.originalUrl,
    baseUrl: req.baseUrl,
    path: req.path
  });
});

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'TrustKey API is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
