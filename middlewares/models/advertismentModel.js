// models/advertisementModel.js
const mongoose = require('mongoose');

const advertisementSchema = new mongoose.Schema({
  websiteLink: {
    type: String,
    required: true,
  },
  imagePath: {
    type: String,
    required: true,
  },
  position: {
    type: String,
    enum: ['nepali_top', 'nepali_belowbreaking', 'nepali_belowtourism', 'nepali_sidebar1','nepali_sidebar2', 'nepali_beloweconomics', 'nepali_Premium', 'nepali_belowaviation','nepali_belowinternational','nepali_belowthoughts','nepali_belowentertainment','nepali_belowphotogallery','nepali_belowvideo','nepali_popup','english_premium','english_top','english_top2','english_politics','english_economics','english_lifestyle','english_sports','english_tourism','english_international','english_photogallery','english_videogallery','english_sidebar1','english_sidebar2','english_popuop']
  },
  uploadDate: {
    type: Date,
    default: Date.now,
  },
});

const Advertisement = mongoose.model('Advertisement', advertisementSchema);

module.exports = Advertisement;