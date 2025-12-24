// controllers/categoryController.js
const Category = require('../models/categoryModels');
const mongoose = require('mongoose');

const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

const addCategory = async (req, res) => {
  const { name } = req.body;

  try {
    const newCategory = new Category({ name });
    const savedCategory = await newCategory.save();
    res.status(201).json({ success: true, data: savedCategory });
  } catch (error) {
    console.error('Error adding category:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};
const getCategoryById = async (req, res) => {
  const { id } = req.params;

  try {
    // Check if the provided ID is a valid ObjectId
    if (mongoose.Types.ObjectId.isValid(id)) {
      const categoryById = await Category.findById(id);

      if (categoryById) {
        return res.status(200).json({ success: true, data: categoryById });
      }
    }

    // If not a valid ObjectId or not found by ID, try to find by name
    const categoryByName = await Category.findOne({ name: id });

    if (categoryByName) {
      return res.status(200).json({ success: true, data: categoryByName });
    }

    // If not found by either ID or name, return a not found message
    return res.status(404).json({ success: false, message: 'Category not found' });
  } catch (error) {
    console.error('Error getting category by ID or name:', error);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};



const updateCategory = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  try {
    const updatedCategory = await Category.findByIdAndUpdate(id, { name }, { new: true });
    if (!updatedCategory) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    res.status(200).json({ success: true, data: updatedCategory });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

const deleteCategory = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedCategory = await Category.findByIdAndDelete(id);
    if (!deletedCategory) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    res.status(200).json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

module.exports = {
  getAllCategories,
  addCategory,
  getCategoryById,
  updateCategory,
  deleteCategory,
};