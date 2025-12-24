const Photo = require('../models/photoModels');

const createPhoto = async (req, res) => {
  try {
    const { description } = req.body;
    const files = req.files; // Note: 'req.files' for .array() middleware

    if (!description || !files || files.length === 0) {
      return res.status(400).json({ success: false, error: 'Description and at least one image are required' });
    }

    const photos = files.map((file) => ({
      description: description,
      imagePath: file.path,
    }));

    const createdPhotos = await Photo.create(photos);
    res.json({ success: true, message: 'Photos uploaded successfully', photos: createdPhotos });
  } catch (error) {
    console.error('Error creating photos:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

const getAllPhotos = async (req, res) => {
  try {
    const allPhotos = await Photo.find();
    res.json({ success: true, photos: allPhotos });
  } catch (error) {
    console.error('Error getting all photos:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

const getPhotoById = async (req, res) => {
  try {
    const photo = await Photo.findById(req.params.id);
    if (!photo) {
      return res.status(404).json({ success: false, error: 'Photo not found' });
    }

    res.json({ success: true, photo: photo });
  } catch (error) {
    console.error('Error getting photo by ID:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};
const updatePhoto = async (req, res) => {
  try {
    const { description } = req.body;
    const files = req.files; // Note: 'req.files' for .array() middleware

    // Prepare the update data
    const updateData = {};
    if (description) {
      updateData.description = description; // Update description if provided
    }

    if (files && files.length > 0) {
      updateData.imagePath = files.map(file => file.path); // Update with new images if provided
    }

    const updatedPhoto = await Photo.findByIdAndUpdate(req.params.id, updateData, { new: true });

    if (!updatedPhoto) {
      return res.status(404).json({ success: false, error: 'Photo not found' });
    }

    res.json({ success: true, message: 'Photo updated successfully', photo: updatedPhoto });
  } catch (error) {
    console.error('Error updating photo by ID:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};


const deletePhoto = async (req, res) => {
  try {
    const deletedPhoto = await Photo.findByIdAndDelete(req.params.id);

    if (!deletedPhoto) {
      return res.status(404).json({ success: false, error: 'Photo not found' });
    }

    res.json({ success: true, message: 'Photo deleted successfully', photo: deletedPhoto });
  } catch (error) {
    console.error('Error deleting photo by ID:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

module.exports = {
  createPhoto,
  getAllPhotos,
  getPhotoById,
  updatePhoto,
  deletePhoto,
};
