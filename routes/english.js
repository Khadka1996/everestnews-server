const express = require('express');
const router = express.Router();
const articleController = require('../controllers/englishController');
const articleMiddleware = require('../middlewares/englishMiddleware');

// Route for creating a new article
router.post('/create', articleMiddleware.upload.single('photos'), articleController.createArticle);

// Route for updating an existing article
router.put('/update/:id', articleMiddleware.upload.array('photos'), articleController.updateArticle);

// Route for getting all articles
router.get('/all', articleController.getAllArticles);

// Route for getting trending articles (moved above the '/:id' route)
router.get('/trending', articleController.getTrendingArticles);

// Route for getting suggestions
router.get('/suggestions', articleController.getSuggestions);

// Route for getting a specific article by ID
router.get('/:id', articleController.getArticleById);

// Route for deleting an article by ID
router.delete('/:id', articleController.deleteArticleById);

// Route for getting an article by ID with more views
router.get('/byId/:id', articleController.getArticleByIdWithMoreViews);

// Route for getting articles by category
router.get('/category/:category', articleController.getArticlesByCategory);

// New route for incrementing views when the article is clicked
router.put('/articles/increment-views/:id', articleController.incrementViewsById);

// Route for updating share count of an article by ID
router.post('/articles/:id/share', articleController.updateShareCountById);

// Route for getting share count of an article by ID
router.get('/share-count/:id', articleController.getShareCountById);

// Route for getting total views of an article by ID
router.get('/total-views/:id', articleController.getTotalViewsById);

// Route for getting total unique locations for all articles
router.get('/total-unique-locations', articleController.getTotalUniqueLocations);

// Route for getting location of an article by ID
router.get('/location/:id', articleController.getLocationById);

// Add error handling middleware where necessary
router.use(articleMiddleware.handleUploadErrors);

module.exports = router;