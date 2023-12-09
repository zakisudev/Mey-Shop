import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import User from '../models/userModel.js';

// Protect routes
const protect = asyncHandler(async (req, res, next) => {
  let token;

  token = req.cookies.jwt;
  // Check if token exists and starts with Bearer
  if (token) {
    try {
      // Decode token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find user by id from decoded token
      req.user = await User.findById(decoded.userId).select('-password');

      // Call next middleware
      next();
    } catch (error) {
      // Return error if token is invalid
      console.error(error);
      res.status(401);
      throw new Error('Unauthorized access, invalid token');
    }
  }

  // Return error if token does not exist
  if (!token) {
    res.status(401);
    throw new Error('Unauthorized access, no token');
  }
});

// Admin middleware
const admin = (req, res, next) => {
  // Check if user is admin
  if (req.user && req.user.isAdmin) {
    // Call next middleware
    next();
  } else {
    // Return error if user is not admin
    res.status(401);
    throw new Error('Unauthorized access, not Admin');
  }
};

export { protect, admin };
