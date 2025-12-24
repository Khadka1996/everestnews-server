// routes/category.js
const express = require('express');
const router = express.Router();
const {
  getAllCategories,
  addCategory,
  getCategoryById,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');
const { validateCategory } = require('../middlewares/categoryMiddleware');

router.get('/', getAllCategories);
router.post('/', validateCategory, addCategory);
router.get('/:id', getCategoryById); // New route for getting a category by ID
router.put('/:id', validateCategory, updateCategory);
router.delete('/:id', deleteCategory);
router.get('/id/:id', getCategoryById); 

module.exports = router;