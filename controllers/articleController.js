const Article = require('../models/articleModel');
const Category = require('../models/categoryModels');
const Author = require('../models/authorModel');
const Tag = require('../models/tagModel'); 
const { createClient } = require('redis');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

// Initialize Redis client with connection URL
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    connectTimeout: 10000, // Set connection timeout to 10 seconds
  }
});

// Redis error handling
redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  console.log('Connected to Redis successfully');
});

redisClient.on('ready', () => {
  console.log('Redis client is ready');
});

redisClient.on('reconnecting', () => {
  console.log('Redis client is reconnecting...');
});

// Connect to Redis
(async () => {
  try {
    await redisClient.connect();
    console.log('Redis connection established');
  } catch (err) {
    console.error('Failed to connect to Redis:', err);
  }
})();

// Helper function to clear article-related caches
const clearArticleCaches = async (articleId = null) => {
  try {
    const keys = await redisClient.keys('articles:*');
    if (keys.length > 0) {
      await redisClient.del(keys);
      console.log('Cleared article caches');
    }
    
    // Clear trending articles cache
    await redisClient.del('trending_articles');
    
    // If specific article ID is provided, clear its cache
    if (articleId) {
      await redisClient.del(`article:${articleId}`);
      await redisClient.del(`article_full:${articleId}`);
    }
  } catch (err) {
    console.error('Error clearing caches:', err);
  }
};

// creating the article
const createArticle = async (req, res) => {
  try {
    const { 
      headline, 
      subheadline, 
      content, 
      selectedTags, 
      selectedAuthors, 
      youtubeLink, 
      category, 
      publishDate, 
      photos: galleryPhotos, 
      status 
    } = req.body;

    // Validation
    if (!headline || !content || !category) {
      return res.status(400).json({ success: false, error: 'Headline, content, and category are required.' });
    }

    // Handle uploaded files
    const uploadedPhotos = req.files ? req.files.map(file => file.path) : [];

    // Ensure galleryPhotos is an array
    const galleryPhotosArray = Array.isArray(galleryPhotos) ? galleryPhotos : (galleryPhotos ? [galleryPhotos] : []);

    // Combine photos
    const photos = [...uploadedPhotos, ...galleryPhotosArray];
    if (photos.length === 0) {
      return res.status(400).json({ success: false, error: 'At least one photo must be provided.' });
    }

    const now = new Date();
    let articlePublishDate;

    // Determine publishDate if provided
    if (publishDate) {
      articlePublishDate = new Date(publishDate);
      if (status === 'scheduled' && articlePublishDate <= now) {
        return res.status(400).json({ success: false, error: 'Scheduled date must be in the future.' });
      }
    }

    const newArticle = new Article({
      headline,
      subheadline,
      content,
      selectedTags,
      selectedAuthors,
      photos,
      youtubeLink,
      category,
      publishDate: (status === 'scheduled') ? articlePublishDate : null,
      status
    });

    const savedArticle = await newArticle.save();
    
    // Clear caches after creating new article
    await clearArticleCaches();
    
    res.status(201).json({ success: true, data: savedArticle });

  } catch (error) {
    console.error('Error creating article:', error);
    res.status(500).json({ success: false, error: 'Error creating article' });
  }
};

const updateArticle = async (req, res) => {
  const { headline, subheadline, content, status, youtubeLink, selectedTags, selectedAuthors, category } = req.body;

  try {
    // Find the existing article by ID
    const existingArticle = await Article.findById(req.params.id);

    if (!existingArticle) {
      return res.status(404).json({ success: false, error: 'Article not found.' });
    }

    // Prepare the update object
    const updatedData = {
      headline: headline || existingArticle.headline,
      content: content || existingArticle.content,
      status: status || existingArticle.status,
      category: category || existingArticle.category,
      subheadline: subheadline || existingArticle.subheadline,
      youtubeLink: youtubeLink || existingArticle.youtubeLink,
      selectedTags: selectedTags ? JSON.parse(selectedTags) : existingArticle.selectedTags,
      selectedAuthors: selectedAuthors ? JSON.parse(selectedAuthors) : existingArticle.selectedAuthors,
    };

    // Handle file uploads if there are any
    if (req.files && req.files.length > 0) {
      // Validate that only image files are uploaded
      for (let file of req.files) {
        if (!file.mimetype.startsWith('image/')) {
          return res.status(400).json({ success: false, error: 'Only image files are allowed.' });
        }
      }

      updatedData.photos = req.files.map(file => file.path);
    } else {
      updatedData.photos = existingArticle.photos;
    }

    // Update the article in the database with the new data
    const updatedArticle = await Article.findByIdAndUpdate(req.params.id, updatedData, { new: true });

    // Clear caches for this specific article and trending articles
    await clearArticleCaches(req.params.id);
    
    return res.status(200).json({ success: true, data: updatedArticle });
  } catch (error) {
    console.error('Error updating article:', error);
    return res.status(500).json({ success: false, error: error.message || 'Internal Server Error' });
  }
};

