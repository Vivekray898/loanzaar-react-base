import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import admin from '../config/firebaseMessagingAdmin.js';

/**
 * Middleware to protect routes - requires valid JWT token
 */
export const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized - no token provided'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

      // Get user from token (exclude password)
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized - user not found'
        });
      }

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized - invalid token'
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error in authentication'
    });
  }
};

/**
 * Middleware to check if user is admin
 * Must be used after protect middleware
 */
export const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Access denied - admin only'
    });
  }
};

/**
 * Dual Authentication Middleware
 * Supports both Firebase ID tokens (for users) and JWT (for admins)
 * Use this for routes that need to work with both auth methods
 */
export const verifyAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No authentication token provided'
      });
    }

    const token = authHeader.split('Bearer ')[1];

    // Try Firebase Auth first (Firebase tokens are typically longer)
    if (token.length > 100) {
      try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.user = {
          uid: decodedToken.uid,
          email: decodedToken.email,
          authType: 'firebase',
          role: 'user'
        };
        return next();
      } catch (firebaseError) {
        // Not a valid Firebase token, try JWT
        console.log('Firebase auth failed, trying JWT...');
      }
    }

    // Try Admin JWT
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role || 'admin',
        authType: 'jwt'
      };
      return next();
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token'
      });
    }

  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};
