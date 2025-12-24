// routes/tag.js

const express = require('express');
const router = express.Router();
const {
  getAllTags,
  addTag,
  updateTag,
  deleteTag,
  getTagSuggestions,
  getTagById,
  validateTag,
} = require('../controllers/tagController');

// Routes
router.get('/', getAllTags);
router.post('/', validateTag, addTag);
router.put('/:id', validateTag, updateTag);
router.delete('/:id', deleteTag);
router.get('/suggestions', getTagSuggestions);
router.get('/:id', getTagById);

module.exports = router;