const getAllArticles = async (req, res) => {
  try {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc', search = '' } = req.query;

    // Create a cache key based on all query parameters
    const cacheKey = `articles:all:${page}:${limit}:${sortBy}:${sortOrder}:${search}`;

    // Try to get from cache first
    if (redisClient.isReady) {
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        console.log('Serving getAllArticles from Redis cache');
        return res.status(200).json(JSON.parse(cachedData));
      }
    }

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Construct sorting order dynamically
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Construct search query for headline or other fields
    const searchQuery = search
      ? { headline: { $regex: search, $options: 'i' } }
      : {};

    // Query articles with sorting, searching, and pagination
    const articles = await Article.find(searchQuery)
      .sort(sortOptions)
      .skip(skip)
      .limit(Number(limit))
      .populate({
        path: 'selectedTags',
        model: 'Tag',
        select: 'name',
      })
      .populate({
        path: 'selectedAuthors',
        model: 'Author',
        select: 'firstName lastName',
      })
      .populate({
        path: 'category',
        model: 'Category',
        select: 'name',
      });

    // Get total count of articles for pagination metadata
    const totalCount = await Article.countDocuments(searchQuery);

    const responseData = {
      success: true,
      data: articles,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };

    // Cache the response for 5 minutes
    if (redisClient.isReady) {
      await redisClient.setEx(cacheKey, 300, JSON.stringify(responseData));
    }

    res.status(200).json(responseData);
  } catch (error) {
    console.error('Error retrieving all articles:', error);
    res.status(500).json({ success: false, error: 'An error occurred while retrieving all articles' });
  }
};

const getArticleById = async (req, res) => {
  try {
    const articleId = req.params.id;
    const cacheKey = `article:${articleId}`;

    // Try to get from cache first
    if (redisClient.isReady) {
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        console.log('Serving getArticleById from Redis cache');
        return res.status(200).json(JSON.parse(cachedData));
      }
    }

    // Fetch the article by ID and populate related fields
    const article = await Article.findById(articleId)
      .populate('selectedTags', 'name')
      .populate('selectedAuthors', 'firstName lastName')
      .populate('category', 'name')
      .lean()
      .exec();

    // Check if article was found
    if (!article) {
      return res.status(404).json({ success: false, error: 'Article not found' });
    }

    // Perform transformations on a copy of the data
    const transformedArticle = {
      ...article,
      selectedTags: article.selectedTags ? article.selectedTags.map(tag => tag.name) : [],
      selectedAuthors: article.selectedAuthors
        ? article.selectedAuthors.map(author => `${author.firstName} ${author.lastName}`)
        : [],
      category: article.category ? article.category.name : null,
      content: article.content,
    };

    const responseData = {
      success: true,
      data: transformedArticle,
    };

    // Cache the response for 10 minutes
    if (redisClient.isReady) {
      await redisClient.setEx(cacheKey, 600, JSON.stringify(responseData));
    }

    res.status(200).json(responseData);
  } catch (error) {
    console.error('Error getting article by ID:', error);
    res.status(500).json({ success: false, error: 'Error getting article by ID' });
  }
};

const deleteArticleById = async (req, res) => {
  try {
    const deletedArticle = await Article.findByIdAndDelete(req.params.id);

    if (!deletedArticle) {
      return res.status(404).json({ success: false, error: 'Article not found' });
    }

    // Clear caches after deleting article
    await clearArticleCaches(req.params.id);
    
    res.status(200).json({ success: true, data: deletedArticle });
  } catch (error) {
    console.error('Error deleting article by ID:', error);
    res.status(500).json({ success: false, error: 'Error deleting article by ID' });
  }
};

