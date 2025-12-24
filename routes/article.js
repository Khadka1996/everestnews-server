const express = require('express');
const router = express.Router();
const articleController = require('../controllers/articleController');
const articleMiddleware = require('../middlewares/articleMiddleware');

// Route for creating a new article
router.post('/create', articleMiddleware.upload.array('photos'), articleController.createArticle);

// Route for updating an existing article
router.put('/update/:id', articleMiddleware.upload.array('photos'), articleController.updateArticle);

// Route for getting all articles
router.get('/all', articleController.getAllArticles);

// Route for getting trending articles (more specific, so should come first)
router.get('/trending', articleController.getTrendingArticles);

// Route for getting articles by category
router.get('/category/:category', articleController.getArticlesByCategory);

// Route for getting articles by category and status
router.get('/category/:category/status/:status', articleController.getArticlesByCategoryWithStatus);



// Route for getting articles by tag (ID or name) and status
router.get('/tag/:tag/status/:status', articleController.getArticlesByTagWithStatus);


// Route for getting articles by authors with status
router.get('/authors/:authorIds/:status', articleController.getArticlesByAuthorsWithStatus);

// Route for getting articles by status (e.g., drafts)
router.get('/status/:status', articleController.getArticleByStatus);

// Route for getting an article by ID with more views (more specific, comes before generic ID route)
router.get('/byId/:id', articleController.getArticleByIdWithMoreViews);

// Route for getting share count of an article by ID (more specific)
router.get('/share-count/:id', articleController.getShareCountById);

// Route for getting total views of an article by ID
router.get('/total-views/:id', articleController.getTotalViewsById);

// Route for incrementing views when the article is clicked
router.put('/increment-views/:id', articleController.incrementViewsById);


// Route for updating share count of an article by ID
router.post('/update-share-count/:id/share', articleController.updateShareCountById);

// Route for fetching tags associated with a specific article
router.get('/:articleId/tags', articleController.getTagsByArticleId);

// Route for getting authors by article ID
router.get('/:articleId/authors', articleController.getAuthorsByArticleId);

// Route for getting share count of an article by ID
router.get('/share-count/:id', articleController.getShareCountById);

// Route for getting location of an article by ID
router.get('/location/:id', articleController.getLocationById);


// Route for getting total views of an article by ID
router.get('/total-views/:id', articleController.getTotalViewsById);

// Route for deleting an article by ID
router.delete('/:id', articleController.deleteArticleById);

// Generic route for getting a specific article by ID
router.get('/:id', articleController.getArticleById);

// Route for getting total unique locations for all articles
router.get('/total-unique-locations', articleController.getTotalUniqueLocations);

module.exports = router;