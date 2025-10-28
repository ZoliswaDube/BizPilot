const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;

// Basic middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'BizPilot Backend is running!' 
  });
});

// Basic API routes
app.get('/api/v1/status', (req, res) => {
  res.json({ 
    message: 'BizPilot API is working!',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Auth routes placeholder
app.post('/api/v1/auth/login', (req, res) => {
  res.json({ 
    message: 'Login endpoint - Coming soon',
    received: req.body 
  });
});

app.post('/api/v1/auth/register', (req, res) => {
  res.json({ 
    message: 'Register endpoint - Coming soon',
    received: req.body 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`🚀 BizPilot API Server running on http://localhost:${PORT}`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
  console.log(`📊 API Status: http://localhost:${PORT}/api/v1/status`);
});



