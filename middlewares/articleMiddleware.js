const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Define the destination path for article uploads
    const destinationPath = path.join(__dirname, '..', 'uploads', 'articles');
    cb(null, destinationPath);
  },
  filename: (req, file, cb) => {
    // Combine original name with a timestamp for uniqueness
    const timestamp = Date.now();
    const originalName = path.parse(file.originalname).name; 
    const extension = path.extname(file.originalname); 
    const uniqueFileName = `${originalName}-${timestamp}${extension}`;
    cb(null, uniqueFileName);
  },
});


// Define a function to allow all file types
const fileFilter = (req, file, cb) => {
  // Accept all file types
  cb(null, true);
};

// Initialize multer with storage and no file type restrictions
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
});

module.exports = {
  upload: upload,
};
