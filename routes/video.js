
const express = require('express');
const videoController = require('../controllers/videoController');
const uploadMiddleware = require('../middlewares/videoMiddleware');

const router = express.Router();

// Create a new video
router.post('/create', uploadMiddleware, videoController.createVideo);

// Get all videos
router.get('/', videoController.getAllVideos);

// Get a video by ID
router.get('/:id', videoController.getVideoById);

// Update a video by ID
router.put('/:id', uploadMiddleware, videoController.updateVideo);

// Delete a video by ID
router.delete('/:id', videoController.deleteVideo);

module.exports = router;