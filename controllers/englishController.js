//englishController.js
const EnglishArticle = require('../models/englishModel');
const sharp = require('sharp');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;


const createArticle = async (req, res) => {
  try {

    const { headline, content, tags, youtubeLink, category } = req.body;

    // Use req.file to get the uploaded file
    const photos = req.file ? [req.file.filename] : [];

    const newArticle = new EnglishArticle({
      headline,
      content,
      tags,
      photos,
      youtubeLink,
      category,
    });

    const savedArticle = await newArticle.save();

    res.status(201).json({ success: true, data: savedArticle });
  } catch (error) {
    console.error('Error creating article:', error);
    res.status(500).json({ success: false, error: 'Error creating article' });
  }
};

const updateArticle = async (req, res) => {
  try {
    const articleId = req.params.id;

    // Find the existing article by ID
    const existingArticle = await EnglishArticle.findById(articleId);

    if (!existingArticle) {
      return res.status(404).json({ error: 'Article not found' });
    }

    // Update the article properties
    existingArticle.headline = req.body.headline;
    existingArticle.content = req.body.content;
    existingArticle.tags = req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()) : existingArticle.tags;
    existingArticle.youtubeLink = req.body.youtubeLink;
    existingArticle.category = req.body.category;

    // Handle photo upload and replacement
    if (req.files && req.files.length > 0) {
      const newPhotos = req.files.map((file) => file.filename); // Collect all new filenames

      // If new photos are uploaded, replace the existing ones
      if (newPhotos.length > 0) {
        existingArticle.photos = newPhotos;  // Replace with new photo(s)
      }
    }

    // Save the updated article
    const updatedArticle = await existingArticle.save();

    res.json({ data: updatedArticle });
  } catch (error) {
    console.error('Error updating article:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};




// Update the getArticleByIdWithMoreViews controller
const getArticleByIdWithMoreViews = async (req, res) => {
  try {
    const article = await EnglishArticle.findById(req.params.id);

    if (!article) {
      return res.status(404).json({ success: false, error: 'Article not found' });
    }

    res.status(200).json({ success: true, data: article });
  } catch (error) {
    console.error('Error getting article by ID with more views:', error);
    res.status(500).json({ success: false, error: 'Error getting article by ID with more views', details: error.message });
  }
};
const getAllArticles = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 12);
    const skip = (page - 1) * limit;

    const totalArticles = await EnglishArticle.countDocuments();

    const articles = await EnglishArticle.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.status(200).json({
      success: true,
      data: articles,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalArticles / limit),
        totalArticles,
        limit,
      },
    });
  } catch (error) {
    console.error('Error getting all articles:', error);
    res.status(500).json({
      success: false,
      error: 'Error getting all articles',
    });
  }
};




const getArticleById = async (req, res) => {
  try {
    const article = await EnglishArticle.findById(req.params.id);

    if (!article) {
      return res.status(404).json({ success: false, error: 'Article not found' });
    }

    res.status(200).json({ success: true, data: article });
  } catch (error) {
    console.error('Error getting article by ID:', error);
    res.status(500).json({ success: false, error: 'Error getting article by ID' });
  }
};

const deleteArticleById = async (req, res) => {
  try {
    const deletedArticle = await EnglishArticle.findByIdAndDelete(req.params.id);

    if (!deletedArticle) {
      return res.status(404).json({ success: false, error: 'Article not found' });
    }

    res.status(200).json({ success: true, data: deletedArticle });
  } catch (error) {
    console.error('Error deleting article by ID:', error);
    res.status(500).json({ success: false, error: 'Error deleting article by ID' });
  }
};
const getTrendingArticles = async (req, res) => {
  try {
    const currentDate = new Date();
    const sevenDaysAgo = new Date(currentDate - 7 * 24 * 60 * 60 * 1000); // 7 days ago

    // Check if it's time to update the trending list
    const lastUpdateThreshold = new Date(currentDate - 7 * 24 * 60 * 60 * 1000);
    const needUpdate = await EnglishArticle.find({ lastTrendingUpdate: { $lt: lastUpdateThreshold } }).limit(1);

    if (needUpdate.length > 0) {
      // Update the trending list
      const trendingArticles = await EnglishArticle.find()
        .sort({ views: -1, _id: 1 })
        .limit(10); // Fetch top 10 articles

      // Update the last trending update date for all articles
      await EnglishArticle.updateMany({}, { lastTrendingUpdate: currentDate });

      // Send the updated trending list
      return res.status(200).json({ success: true, data: trendingArticles });
    }

    // Fetch the current trending list
    const trendingArticles = await EnglishArticle.find({ views: { $gt: 0, $lt: 1000 } })
      .sort({ views: -1, _id: 1 })
      .limit(10); // Fetch top 10 articles

    // If articles are found, send the response
    res.status(200).json({ success: true, data: trendingArticles });
  } catch (error) {
    console.error('Error getting trending articles:', error);
    res.status(500).json({ success: false, error: 'Error getting trending articles', details: error.message });
  }
};


