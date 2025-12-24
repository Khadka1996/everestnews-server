// controllers/tagController.js

const Tag = require('../models/tagModel');
const { body, validationResult } = require('express-validator');

// Helper function for consistent error response
const sendErrorResponse = (res, status, message) => {
  res.status(status).json({ success: false, error: message });
};

// Get all tags
const getAllTags = async (req, res) => {
  try {
    const tags = await Tag.find();
    res.json({ success: true, data: tags });
  } catch (error) {
    console.error('Error fetching tags:', error);
    sendErrorResponse(res, 500, 'Internal Server Error');
  }
};

// Add a new tag
const addTag = async (req, res) => {
  const { name } = req.body;

  try {
    // Check if a tag with the same name already exists
    const existingTag = await Tag.findOne({ name });
    if (existingTag) {
      return sendErrorResponse(res, 400, 'Tag with the same name already exists');
    }

    // If not, create and save the new tag
    const newTag = new Tag({ name });
    await newTag.save();
    res.json({ success: true, data: newTag });
  } catch (error) {
    console.error('Error adding tag:', error);
    sendErrorResponse(res, 500, 'Internal Server Error');
  }
};

// Update a tag by ID
const updateTag = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  try {
    const updatedTag = await Tag.findByIdAndUpdate(id, { name }, { new: true });
    if (!updatedTag) {
      return sendErrorResponse(res, 404, 'Tag not found');
    }
    res.json({ success: true, data: updatedTag });
  } catch (error) {
    console.error('Error updating tag:', error);
    sendErrorResponse(res, 500, 'Internal Server Error');
  }
};

// Delete a tag by ID
const deleteTag = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedTag = await Tag.findByIdAndDelete(id);
    if (!deletedTag) {
      return sendErrorResponse(res, 404, 'Tag not found');
    }
    res.json({ success: true, data: deletedTag });
  } catch (error) {
    console.error('Error deleting tag:', error);
    sendErrorResponse(res, 500, 'Internal Server Error');
  }
};

// Fetch tag suggestions based on input
const getTagSuggestions = async (req, res) => {
  const { input } = req.query;

  try {
    // Simulate fetching tag suggestions from a data source (replace with your logic)
    const suggestions = await fetchTagSuggestions(input);

    res.json({ success: true, data: suggestions });
  } catch (error) {
    console.error('Error fetching tag suggestions:', error);
    sendErrorResponse(res, 500, 'Internal Server Error');
  }
};

// Get a tag by ID
const getTagById = async (req, res) => {
  const { id } = req.params;

  try {
    const tag = await Tag.findById(id);
    if (!tag) {
      return sendErrorResponse(res, 404, 'Tag not found');
    }
    res.json({ success: true, data: tag });
  } catch (error) {
    console.error('Error fetching tag by ID:', error);
    sendErrorResponse(res, 500, 'Internal Server Error');
  }
};

// Helper function to simulate fetching tag suggestions
const fetchTagSuggestions = async (input) => {
  // Simulate fetching tag suggestions from a data source (replace with your logic)
  // For now, let's use a simple in-memory array as the data source
  const allTags = ['JavaScript', 'React', 'Node.js', 'MongoDB', 'Express'];
  const filteredTags = allTags.filter((tag) => tag.toLowerCase().includes(input.toLowerCase()));
  return filteredTags;
};

// Validation middleware for adding and updating tags
const validateTag = [
  body('name').trim().notEmpty().withMessage('Tag name is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  },
];

module.exports = {
  getAllTags,
  addTag,
  updateTag,
  deleteTag,
  getTagSuggestions,
  getTagById,
  validateTag,
};