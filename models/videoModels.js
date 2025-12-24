const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  videoType: {
    type: String,
    enum: ['local', 'youtube'], // 'local' for locally uploaded file, 'youtube' for YouTube link
    required: true,
  },
  videoFile: {
    type: String, // Store the path or identifier of the locally uploaded file
  },
  youtubeLink: {
    type: String,
  },
});

const Video = mongoose.model('Video', videoSchema);

module.exports = Video;