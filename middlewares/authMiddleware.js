const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  try {
    // Check for JWT token in request headers
    const token = req.header('Authorization');

    // If token not found, return unauthorized
    if (!token) {
      console.log('No token found');
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Verify token
    const decoded = jwt.verify(token.split(' ')[1], process.env.JWT_SECRET); // Extract token from 'Bearer <token>'

    // Log decoded token payload
    console.log('Decoded token payload:', decoded);

    // Attach user data to request object
    req.user = decoded.user;

    // Check user role
    // if (req.user.role !== 'admin') {
    //   console.log('User is not authorized to access this resource');
    //   return res.status(403).json({ message: 'Forbidden' });
    // }

    // Call next middleware
    console.log('User authorized');
    next();
  } catch (error) {
    // If token is invalid, return unauthorized
    console.log('Invalid token:', error.message);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = authMiddleware;