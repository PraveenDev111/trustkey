require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const logsRoutes = require('./routes/logs');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/logs', logsRoutes);

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'TrustKey API is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