const getTagsByArticleId = async (req, res) => {
  try {
    const { articleId } = req.params;
    const article = await Article.findById(articleId).populate('selectedTags');

    if (!article) {
      return res.status(404).json({ success: false, message: 'Article not found' });
    }

    const tags = article.selectedTags;
    return res.json({ success: true, data: tags });
  } catch (error) {
    console.error('Error fetching tags:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// New function to get article by ID with more views
const getArticleByIdWithMoreViews = async (req, res) => {
  try {
    const articleId = req.params.id;
    const cacheKey = `article_full:${articleId}`;

    // Try to get from cache first
    if (redisClient.isReady) {
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        console.log('Serving getArticleByIdWithMoreViews from Redis cache');
        return res.status(200).json(JSON.parse(cachedData));
      }
    }

    const article = await Article.findById(articleId)
      .populate({
        path: 'selectedTags',
        model: 'Tag',
        select: 'name',
      })
      .populate({
        path: 'selectedAuthors',
        model: 'Author',
        select: 'firstName lastName',
      })
      .populate({
        path: 'category',
        model: 'Category',
        select: 'name',
      });

    if (!article) {
      return res.status(404).json({ success: false, error: 'Article not found' });
    }

    // Increment views when retrieving the article
    await article.incrementViews();

    // Clear cache for this article since views have changed
    if (redisClient.isReady) {
      await redisClient.del(`article:${articleId}`);
    }

    const responseData = {
      success: true,
      data: {
        ...article._doc,
        selectedTags: article.selectedTags.map(tag => tag.name),
        selectedAuthors: article.selectedAuthors.map(author => `${author.firstName} ${author.lastName}`),
        category: article.category.name,
      },
    };

    // Cache the response for 5 minutes
    if (redisClient.isReady) {
      await redisClient.setEx(cacheKey, 300, JSON.stringify(responseData));
    }

    res.status(200).json(responseData);
  } catch (error) {
    console.error('Error getting article by ID with more views:', error);
    res.status(500).json({ success: false, error: 'Error getting article by ID with more views' });
  }
};

// Your endpoint for fetching trending articles
const getTrendingArticles = async (req, res) => {
  try {
    const cacheKey = 'trending_articles';

    // Try to get from cache first
    if (redisClient.isReady) {
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        console.log('Serving trending articles from Redis cache');
        return res.status(200).json({ success: true, data: JSON.parse(cachedData), cached: true });
      }
    }

    const currentDate = Date.now();
    const sevenDaysAgo = currentDate - 7 * 24 * 60 * 60 * 1000;

    // Check if any article's trending list needs to be updated weekly
    const needsUpdate = await Article.findOne({ lastTrendingUpdate: { $lt: new Date(sevenDaysAgo) } });

    let trendingArticles;

    if (needsUpdate) {
      // Update the trending list by selecting top 9 articles based on views
      trendingArticles = await Article.find()
        .sort({ views: -1, _id: 1 })
        .limit(9)
        .select('headline subheadline photos youtubeLink views status publishDate');

      // Set the lastTrendingUpdate to the current date for all trending articles
      await Article.updateMany(
        { _id: { $in: trendingArticles.map(article => article._id) } },
        { lastTrendingUpdate: new Date() }
      );

      console.log('Trending list updated');
    } else {
      // Fetch the current trending articles if no update is needed
      trendingArticles = await Article.find({ views: { $gt: 0 } })
        .sort({ views: -1, _id: 1 })
        .limit(9)
        .select('headline subheadline photos youtubeLink views status publishDate');
    }

    // Cache the trending articles for 30 minutes
    if (redisClient.isReady) {
      await redisClient.setEx(cacheKey, 1800, JSON.stringify(trendingArticles));
    }

    return res.status(200).json({ success: true, data: trendingArticles, cached: false });
  } catch (error) {
    console.error('Error getting trending articles:', error);
    return res.status(500).json({ success: false, error: 'Error getting trending articles', details: error.message });
  }
};

const getAuthorsByArticleId = async (req, res) => {
  try {
    const { articleId } = req.params;
    const cacheKey = `article_authors:${articleId}`;

    // Try to get from cache first
    if (redisClient.isReady) {
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        console.log('Serving authors from Redis cache');
        return res.status(200).json(JSON.parse(cachedData));
      }
    }
    
    // Find the article by ID
    const article = await Article.findById(articleId);

    if (!article) {
      return res.status(404).json({ success: false, error: 'Article not found' });
    }

    // Retrieve the authors associated with the article
    const authorIds = article.selectedAuthors;

    // Fetch author details based on the IDs
    const authors = await Author.find({ _id: { $in: authorIds } });

    const responseData = { success: true, data: authors };

    // Cache for 10 minutes
    if (redisClient.isReady) {
      await redisClient.setEx(cacheKey, 600, JSON.stringify(responseData));
    }

    res.status(200).json(responseData);
  } catch (error) {
    console.error('Error getting authors by article ID:', error);
    res.status(500).json({ success: false, error: 'Error getting authors by article ID' });
  }
};

