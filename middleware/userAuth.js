import User from '../models/User.js';
import { verifyIdToken } from '../config/firebaseMessagingAdmin.js';

/**
 * User Authentication Middleware
 * Protects routes that require user to be logged in
 * Uses Firebase Authentication only
 */
export const userAuth = async (req, res, next) => {
  try {
    console.log('\n' + '='.repeat(80));
    console.log('🔐 USER AUTH MIDDLEWARE - NEW REQUEST');
    console.log('='.repeat(80));
    console.log('⏰ Timestamp:', new Date().toISOString());
    console.log('📍 Method:', req.method);
    console.log('📍 Path:', req.path);
    console.log('📝 Full Authorization header:', req.headers.authorization?.substring(0, 100) + (req.headers.authorization?.length > 100 ? '...' : ''));
    
    // Get token from header
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

    let decoded;
    let user;

    // Try Firebase token first
    console.log('\n🔄 STEP 1: Attempting Firebase token verification...');
    try {
      console.log('   Calling verifyIdToken()...');
      decoded = await verifyIdToken(token);
      
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
      
      // Find user by firebaseUID
      console.log('\n🔄 STEP 2: Looking up user in MongoDB by firebaseUID...');
      user = await User.findOne({ firebaseUID: decoded.uid }).select('-password');
      
      if (!user) {
        console.error('   ❌ User not found with firebaseUID:', decoded.uid);
        console.log('   Checking all users in database...');
        const allUsers = await User.find({}, { firebaseUID: 1, email: 1, name: 1 }).limit(10);
        console.log('   📊 Sample users in DB:', allUsers.map(u => ({
          id: u._id,
          firebaseUID: u.firebaseUID?.substring(0, 20) + '...',
          email: u.email,
          name: u.name
        })));
        
        console.log('='.repeat(80) + '\n');
        return res.status(401).json({
          success: false,
          message: 'User profile not found. Please complete your profile after signup.',
          firebaseUID: decoded.uid,
          userEmail: decoded.email
        });
      }

      console.log('   ✅ User found in MongoDB!');
      console.log('   User ID:', user._id);
      console.log('   User Email:', user.email);
      console.log('   User Name:', user.name);

      // Attach user to request
      req.user = {
        id: user._id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        firebaseUID: decoded.uid
      };

      console.log('\n✅ AUTHENTICATION SUCCESSFUL (Firebase)');
      console.log('   User:', req.user.email);
      console.log('='.repeat(80) + '\n');
      return next();
      
    } catch (firebaseError) {
      console.log('   ⚠️ Firebase verification threw exception');
      console.log('   Error:', firebaseError?.message || firebaseError);
      console.log('='.repeat(80) + '\n');
      return res.status(401).json({
        success: false,
        message: 'Authentication failed. Please sign in again.'
      });
    }
  } catch (error) {
    console.error('\n❌ UNEXPECTED ERROR IN AUTH MIDDLEWARE');
    console.error('   Error:', error.message);
    console.error('   Stack:', error.stack);
    console.log('='.repeat(80) + '\n');
    return res.status(401).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};
