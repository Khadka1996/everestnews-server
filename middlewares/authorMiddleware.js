// middlewares/authorMiddleware.js
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/authors');
  },
  filename: (req, file, cb) => {
    const fileName = `author-photo-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, fileName);
  },
});

const upload = multer({ storage });

module.exports = { upload };