const incrementViewsById = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);

    if (!article) {
      return res.status(404).json({ success: false, error: 'Article not found' });
    }

    await article.incrementViews();

    // Clear cache for this article since views have changed
    if (redisClient.isReady) {
      await redisClient.del(`article:${req.params.id}`);
      await redisClient.del(`article_full:${req.params.id}`);
      // Also clear trending articles cache since views affect trending
      await redisClient.del('trending_articles');
    }

    res.status(200).json({ success: true, data: article });
  } catch (error) {
    console.error('Error incrementing views:', error);
    res.status(500).json({ success: false, error: 'Error incrementing views' });
  }
};

const getTotalViewsById = async (req, res) => {
  try {
    const articleId = req.params.id;
    const cacheKey = `article_views:${articleId}`;

    // Try to get from cache first
    if (redisClient.isReady) {
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        console.log('Serving views from Redis cache');
        return res.status(200).json(JSON.parse(cachedData));
      }
    }

    const article = await Article.findById(articleId);

    if (!article) {
      return res.status(404).json({ success: false, error: 'Article not found' });
    }

    const responseData = { success: true, data: article.views };

    // Cache for 2 minutes (views can change frequently)
    if (redisClient.isReady) {
      await redisClient.setEx(cacheKey, 120, JSON.stringify(responseData));
    }

    res.status(200).json(responseData);
  } catch (error) {
    console.error('Error getting total views:', error);
    res.status(500).json({ success: false, error: 'Error getting total views' });
  }
};

const getShareCountById = async (req, res) => {
  try {
    const articleId = req.params.id;
    const cacheKey = `article_shares:${articleId}`;

    // Try to get from cache first
    if (redisClient.isReady) {
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        console.log('Serving share count from Redis cache');
        return res.status(200).json(JSON.parse(cachedData));
      }
    }

    const article = await Article.findById(articleId);

    if (!article) {
      return res.status(404).json({ success: false, error: 'Article not found' });
    }

    const responseData = { success: true, data: article.shareCount };

    // Cache for 2 minutes
    if (redisClient.isReady) {
      await redisClient.setEx(cacheKey, 120, JSON.stringify(responseData));
    }

    res.status(200).json(responseData);
  } catch (error) {
    console.error('Error getting share count:', error);
    res.status(500).json({ success: false, error: 'Error getting share count' });
  }
};

const updateShareCountById = async (req, res) => {
  try {
    const { platform } = req.body;
    const article = await Article.findByIdAndUpdate(
      req.params.id,
      { $inc: { shareCount: 1 } }, 
      { new: true }
    );

    if (!article) {
      return res.status(404).json({ success: false, error: 'Article not found' });
    }

    // Clear cache for this article since share count has changed
    if (redisClient.isReady) {
      await redisClient.del(`article:${req.params.id}`);
      await redisClient.del(`article_shares:${req.params.id}`);
      // Also clear trending articles cache since shares might affect trending
      await redisClient.del('trending_articles');
    }

    res.status(200).json({ success: true, data: article.shareCount });
  } catch (error) {
    console.error('Error updating share count:', error);
    res.status(500).json({ success: false, error: 'Error updating share count' });
  }
};

