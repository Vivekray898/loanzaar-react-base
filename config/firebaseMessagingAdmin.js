// Firebase Admin SDK for Cloud Messaging and Firestore
// Initialized separately for sending notifications from backend and managing temporary data

import admin from 'firebase-admin';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

let adminInitialized = false;
let firestoreDb = null;

try {
  // Load service account from environment variable
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT environment variable not found');
  }
  
  console.log('🔍 Loading Firebase service account from environment variables');
  
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  
  // Replace escaped newlines with actual newlines in the private key
  if (serviceAccount.private_key) {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
  }
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id
  });
  
  // Initialize Firestore
  firestoreDb = admin.firestore();
  
  adminInitialized = true;
  console.log('✅ Firebase Admin SDK initialized successfully for FCM');
  console.log('✅ Firestore initialized successfully');
  console.log('📡 Project ID:', serviceAccount.project_id);
} catch (error) {
  console.warn('⚠️  Firebase Admin SDK initialization failed:', error.message);
  console.warn('📌 FCM notifications will not work until FIREBASE_SERVICE_ACCOUNT is set in .env');
  console.warn('📖 Add FIREBASE_SERVICE_ACCOUNT={your-service-account-json} to .env file');
}

/**
 * Send notification to a specific FCM topic
 * @param {string} topic - Topic name (e.g., 'admin_notifications' or 'user_123')
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {Object} data - Additional data payload
 * @returns {Promise<string>} Message ID
 */
export const sendNotificationToTopic = async (topic, title, body, data = {}) => {
  if (!adminInitialized) {
    throw new Error('Firebase Admin SDK not initialized. Check service account configuration.');
  }
  
  try {
    const message = {
      notification: {
        title,
        body
      },
      data: {
        ...data,
        clickAction: 'FLUTTER_NOTIFICATION_CLICK' // For mobile apps
      },
      topic
    };
    
    console.log(`📤 Sending notification to topic: ${topic}`);
    const response = await admin.messaging().send(message);
    console.log(`✅ Notification sent successfully. Message ID: ${response}`);
    
    return response;
  } catch (error) {
    console.error(`❌ Error sending notification to topic ${topic}:`, error);
    throw error;
  }
};

/**
 * Send notification to a specific device token
 * @param {string} token - FCM device token
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {Object} data - Additional data payload
 * @returns {Promise<string>} Message ID
 */
export const sendNotificationToDevice = async (token, title, body, data = {}) => {
  if (!adminInitialized) {
    throw new Error('Firebase Admin SDK not initialized. Check service account configuration.');
  }
  
  try {
    const message = {
      notification: {
        title,
        body
      },
      data: {
        ...data,
        clickAction: 'FLUTTER_NOTIFICATION_CLICK'
      },
      token
    };
    
    console.log(`📤 Sending notification to device`);
    const response = await admin.messaging().send(message);
    console.log(`✅ Notification sent successfully. Message ID: ${response}`);
    
    return response;
  } catch (error) {
    console.error(`❌ Error sending notification to device:`, error);
    throw error;
  }
};

/**
 * Subscribe device token to a topic
 * @param {string} token - FCM device token
 * @param {string} topic - Topic name
 * @returns {Promise<Object>} Subscription response
 */
export const subscribeToTopic = async (token, topic) => {
  if (!adminInitialized) {
    throw new Error('Firebase Admin SDK not initialized. Check service account configuration.');
  }
  
  try {
    console.log(`📡 Subscribing token to topic: ${topic}`);
    const response = await admin.messaging().subscribeToTopic(token, topic);
    console.log(`✅ Subscribed to topic ${topic}:`, response);
    return response;
  } catch (error) {
    console.error(`❌ Error subscribing to topic ${topic}:`, error);
    throw error;
  }
};

/**
 * Unsubscribe device token from a topic
 * @param {string} token - FCM device token
 * @param {string} topic - Topic name
 * @returns {Promise<Object>} Unsubscription response
 */
export const unsubscribeFromTopic = async (token, topic) => {
  if (!adminInitialized) {
    throw new Error('Firebase Admin SDK not initialized. Check service account configuration.');
  }
  
  try {
    console.log(`📡 Unsubscribing token from topic: ${topic}`);
    const response = await admin.messaging().unsubscribeFromTopic(token, topic);
    console.log(`✅ Unsubscribed from topic ${topic}:`, response);
    return response;
  } catch (error) {
    console.error(`❌ Error unsubscribing from topic ${topic}:`, error);
    throw error;
  }
};

/**
 * Check if Firebase Admin is initialized
 * @returns {boolean}
 */
export const isAdminInitialized = () => adminInitialized;

/**
 * Get Firestore database instance
 * @returns {admin.firestore.Firestore}
 */
export const getFirestore = () => {
  if (!adminInitialized || !firestoreDb) {
    throw new Error('Firestore not initialized. Check Firebase Admin configuration.');
  }
  return firestoreDb;
};

/**
 * Verify Firebase ID Token
 * @param {string} idToken - Firebase ID token from client
 * @returns {Promise<Object>} Decoded token with user info
 */
export const verifyIdToken = async (idToken) => {
  try {
    console.log('🔍 Firebase Admin: Verifying token...');
    const decodedToken = await admin.auth().verifyIdToken(idToken);
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
export const getUserByUID = async (uid) => {
  try {
    const userRecord = await admin.auth().getUser(uid);
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

export default admin;
