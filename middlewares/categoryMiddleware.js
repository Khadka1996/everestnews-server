
// middlewares/categoryMiddleware.js
const validateCategory = (req, res, next) => {
    const { name } = req.body;
  
    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Category name is required' });
    }
  
    next();
  };
  
  module.exports = { validateCategory };