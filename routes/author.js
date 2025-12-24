// routes/authorRoutes.js
const express = require('express');
const router = express.Router();
const authorController = require('../controllers/authorControllers');
const authorMiddleware = require('../middlewares/authorMiddleware');

router.post('/create', authorMiddleware.upload.single('authorPhoto'), authorController.createAuthor);
router.get('/', authorController.getAllAuthors);
router.get('/:id', authorController.getAuthorById);
router.put('/:id', authorMiddleware.upload.single('authorPhoto'), authorController.updateAuthor);
router.delete('/:id', authorController.deleteAuthor);
router.get('/suggestions', authorController.getAuthorSuggestions);

module.exports = router;