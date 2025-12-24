const express = require('express');
const { getGalleryPhotos } = require('../controllers/galleryController');
const router = express.Router();

// Route to get gallery photos
router.get('/', getGalleryPhotos);

module.exports = router;
