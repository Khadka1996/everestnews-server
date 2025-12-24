const multer = require('multer');
const path = require('path');

// Set up storage for multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Specify the destination directory for uploaded files
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const fileExtension = path.extname(file.originalname);
    cb(null, 'file-' + uniqueSuffix + fileExtension); // Specify the filename for uploaded files
  },
});

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5, // Set a file size limit (here, 5 MB)
  },
  fileFilter: (req, file, cb) => {
    // Check file type (you can customize this based on your needs)
    const allowedFileTypes = /jpeg|jpg|png|gif|mp4|mov|avi/;
    const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedFileTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and videos are allowed.'));
    }
  },
});

module.exports = upload.single('file'); // Specify the field name for the file in the form