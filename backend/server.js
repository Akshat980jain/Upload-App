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
const chatbotRoutes = require('./routes/chatbotRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Create uploads and videos directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
const videosDir = path.join(__dirname, 'videos');
const documentsDir = path.join(__dirname, 'documents');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir,{recursive:true});
if (!fs.existsSync(videosDir)) fs.mkdirSync(videosDir,{recursive:true});
if (!fs.existsSync(documentsDir)) fs.mkdirSync(documentsDir,{recursive:true});

// Middleware
const allowedOrigins = [
  'http://localhost:3000',
  'https://gallaryhub.onrender.com' // Add your production frontend URL here if different
];
app.use(cors({
  origin: function(origin, callback) {
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
app.use('/api/chatbot', chatbotRoutes);

// Serve static assets (uploaded images, videos, and documents) from backend directories
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/videos', express.static(path.join(__dirname, 'videos')));
app.use('/documents', express.static(path.join(__dirname, 'documents')));

// Keep-alive endpoint to prevent Render from sleeping
app.get('/api/ping', (req, res) => {
  res.json({ status: 'ok', message: 'pong' });
});

// MongoDB Connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.log('Server will start but database features will not work until MongoDB is connected.');
    // Don't exit the process, let the server start without DB
  }
};

connectDB();

// Serve React app in production
if (process.env.NODE_ENV === 'production') {
  // Set the static folder
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
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}, accessible on your local network.`);
}); 