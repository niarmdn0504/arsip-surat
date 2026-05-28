require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const pengaturanRoutes = require('./routes/pengaturan');
app.use('/api/pengaturan', pengaturanRoutes);

// === SECURITY HEADERS (helmet) ===
app.use(helmet({
  contentSecurityPolicy: false, // disable agar PDF preview bisa jalan
  crossOriginEmbedderPolicy: false
}));

// === RATE LIMITING - cegah brute force ===
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 10, // max 10x login gagal per 15 menit
  message: { error: 'Terlalu banyak percobaan login. Coba lagi 15 menit lagi.' },
  standardHeaders: true,
  legacyHeaders: false
});

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 menit
  max: 100, // max 100 request per menit per IP
  message: { error: 'Terlalu banyak request. Coba lagi sebentar.' }
});

// === CORS ===
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map(o => o.trim())
  : ['http://localhost:3000', 'http://localhost:5500', 'http://127.0.0.1:5500'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('CORS: Origin tidak diizinkan'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// === BODY PARSER ===
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// === ROUTES ===
app.use('/api/auth', loginLimiter, require('./routes/auth'));
app.use('/api/surat', apiLimiter, require('./routes/surat'));
app.use('/api/upload', apiLimiter, require('./routes/upload'));
app.use('/api/users', apiLimiter, require('./routes/users'));
app.use('/api/notifikasi', apiLimiter, require('./routes/notifikasi'));
app.use('/api/laporan', apiLimiter, require('./routes/laporan'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server Arsip Surat aktif', time: new Date() });
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/login.html'));
});

// Error handler global
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Terjadi kesalahan server.'
      : err.message
  });
});

app.listen(PORT, () => {
  console.log(`\n🏫 Arsip Surat Sekolah - http://localhost:${PORT}`);
  console.log(`   Mode: ${process.env.NODE_ENV || 'development'}\n`);
});

module.exports = app;
