const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const connectDB = require('./config/db');

// Connect to MongoDB
connectDB();

const app = express();

/* ══════════════════════════════════════
   MIDDLEWARE
══════════════════════════════════════ */
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    process.env.FRONTEND_URL, // add your deployed frontend URL in Render env vars
  ].filter(Boolean),
  credentials: true,
}));
app.use(express.json({ limit: '10kb' }));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

/* ══════════════════════════════════════
   RATE LIMITING (DISABLED FOR DEVELOPMENT)
   ═════════════════════════════════════ */
// Temporarily disabled for development
// const globalLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max:      100,
//   message:  { error: 'Too many requests. Please try again later.' },
// });

// const authLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max:      10,
//   message:  { error: 'Too many auth attempts. Please wait 15 minutes.' },
// });

// app.use('/api/',      globalLimiter);
// app.use('/api/auth/', authLimiter);

/* ══════════════════════════════════════
   ROUTES
══════════════════════════════════════ */
app.use('/api/auth', require('./routes/auth'));
app.use('/api/vault', require('./routes/vault'));

/* ── Root ── */
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Lockify API is live 🔒' });
});

/* ── Health Check ── */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

/* ── 404 handler ── */
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

/* ── Global error handler ── */
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error.',
  });
});

/* ══════════════════════════════════════
   START SERVER
══════════════════════════════════════ */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🔒 Lockify API running → http://localhost:${PORT}`);
});

module.exports = app;
