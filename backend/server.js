const express = require('express');
const cors = require('cors');
require('dotenv').config();

const vendorRoutes = require('./routes/vendors');
const reviewRoutes = require('./routes/reviews');
const productRoutes = require('./routes/products');
const { router: authRoutes } = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/vendors', vendorRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    database: 'Supabase PostgreSQL',
    nodeVersion: process.version
  });
});

// Root route
app.get('/api', (req, res) => {
  res.json({ 
    message: 'VendaLink API',
    version: '1.0.0'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Only listen if not in Vercel serverless environment
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 VendaLink API running on http://localhost:${PORT}`);
    console.log(`📊 Database: Supabase PostgreSQL`);
  });
}

// Export for Vercel
module.exports = app;