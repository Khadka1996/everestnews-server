const multer = require('multer');
const path = require('path');

// Define storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const destinationPath = path.join(__dirname, '..', 'uploads', 'english');
    cb(null, destinationPath);
  },
  filename: (req, file, cb) => {
    // Use the original name of the file while ensuring it's safe for the filesystem
    const fileName = `${path.parse(file.originalname).name}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, fileName);
  },
});

// Setup multer without a file filter (since you don’t want any)
const upload = multer({
  storage: storage,
});

// Custom error handling middleware (as previously discussed)
const handleUploadErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    res.status(400).json({ error: `Multer error: ${err.message}` });
  } else if (err) {
    res.status(500).json({ error: `Upload error: ${err.message}` });
  } else {
    next();
  }
};

module.exports = {
  upload, // Ensure upload is exported here
  handleUploadErrors,
};
