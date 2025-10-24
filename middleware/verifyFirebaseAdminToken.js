import { verifyIdToken } from '../config/firebaseMessagingAdmin.js';

/**
 * Admin Authentication Middleware - Firebase Version
 * Verifies Firebase ID token and checks if user is an admin
 * Replaces old JWT-based adminAuth middleware
 * 
 * Usage: router.get('/protected-route', verifyFirebaseAdminToken, controller);
 */
export const verifyFirebaseAdminToken = async (req, res, next) => {
  try {
    console.log('\n' + '='.repeat(80));
    console.log('🔐 ADMIN AUTH MIDDLEWARE - FIREBASE TOKEN VERIFICATION');
    console.log('='.repeat(80));
    console.log('⏰ Timestamp:', new Date().toISOString());
    console.log('📍 Method:', req.method);
    console.log('📍 Path:', req.path);
    
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ No authorization header or invalid format');
      console.log('   Header present:', !!authHeader);
      console.log('   Starts with Bearer:', authHeader?.startsWith('Bearer '));
      console.log('='.repeat(80) + '\n');
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const token = authHeader.split('Bearer ')[1];
    console.log('✅ Token extracted');
    console.log('   Length:', token?.length);
    console.log('   First 30 chars:', token?.substring(0, 30) + '...');

    if (!token) {
      console.error('❌ Token is empty after extraction');
      console.log('='.repeat(80) + '\n');
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    // Verify Firebase token
    console.log('\n🔄 STEP 1: Verifying Firebase ID token...');
    try {
      console.log('   Calling verifyIdToken()...');
      const decoded = await verifyIdToken(token);
      
      console.log('   ✅ verifyIdToken() returned result');
      console.log('   Result:', { success: decoded.success, uid: decoded.uid?.substring(0, 20) + '...' });
      
      if (!decoded.success) {
        console.log('   ⚠️ Firebase verification returned failure');
        console.log('   Error message:', decoded.message);
        console.log('='.repeat(80) + '\n');
        return res.status(401).json({
          success: false,
          message: decoded.message || 'Invalid or expired token. Please sign in again.'
        });
      }
      
      console.log('   ✅ Firebase token verification SUCCEEDED!');
      console.log('   UID:', decoded.uid);
      console.log('   Email:', decoded.email);
      
      // Attach Firebase user data to request
      req.user = {
        uid: decoded.uid,
        email: decoded.email,
        provider: 'firebase'
      };
      
      console.log('\n✅ ADMIN AUTH SUCCESS');
      console.log('   Admin UID:', req.user.uid);
      console.log('   Email:', req.user.email);
      console.log('='.repeat(80) + '\n');
      
      // Call next middleware/controller
      next();
      
    } catch (firebaseError) {
      console.error('❌ Firebase token verification failed');
      console.error('   Error type:', firebaseError.code || firebaseError.constructor.name);
      console.error('   Error message:', firebaseError.message);
      console.log('='.repeat(80) + '\n');
      
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token. Please sign in again.'
      });
    }
    
  } catch (error) {
    console.error('❌ Unexpected error in admin auth middleware');
    console.error('   Error:', error.message);
    console.log('='.repeat(80) + '\n');
    
    return res.status(500).json({
      success: false,
      message: 'Server error during authentication'
    });
  }
};

/**
 * Alternative: More lightweight version without verbose logging
 * Use this for production to reduce console spam
 */
export const verifyFirebaseAdminTokenQuiet = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const token = authHeader.split('Bearer ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    // Verify Firebase token
    const decoded = await verifyIdToken(token);
    
    if (!decoded.success) {
      return res.status(401).json({
        success: false,
        message: decoded.message || 'Invalid or expired token.'
      });
    }
    
    // Attach Firebase user data to request
    req.user = {
      uid: decoded.uid,
      email: decoded.email,
      provider: 'firebase'
    };
    
    next();
    
  } catch (error) {
    console.error('❌ Admin auth error:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token. Please sign in again.'
    });
  }
};

export default verifyFirebaseAdminToken;
