const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
require('dotenv').config();

const userRoutes = require('./routes/userRoutes');
const imageRoutes = require('./routes/imageRoutes');
const videoRoutes = require('./routes/videoRoutes');
const documentRoutes = require('./routes/documentRoutes');
const folderRoutes = require('./routes/folderRoutes');
const chatbotRoutes = require('./routes/chatbotRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Create uploads and videos directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
const videosDir = path.join(__dirname, 'videos');
const documentsDir = path.join(__dirname, 'documents');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(videosDir)) fs.mkdirSync(videosDir, { recursive: true });
if (!fs.existsSync(documentsDir)) fs.mkdirSync(documentsDir, { recursive: true });

// Middleware
const allowedOrigins = [
  'http://localhost:3000',
  'https://gallaryhub.onrender.com',
  'https://upload-app-lopz.onrender.com' // Added deployed frontend
];
app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test route to verify server is working
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend server is running correctly!' });
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/chatbot', chatbotRoutes);

// Serve static assets (uploaded images, videos, and documents) from backend directories
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/videos', express.static(path.join(__dirname, 'videos')));
app.use('/documents', express.static(path.join(__dirname, 'documents')));

// Keep-alive endpoint to prevent Render from sleeping
app.get('/api/ping', (req, res) => {
  res.json({ status: 'ok', message: 'pong' });
});

// ─── Pretty Logger ─────────────────────────────────────────
const log = {
  _c: (code, text) => `\x1b[${code}m${text}\x1b[0m`,
  info: (msg) => console.log(`  ${log._c('36', '●')} ${msg}`),
  success: (msg) => console.log(`  ${log._c('32', '✔')} ${log._c('32', msg)}`),
  warn: (msg) => console.log(`  ${log._c('33', '⚠')} ${log._c('33', msg)}`),
  error: (msg) => console.log(`  ${log._c('31', '✖')} ${log._c('31', msg)}`),
  dim: (msg) => console.log(`    ${log._c('90', msg)}`),
  banner: (port, env) => {
    const line = '─'.repeat(46);
    console.log('');
    console.log(`  ${log._c('36', line)}`);
    console.log(`  ${log._c('1;36', '  📦  GalleryHub API Server')}`);
    console.log(`  ${log._c('36', line)}`);
    console.log('');
    console.log(`  ${log._c('90', 'Status')}   ${log._c('32', '● Running')}`);
    console.log(`  ${log._c('90', 'Port')}     ${log._c('1;37', port)}`);
    console.log(`  ${log._c('90', 'Mode')}     ${log._c(env === 'production' ? '33' : '36', env)}`);
    console.log(`  ${log._c('90', 'Local')}    ${log._c('4;36', `http://localhost:${port}`)}`);
    console.log('');
    console.log(`  ${log._c('36', line)}`);
    console.log('');
  },
};

// MongoDB Connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    log.success('MongoDB connected');
  } catch (error) {
    log.error(`MongoDB connection failed: ${error.message}`);
    log.warn('Server will start without database features.');
  }
};

// Serve React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend-new/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend-new', 'build', 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send('API is running...');
  });
}

app.listen(PORT, '0.0.0.0', () => {
  log.banner(PORT, process.env.NODE_ENV || 'development');
  connectDB();
}); 