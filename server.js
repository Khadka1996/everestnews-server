const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const multer = require('multer');
require('dotenv').config();
const prerender = require('prerender-node');
const scheduleTask = require('./controllers/scheduleTask');

const app = express(); // Initialize the app
const PORT = process.env.PORT || 5000;

// Set up prerender
app.use(prerender.set('prerenderToken', process.env.PRERENDER_TOKEN));

// Set view engine and views directory
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const destinationPath = path.join(__dirname, '..', 'uploads', 'articles');
    cb(null, destinationPath);
  },
  filename: (req, file, cb) => {
    const fileName = `article-english-file-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, fileName);
  },
});

const upload = multer({ storage: storage });

app.use(express.json());
app.use(cors());

// Connect to MongoDB
const MONGO_URI = process.env.MONGO_URI;
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
const connection = mongoose.connection;

// Handle MongoDB connection events
connection.on('error', (error) => {
  console.error('MongoDB connection error:', error);
});

connection.once('open', () => {
  console.log('MongoDB connection established successfully');
  scheduleTask(); // Start scheduled tasks
});

// Handle process termination signals
const handleTermination = () => {
  connection.close(() => {
    console.log('MongoDB connection disconnected through app termination');
    process.exit(0);
  });
};

process.on('SIGINT', handleTermination);
process.on('SIGTERM', handleTermination);

// Serve static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Define API routes
const categoryRouter = require('./routes/category');
app.use('/api/categories', categoryRouter);

const tagRouter = require('./routes/tag');
app.use('/api/tags', tagRouter);

const photoRoutes = require('./routes/photo');
app.use('/api/photos', photoRoutes);

const videoRouter = require('./routes/video');
app.use('/api/videos', videoRouter);

const authorRouter = require('./routes/author');
app.use('/api/authors', authorRouter);

const articleRouter = require('./routes/article');
app.use('/api/articles', articleRouter);

const advertisementRoutes = require('./routes/advertisement');
app.use('/api/advertisements', advertisementRoutes);

const englishRoutes = require('./routes/english');
app.use('/api/english', englishRoutes);

const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

const galleryRoutes = require('./routes/gallery');
app.use('/api/gallery', galleryRoutes);

// Error handling middleware (optional but recommended)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal Server Error' });
});

// Start the server
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Set server timeout to handle longer operations
server.timeout = 120000;



