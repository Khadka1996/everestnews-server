const fs = require('fs');
const path = require('path');

// Controller to get all uploaded photos
const getGalleryPhotos = async (req, res) => {
  try {
    const galleryPath = path.join(__dirname, '..', 'uploads', 'articles');
    
    // Read files from the gallery directory
    fs.readdir(galleryPath, (err, files) => {
      if (err) {
        console.error('Error reading gallery directory:', err);
        return res.status(500).json({ success: false, error: 'Error reading gallery' });
      }

      // Create an array of photo objects with file names and URLs
      const photos = files.map(file => ({
        name: file,
        url: `/uploads/articles/${file}`, // Assuming you have a static file serving set up
        _id: file, // Using file name as ID for simplicity
      }));

      res.status(200).json({ success: true, data: photos });
    });
  } catch (error) {
    console.error('Error fetching gallery photos:', error);
    res.status(500).json({ success: false, error: 'Error fetching gallery photos' });
  }
};

module.exports = { getGalleryPhotos };
