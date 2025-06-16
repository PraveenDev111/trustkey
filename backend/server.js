require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const testRoutes = require('./routes/test');

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
app.use('/api/test', testRoutes);

// Debug route to test if server is responding
app.get('/api/ping', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'TrustKey API is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
