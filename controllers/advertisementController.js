const mongoose = require('mongoose');
const Advertisement = require('../models/advertismentModel');

// Helper function for generating error responses
const generateError = (message) => ({ error: message });

const createAdvertisement = async (req, res) => {
  try {
    const { websiteLink, position } = req.body;
    const file = req.file;

    if (!websiteLink || !file || !position) {
      return res.status(400).json(generateError('Website link, image, and position are required'));
    }

    // Check if the provided position is allowed
    if (!Advertisement.schema.path('position').enumValues.includes(position)) {
      return res.status(400).json(generateError('Invalid position'));
    }

    const newAdvertisement = {
      websiteLink,
      imagePath: file.path,
      position,
    };

    const createdAdvertisement = await Advertisement.create(newAdvertisement);

    res.json({ success: true, message: 'Advertisement created successfully', advertisement: createdAdvertisement });
  } catch (error) {
    console.error('Error creating advertisement:', error);
    res.status(500).json(generateError('Internal Server Error'));
  }
};

const getAllAdvertisements = async (req, res) => {
  try {
    const allAdvertisements = await Advertisement.find();
    res.json({ success: true, advertisements: allAdvertisements });
  } catch (error) {
    console.error('Error getting all advertisements:', error);
    res.status(500).json(generateError('Internal Server Error'));
  }
};

const getAdvertisementByPosition = async (req, res) => {
  const { position } = req.params;

  if (!Advertisement.schema.path('position').enumValues.includes(position)) {
    return res.status(400).json(generateError('Invalid position'));
  }

  try {
    const advertisements = await Advertisement.find({ position });
    if (!advertisements || advertisements.length === 0) {
      return res.status(404).json(generateError(`No advertisements found for position ${position}`));
    }

    return res.status(200).json({ advertisements });
  } catch (error) {
    console.error('Error getting advertisements by position:', error);
    return res.status(500).json(generateError('Internal server error'));
  }
};


const updateAdvertisement = async (req, res) => {
  try {
    const { websiteLink, position } = req.body;

    if (position !== undefined && !Advertisement.schema.path('position').enumValues.includes(position)) {
      return res.status(400).json(generateError('Invalid position'));
    }
    
    const updatedAdvertisement = await Advertisement.findByIdAndUpdate(
      req.params.id,
      { websiteLink, position },
      { new: true } // Return the updated document
    );

    if (!updatedAdvertisement) {
      return res.status(404).json(generateError('Advertisement not found'));
    }

    res.json({ success: true, message: 'Advertisement updated successfully', advertisement: updatedAdvertisement });
  } catch (error) {
    console.error('Error updating advertisement by ID:', error);
    res.status(500).json(generateError('Internal Server Error'));
  }
};

const deleteAdvertisement = async (req, res) => {
  try {
    const deletedAdvertisement = await Advertisement.findByIdAndDelete(req.params.id);

    if (!deletedAdvertisement) {
      return res.status(404).json(generateError('Advertisement not found'));
    }

    res.json({ success: true, message: 'Advertisement deleted successfully', advertisement: deletedAdvertisement });
  } catch (error) {
    console.error('Error deleting advertisement by ID:', error);
    res.status(500).json(generateError('Internal Server Error'));
  }
};
const getAdvertisementById = async (req, res) => {
  try {
    const advertisementId = req.params.id;

    console.log('Received Advertisement ID:', advertisementId); // Log the ID

    if (!advertisementId || !mongoose.isValidObjectId(advertisementId)) {
      return res.status(400).json(generateError('Invalid advertisement ID'));
    }

    const advertisement = await Advertisement.findById(advertisementId);

    console.log('Advertisement:', advertisement); // Log the advertisement

    if (!advertisement) {
      return res.status(404).json(generateError('Advertisement not found'));
    }

    res.status(200).json({ advertisement });
  } catch (error) {
    console.error('Error getting advertisement by ID:', error);
    res.status(500).json(generateError('Internal server error'));
  }
};

module.exports = {
  createAdvertisement,
  getAllAdvertisements,
  getAdvertisementByPosition,
  getAdvertisementById,
  updateAdvertisement,
  deleteAdvertisement,
};