const getTotalUniqueLocations = async (req, res) => {
  try {
    const cacheKey = 'unique_locations';

    // Try to get from cache first
    if (redisClient.isReady) {
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        console.log('Serving unique locations from Redis cache');
        return res.status(200).json(JSON.parse(cachedData));
      }
    }

    const articles = await Article.find();
    const uniqueLocations = [...new Set(articles.map(article => article.location))];
    
    const responseData = { success: true, data: uniqueLocations };

    // Cache for 1 hour (locations don't change frequently)
    if (redisClient.isReady) {
      await redisClient.setEx(cacheKey, 3600, JSON.stringify(responseData));
    }

    res.status(200).json(responseData);
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
    const article = await Article.findById(articleId);

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

const getArticleByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const { authorId, categoryId, tagIds, page = 1, limit = 21 } = req.query;

    // Create cache key based on all parameters
    const cacheKey = `articles_by_status:${status}:${authorId || ''}:${categoryId || ''}:${tagIds || ''}:${page}:${limit}`;

    // Try to get from cache first
    if (redisClient.isReady) {
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        console.log('Serving articles by status from Redis cache');
        return res.status(200).json(JSON.parse(cachedData));
      }
    }

    const validStatuses = ['draft', 'scheduled', 'published'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status. Allowed statuses are draft, scheduled, and published.' });
    }

    const query = { status };

    if (authorId) {
      query.selectedAuthors = authorId; 
    }

    if (categoryId) {
      query.category = categoryId; 
    }

    if (tagIds) {
      query.selectedTags = { $in: tagIds.split(',') };
    }

    const skip = (page - 1) * limit; 

    const articles = await Article.find(query)
      .sort({ createdAt: -1 })
      .skip(skip) 
      .limit(limit) 
      .select('-content') 
      .populate({
        path: 'selectedTags',
        model: 'Tag',
      })
      .populate({
        path: 'selectedAuthors',
        model: 'Author',
      })
      .populate({
        path: 'category',
        model: 'Category',
      });

    if (!articles || articles.length === 0) {
      return res.status(404).json({ success: false, error: 'No articles found with the specified filters.' });
    }

    const totalArticles = await Article.countDocuments(query);
    const totalPages = Math.ceil(totalArticles / limit);

    const responseData = {
      success: true,
      data: articles,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalArticles: totalArticles,
        articlesPerPage: limit,
      },
    };

    // Cache for 5 minutes
    if (redisClient.isReady) {
      await redisClient.setEx(cacheKey, 300, JSON.stringify(responseData));
    }

    res.status(200).json(responseData);
  } catch (error) {
    console.error('Error fetching articles by filters:', error);
    res.status(500).json({ success: false, error: 'Error fetching articles by filters' });
  }
};

const getArticlesByCategoryWithStatus = async (req, res) => {
  try {
    const { category, status } = req.params;
    const { page = 1, limit = 12 } = req.query;

    // Create cache key
    const cacheKey = `articles_by_category_status:${category}:${status}:${page}:${limit}`;

    // Try to get from cache first
    if (redisClient.isReady) {
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        console.log('Serving articles by category and status from Redis cache');
        return res.status(200).json(JSON.parse(cachedData));
      }
    }

    // Validate if the category name and status are provided
    if (!category || !status) {
      return res.status(400).json({ success: false, error: 'Category name and status are required' });
    }

    // Find the ObjectId of the category with the given name
    const categoryData = await Category.findOne({ name: category });
    if (!categoryData) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }

    const skip = (page - 1) * limit;

    // Fetch articles with pagination and exclude 'content'
    const articles = await Article.find({ category: categoryData._id, status })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-content')
      .populate({
        path: 'selectedTags',
        model: 'Tag',
        select: 'name',
      })
      .populate({
        path: 'selectedAuthors',
        model: 'Author',
        select: 'firstName lastName',
      })
      .populate({
        path: 'category',
        model: 'Category',
        select: ['_id', 'name'],
      });

    // If no articles are found
    if (!articles || articles.length === 0) {
      return res.status(404).json({ success: false, error: 'No articles found with the specified filters.' });
    }

    // Total count for pagination
    const totalCount = await Article.countDocuments({ category: categoryData._id, status });
    const totalPages = Math.ceil(totalCount / limit);

    // Prepare response data
    const responseData = {
      success: true,
      data: articles.map(article => ({
        ...article._doc,
        selectedTags: article.selectedTags.map(tag => tag.name),
        selectedAuthors: article.selectedAuthors.map(author => `${author.firstName} ${author.lastName}`),
        category: { _id: article.category._id, name: article.category.name },
      })),
      pagination: {
        totalCount,
        totalPages,
        currentPage: page,
        pageSize: limit,
      },
    };

    // Cache for 5 minutes
    if (redisClient.isReady) {
      await redisClient.setEx(cacheKey, 300, JSON.stringify(responseData));
    }

    res.status(200).json(responseData);
  } catch (error) {
    console.error('Error getting articles by category and status:', error);
    res.status(500).json({ success: false, error: 'Error getting articles by category and status' });
  }
};

