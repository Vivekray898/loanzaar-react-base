// Firebase Authentication Middleware
// Verifies Firebase ID tokens - replaces JWT authentication

import admin from '../config/firebaseMessagingAdmin.js';

/**
 * Middleware to verify Firebase ID token
 * Attaches decoded user info to req.user
 */
const verifyFirebaseToken = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No authorization token provided'
      });
    }
    
    const idToken = authHeader.split('Bearer ')[1];
    
    // Verify token with Firebase Admin
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    // Attach user info to request
    req.user = {
      userId: decodedToken.uid,          // Use userId for consistency with existing code
      uid: decodedToken.uid,              // Also keep uid for Firebase compatibility
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified || false,
      name: decodedToken.name || '',
      phoneNumber: decodedToken.phone_number || '',
      firebaseToken: decodedToken
    };
    
    console.log(`✅ Firebase auth successful: ${decodedToken.email}`);
    next();
  } catch (error) {
    console.error('❌ Firebase token verification error:', error.message);
    
    // Handle specific Firebase auth errors
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please login again.'
      });
    }
    
    if (error.code === 'auth/argument-error') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token format'
      });
    }
    
    return res.status(401).json({
      success: false,
      message: 'Authentication failed',
      error: error.message
    });
  }
};

/**
 * Optional Firebase authentication - doesn't fail if no token
 */
const optionalFirebaseAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const idToken = authHeader.split('Bearer ')[1];
      const decodedToken = await verifyIdToken(idToken);
      
      if (decodedToken.success) {
        req.user = {
          uid: decodedToken.uid,
          email: decodedToken.email,
          emailVerified: decodedToken.emailVerified
        };
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

export {
  verifyFirebaseToken,
  optionalFirebaseAuth
};