const getArticlesByCategory = async (req, res) => {
  try {
    const categoryName = req.params.category;

    // Validate if the category name is provided
    if (!categoryName) {
      console.error('Category name is required');
      return res.status(400).json({ success: false, error: 'Category name is required' });
    }

    const page = parseInt(req.query.page, 10) || 1; // Default to page 1
    const limit = parseInt(req.query.limit, 10) || 12; // Default to 12 articles per page
    const skip = (page - 1) * limit; // Calculate how many records to skip

    // Get total count of articles in the category
    const totalArticles = await EnglishArticle.countDocuments({ category: categoryName });

    // Get articles with pagination and sorting
    const articles = await EnglishArticle.find({ category: categoryName })
      .sort({ createdAt: -1 }) // Sort by creation date in descending order
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: articles,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalArticles / limit),
        totalArticles,
        limit,
      },
    });
  } catch (error) {
    console.error('Error getting articles by category:', error);
    res.status(500).json({ success: false, error: 'Error getting articles by category' });
  }
};



const incrementViewsById = async (req, res) => {
  try {
    const { id } = req.params;

    const article = await EnglishArticle.findById(id);

    if (!article) {
      return res.status(404).json({ success: false, message: 'Article not found' });
    }

    // Increment views using the model method
    await article.incrementViews();

    res.status(200).json({ success: true, message: 'Views incremented successfully' });
  } catch (error) {
    console.error('Error incrementing views:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getShareCountById = async (req, res) => {
  try {
    const article = await EnglishArticle.findById(req.params.id);

    if (!article) {
      return res.status(404).json({ success: false, error: 'Article not found' });
    }

    res.status(200).json({ success: true, data: article.shareCount });
  } catch (error) {
    console.error('Error getting share count:', error);
    res.status(500).json({ success: false, error: 'Error getting share count' });
  }
};

const updateShareCountById = async (req, res) => {
  try {
    const { platform } = req.body;

    // Validate if the required data is provided
    if (!platform) {
      return res.status(400).json({ success: false, error: 'Platform is required for updating share count' });
    }

    // Find the article by ID and update the share count
    const updatedArticle = await EnglishArticle.findByIdAndUpdate(
      req.params.id,
      { $inc: { shareCount: 1 } }, // Increment share count by 1
      { new: true }
    );

    if (!updatedArticle) {
      return res.status(404).json({ success: false, error: 'Article not found' });
    }

    res.status(200).json({ success: true, data: updatedArticle.shareCount });
  } catch (error) {
    console.error('Error updating share count:', error);
    res.status(500).json({ success: false, error: 'Error updating share count', details: error.message });
  }
};


const getTotalViewsById = async (req, res) => {
  try {
    const article = await EnglishArticle.findById(req.params.id);

    if (!article) {
      return res.status(404).json({ success: false, error: 'Article not found' });
    }

    res.status(200).json({ success: true, data: article.views });
  } catch (error) {
    console.error('Error getting total views:', error);
    res.status(500).json({ success: false, error: 'Error getting total views' });
  }
};

const getTotalUniqueLocations = async (req, res) => {
  try {
    const articles = await EnglishArticle.find();
    const uniqueLocations = [...new Set(articles.map((article) => article.location))];
    res.status(200).json({ success: true, data: uniqueLocations });
  } catch (error) {
    console.error('Error getting total unique locations:', error);
    res.status(500).json({ success: false, error: 'Error getting total unique locations' });
  }
};

const getLocationById = async (req, res) => {
  try {
    const location = await getLocationByArticleId(req.params.id);

    if (!location) {
      return res.status(404).json({ success: false, error: 'Location not found for the article' });
    }

    res.status(200).json({ success: true, data: location });
  } catch (error) {
    console.error('Error getting location:', error);
    res.status(500).json({ success: false, error: 'Error getting location' });
  }
};

const getLocationByArticleId = async (articleId) => {
  try {
    const article = await EnglishArticle.findById(articleId);

    if (!article) {
      return null;
    }

    return {
      location: article.location,
      shareCount: article.shareCount,
      views: article.views,
    };
  } catch (error) {
    console.error('Error getting location by article ID:', error);
    throw error;
  }
};

const getSuggestions = async (req, res) => {
  try {
    const query = req.query.query;
    const regex = new RegExp(query, 'i');

    const suggestions = await EnglishArticle.find({ headline: regex }, { headline: 1 }).limit(5);

    const suggestedHeadlines = suggestions.map(suggestion => suggestion.headline);

    res.status(200).json({ success: true, suggestions: suggestedHeadlines });
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    res.status(500).json({ success: false, error: 'Error fetching suggestions' });
  }
};

module.exports = {
  createArticle,
  updateArticle,
  getAllArticles,
  getArticleById,
  deleteArticleById,
  getTrendingArticles,
  getArticleByIdWithMoreViews,
  getArticlesByCategory,
  incrementViewsById,
  getShareCountById,
  updateShareCountById,
  getTotalViewsById,
  getTotalUniqueLocations,
  getLocationById,
  getSuggestions,

};