const getArticlesByCategory = async (req, res) => {
  try {
    const categoryName = req.params.category;
    const sortField = req.query.sortField || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    // Create cache key
    const cacheKey = `articles_by_category:${categoryName}:${sortField}:${sortOrder}`;

    // Try to get from cache first
    if (redisClient.isReady) {
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        console.log('Serving articles by category from Redis cache');
        return res.status(200).json(JSON.parse(cachedData));
      }
    }

    // Validate if the category name is provided
    if (!categoryName) {
      console.error('Category name is required');
      return res.status(400).json({ success: false, error: 'Category name is required' });
    }

    // Find the ObjectId of the category with the given name
    const category = await Category.findOne({ name: categoryName });

    // Check if the category exists
    if (!category) {
      console.error(`Category with name ${categoryName} not found`);
      return res.status(404).json({ success: false, error: `Category with name ${categoryName} not found` });
    }

    // Fetch articles by category ObjectId with dynamic sorting
    const articles = await Article.find({ category: category._id })
      .sort({ [sortField]: sortOrder })
      .populate({
        path: 'selectedTags',
        model: 'Tag',
        select: 'name',
      })
      .populate({
        path: 'selectedAuthors',
        model: 'Author',
        select: 'firstName lastName',
      })
      .populate({
        path: 'category',
        model: 'Category',
        select: ['_id', 'name'],
      });

    const responseData = {
      success: true,
      data: articles.map(article => ({
        ...article._doc,
        selectedTags: article.selectedTags.map(tag => tag.name),
        selectedAuthors: article.selectedAuthors.map(author => `${author.firstName} ${author.lastName}`),
        category: { _id: article.category._id, name: article.category.name },
      })),
    };

    // Cache for 10 minutes
    if (redisClient.isReady) {
      await redisClient.setEx(cacheKey, 600, JSON.stringify(responseData));
    }

    res.status(200).json(responseData);
  } catch (error) {
    console.error('Error getting articles by category:', error);
    res.status(500).json({ success: false, error: 'Error getting articles by category' });
  }
};

const getArticlesByTagWithStatus = async (req, res) => {
  try {
    const { status, tag } = req.params;
    const { page = 1, limit = 9 } = req.query;

    // Create cache key
    const cacheKey = `articles_by_tag_status:${status}:${tag}:${page}:${limit}`;

    // Try to get from cache first
    if (redisClient.isReady) {
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        console.log('Serving articles by tag and status from Redis cache');
        return res.status(200).json(JSON.parse(cachedData));
      }
    }

    if (!status || !tag) {
      console.error('Status and tag are required');
      return res.status(400).json({ success: false, error: 'Status and tag are required' });
    }

    let tagId;

    // Check if tag is a valid ObjectId
    if (mongoose.Types.ObjectId.isValid(tag)) {
      tagId = tag; 
    } else {
      const foundTag = await Tag.findOne({ name: tag });
      if (!foundTag) {
        console.error(`Tag with name "${tag}" not found`);
        return res.status(404).json({ success: false, error: `Tag with name "${tag}" not found` });
      }
      tagId = foundTag._id;
    }

    // Calculate the skip value for pagination
    const skip = (page - 1) * limit;

    // Fetch the articles based on status and tag with pagination, excluding content field
    const articles = await Article.find({
      status: status,
      selectedTags: tagId,
    })
    .sort({ createdAt: -1 }) 
      .skip(skip)
      .limit(limit)
      .select('-content')
      .populate({
        path: 'selectedTags',
        model: 'Tag',
        select: '_id name',
      })
      .populate({
        path: 'selectedAuthors',
        model: 'Author',
        select: 'firstName lastName',
      })
      .populate({
        path: 'category',
        model: 'Category',
        select: ['_id', 'name'],
      });

    // Get the total count of articles for pagination info
    const totalCount = await Article.countDocuments({
      status: status,
      selectedTags: tagId,
    });

    const responseData = {
      success: true,
      data: articles.map(article => ({
        ...article._doc,
        selectedTags: article.selectedTags.map(tag => ({ id: tag._id, name: tag.name })),
        selectedAuthors: article.selectedAuthors.map(author => `${author.firstName} ${author.lastName}`),
        category: { _id: article.category._id, name: article.category.name },
      })),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };

    // Cache for 5 minutes
    if (redisClient.isReady) {
      await redisClient.setEx(cacheKey, 300, JSON.stringify(responseData));
    }

    res.status(200).json(responseData);
  } catch (error) {
    console.error('Error getting articles by tag and status:', error);
    res.status(500).json({ success: false, error: 'Error getting articles by tag and status' });
  }
};

