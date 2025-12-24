const express = require('express');
const router = express.Router();
const photoController = require('../controllers/photoController');
const uploadPhotos = require('../middlewares/photoMiddleware'); // Make sure this is the right path

// Create a new photo (with multiple images)
router.post('/create', uploadPhotos, photoController.createPhoto);

// Get all photos
router.get('/', photoController.getAllPhotos);

// Get a single photo by ID
router.get('/:id', photoController.getPhotoById);

// Update a photo (with optional new images)
router.put('/:id', uploadPhotos, photoController.updatePhoto);

// Delete a photo by ID
router.delete('/:id', photoController.deletePhoto);

module.exports = router;
