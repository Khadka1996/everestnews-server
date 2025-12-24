const Video = require('../models/videoModels');

// Create a new video
const createVideo = async (req, res) => {
  try {
    const { title, videoType, youtubeLink } = req.body;

    if (videoType === 'local') {
      // Handle local file upload
      const videoFile = req.file;
      // You need to implement the logic to save the file and get its path or identifier
      // For simplicity, let's assume you save the file to the 'uploads/' directory
      const videoFilePath = `uploads/${videoFile.filename}`;

      const newVideo = new Video({ title, videoType, videoFile: videoFilePath });
      await newVideo.save();

      res.status(201).json({ message: 'Video created successfully', video: newVideo });
    } else if (videoType === 'youtube') {
      // Handle YouTube link
      const newVideo = new Video({ title, videoType, youtubeLink });
      await newVideo.save();

      res.status(201).json({ message: 'Video created successfully', video: newVideo });
    } else {
      res.status(400).json({ message: 'Invalid videoType' });
    }
  } catch (error) {
    console.error('Error creating video:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get all videos
const getAllVideos = async (req, res) => {
  try {
    const videos = await Video.find();
    res.status(200).json({ videos });
  } catch (error) {
    console.error('Error getting all videos:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get a video by ID
const getVideoById = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }
    res.status(200).json({ video });
  } catch (error) {
    console.error('Error getting video by ID:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update a video by ID
const updateVideo = async (req, res) => {
  try {
    const { title, videoType, youtubeLink } = req.body;

    if (videoType === 'local') {
      // Handle local file upload
      const videoFile = req.file;
      // You need to implement the logic to save the file and get its path or identifier
      // For simplicity, let's assume you save the file to the 'uploads/' directory
      const videoFilePath = `uploads/${videoFile.filename}`;

      const updatedVideo = await Video.findByIdAndUpdate(
        req.params.id,
        { title, videoType, videoFile: videoFilePath },
        { new: true }
      );

      if (!updatedVideo) {
        return res.status(404).json({ message: 'Video not found' });
      }

      res.status(200).json({ message: 'Video updated successfully', video: updatedVideo });
    } else if (videoType === 'youtube') {
      // Handle YouTube link
      const updatedVideo = await Video.findByIdAndUpdate(
        req.params.id,
        { title, videoType, youtubeLink },
        { new: true }
      );

      if (!updatedVideo) {
        return res.status(404).json({ message: 'Video not found' });
      }

      res.status(200).json({ message: 'Video updated successfully', video: updatedVideo });
    } else {
      res.status(400).json({ message: 'Invalid videoType' });
    }
  } catch (error) {
    console.error('Error updating video:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete a video by ID
const deleteVideo = async (req, res) => {
  try {
    const deletedVideo = await Video.findByIdAndDelete(req.params.id);
    if (!deletedVideo) {
      return res.status(404).json({ message: 'Video not found' });
    }
    res.status(200).json({ message: 'Video deleted successfully', video: deletedVideo });
  } catch (error) {
    console.error('Error deleting video:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  createVideo,
  getAllVideos,
  getVideoById,
  updateVideo,
  deleteVideo,
};