const getArticlesByAuthorsWithStatus = async (req, res) => {
  try {
    const { authorName, status } = req.params;
    const { page = 1, limit = 1 } = req.query;

    // Create cache key
    const cacheKey = `articles_by_author_status:${authorName}:${status}:${page}:${limit}`;

    // Try to get from cache first
    if (redisClient.isReady) {
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        console.log('Serving articles by author and status from Redis cache');
        return res.status(200).json(JSON.parse(cachedData));
      }
    }

    // Validate status
    const validStatuses = ['draft', 'scheduled', 'published'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    // Search by author name, ensuring spaces are handled correctly
    const authors = await Author.find({
      $or: [
        { firstName: new RegExp(authorName, 'i') },
        { lastName: new RegExp(authorName, 'i') },
        { fullName: new RegExp(authorName, 'i') }
      ],
    }).select('_id');

    if (!authors.length) {
      return res.status(404).json({ success: false, error: 'Author not found' });
    }

    const authorIds = authors.map((author) => author._id);

    // Pagination calculation
    const skip = (page - 1) * limit;

    // Fetch articles by author IDs and status with pagination
    const articles = await Article.find({
      selectedAuthors: { $in: authorIds },
      status: status,
    })
    .sort({ createdAt: -1 }) 
      .skip(skip)
      .limit(limit)
      .select('-content')
      .populate({
        path: 'selectedTags',
        model: 'Tag',
        select: '_id name',
      })
      .populate({
        path: 'selectedAuthors',
        model: 'Author',
        select: 'firstName lastName',
      })
      .populate({
        path: 'category',
        model: 'Category',
        select: '_id name',
      });

    const totalCount = await Article.countDocuments({
      selectedAuthors: { $in: authorIds },
      status: status,
    });

    const responseData = {
      success: true,
      data: articles.map((article) => ({
        ...article._doc,
        selectedAuthors: article.selectedAuthors.map(
          (author) => `${author.firstName} ${author.lastName}`
        ),
        selectedTags: article.selectedTags.map((tag) => ({
          id: tag._id,
          name: tag.name,
        })),
        category: {
          _id: article.category._id,
          name: article.category.name,
        },
      })),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };

    // Cache for 5 minutes
    if (redisClient.isReady) {
      await redisClient.setEx(cacheKey, 300, JSON.stringify(responseData));
    }

    res.status(200).json(responseData);
  } catch (error) {
    console.error('Error getting articles by authors and status:', error);
    res.status(500).json({ success: false, error: 'Error getting articles by authors and status' });
  }
};

module.exports = {
  createArticle,
  updateArticle,
  getAllArticles,
  getArticleById,
  getTagsByArticleId,
  getAuthorsByArticleId,
  deleteArticleById,
  getTrendingArticles,
  getArticleByIdWithMoreViews,
  incrementViewsById,
  getShareCountById,
  getTotalViewsById,
  getTotalUniqueLocations,
  getLocationById,
  updateShareCountById,
  getArticleByStatus,
  getArticlesByCategory,
  getArticlesByCategoryWithStatus,
  getArticlesByTagWithStatus,
  getArticlesByAuthorsWithStatus,
  clearArticleCaches, 
  redisClient, 
};