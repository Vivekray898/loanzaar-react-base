// Firebase Admin SDK Configuration
import admin from 'firebase-admin';

// Initialize Firebase Admin with service account
// Note: For production, use a service account key JSON file
// For now, initializing without explicit credentials (uses Application Default Credentials)
try {
  admin.initializeApp({
    projectId: 'loanzaar-70afe'
  });
  
  console.log('✅ Firebase Admin initialized successfully');
} catch (error) {
  console.error('❌ Firebase Admin initialization error:', error.message);
}

const auth = admin.auth();

/**
 * Verify Firebase ID Token
 * @param {string} idToken - Firebase ID token from client
 * @returns {Promise<Object>} Decoded token with user info
 */
const verifyIdToken = async (idToken) => {
  try {
    console.log('🔍 Firebase Admin: Verifying token...');
    const decodedToken = await auth.verifyIdToken(idToken);
    console.log('✅ Firebase Admin: Token verified, UID:', decodedToken.uid);
    return {
      success: true,
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified
    };
  } catch (error) {
    console.error('❌ Firebase token verification error:', error.message || error);
    console.error('Error code:', error.code);
    console.error('Error details:', error);
    return {
      success: false,
      message: error.message || 'Invalid or expired token',
      error: error
    };
  }
};

/**
 * Get User by UID
 * @param {string} uid - Firebase user UID
 * @returns {Promise<Object>} User record
 */
const getUserByUID = async (uid) => {
  try {
    const userRecord = await auth.getUser(uid);
    return {
      success: true,
      user: userRecord
    };
  } catch (error) {
    console.error('Firebase get user error:', error);
    throw {
      success: false,
      message: 'User not found'
    };
  }
};

/**
 * Delete User by UID
 * @param {string} uid - Firebase user UID
 * @returns {Promise<Object>}
 */
const deleteUser = async (uid) => {
  try {
    await auth.deleteUser(uid);
    return {
      success: true,
      message: 'User deleted successfully'
    };
  } catch (error) {
    console.error('Firebase delete user error:', error);
    throw {
      success: false,
      message: 'Error deleting user'
    };
  }
};

export {
  admin,
  auth,
  verifyIdToken,
  getUserByUID,
  deleteUser
};
