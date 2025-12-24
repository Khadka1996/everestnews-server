// middlewares/tagMiddleware.js

const { body, validationResult } = require('express-validator');

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

module.exports = { validateTag };