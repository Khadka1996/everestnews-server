const mongoose = require('mongoose');

const photoSchema = new mongoose.Schema({
  description: String,
  imagePath: String,
  uploadDate: { type: Date, default: Date.now },
});

const Photo = mongoose.model('Photo', photoSchema);

module.exports = Photo;