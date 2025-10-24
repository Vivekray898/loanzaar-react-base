// Firestore Service for Temporary Data Management
// Handles temporary submissions in data_tmp collection before MongoDB migration

import { getFirestore } from '../config/firebaseMessagingAdmin.js';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Add a new document to data_tmp collection
 * @param {string} type - Document type: 'loan', 'insurance', 'ticket', 'chat'
 * @param {string} userId - Firebase Auth user ID
 * @param {Object} formData - Form submission data
 * @param {string} status - Document status (default: 'pending')
 * @returns {Promise<string>} Document ID
 */
export const addTempData = async (type, userId, formData, status = 'pending') => {
  try {
    const db = getFirestore();
    const docRef = await db.collection('data_tmp').add({
      type,
      userId,
      formData,
      status,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });
    
    console.log(`✅ Added ${type} to data_tmp:`, docRef.id);
    return docRef.id;
  } catch (error) {
    console.error(`❌ Error adding ${type} to data_tmp:`, error);
    throw error;
  }
};

/**
 * Get all pending documents of a specific type
 * @param {string} type - Document type filter
 * @returns {Promise<Array>} Array of documents
 */
export const getPendingDataByType = async (type) => {
  try {
    const db = getFirestore();
    const snapshot = await db.collection('data_tmp')
      .where('type', '==', type)
      .where('status', '==', 'pending')
      .orderBy('createdAt', 'desc')
      .get();
    
    const docs = [];
    snapshot.forEach(doc => {
      docs.push({ id: doc.id, ...doc.data() });
    });
    
    console.log(`📋 Found ${docs.length} pending ${type} documents`);
    return docs;
  } catch (error) {
    console.error(`❌ Error fetching pending ${type}:`, error);
    throw error;
  }
};

/**
 * Get all documents for a specific user
 * @param {string} userId - Firebase Auth user ID
 * @returns {Promise<Array>} Array of user's documents
 */
export const getUserData = async (userId) => {
  try {
    const db = getFirestore();
    const snapshot = await db.collection('data_tmp')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();
    
    const docs = [];
    snapshot.forEach(doc => {
      docs.push({ id: doc.id, ...doc.data() });
    });
    
    console.log(`📋 Found ${docs.length} documents for user ${userId}`);
    return docs;
  } catch (error) {
    console.error(`❌ Error fetching user data:`, error);
    throw error;
  }
};

/**
 * Get a single document by ID
 * @param {string} docId - Document ID
 * @returns {Promise<Object>} Document data
 */
export const getTempDataById = async (docId) => {
  try {
    const db = getFirestore();
    const doc = await db.collection('data_tmp').doc(docId).get();
    
    if (!doc.exists) {
      throw new Error(`Document ${docId} not found`);
    }
    
    return { id: doc.id, ...doc.data() };
  } catch (error) {
    console.error(`❌ Error fetching document ${docId}:`, error);
    throw error;
  }
};

/**
 * Update document status
 * @param {string} docId - Document ID
 * @param {string} newStatus - New status: 'pending', 'approved', 'rejected', 'processing'
 * @param {Object} additionalData - Additional fields to update
 * @returns {Promise<void>}
 */
export const updateTempDataStatus = async (docId, newStatus, additionalData = {}) => {
  try {
    const db = getFirestore();
    await db.collection('data_tmp').doc(docId).update({
      status: newStatus,
      updatedAt: FieldValue.serverTimestamp(),
      ...additionalData
    });
    
    console.log(`✅ Updated document ${docId} status to: ${newStatus}`);
  } catch (error) {
    console.error(`❌ Error updating document ${docId}:`, error);
    throw error;
  }
};

/**
 * Delete document from data_tmp (after migration to MongoDB)
 * @param {string} docId - Document ID
 * @returns {Promise<void>}
 */
export const deleteTempData = async (docId) => {
  try {
    const db = getFirestore();
    await db.collection('data_tmp').doc(docId).delete();
    
    console.log(`✅ Deleted document ${docId} from data_tmp`);
  } catch (error) {
    console.error(`❌ Error deleting document ${docId}:`, error);
    throw error;
  }
};

/**
 * Get all chat messages for a thread
 * @param {string} threadId - Thread/conversation ID
 * @returns {Promise<Array>} Array of chat messages
 */
export const getChatMessages = async (threadId) => {
  try {
    const db = getFirestore();
    const snapshot = await db.collection('data_tmp')
      .where('type', '==', 'chat')
      .where('formData.threadId', '==', threadId)
      .orderBy('createdAt', 'asc')
      .get();
    
    const messages = [];
    snapshot.forEach(doc => {
      messages.push({ id: doc.id, ...doc.data() });
    });
    
    console.log(`💬 Found ${messages.length} messages in thread ${threadId}`);
    return messages;
  } catch (error) {
    console.error(`❌ Error fetching chat messages:`, error);
    throw error;
  }
};

/**
 * Add a chat message to data_tmp
 * @param {string} userId - Firebase Auth user ID
 * @param {string} threadId - Thread/conversation ID
 * @param {string} message - Message text
 * @param {string} senderType - 'user' or 'admin'
 * @returns {Promise<string>} Document ID
 */
export const addChatMessage = async (userId, threadId, message, senderType) => {
  try {
    const db = getFirestore();
    const docRef = await db.collection('data_tmp').add({
      type: 'chat',
      userId,
      formData: {
        threadId,
        message,
        senderType,
        read: false
      },
      status: 'active',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });
    
    console.log(`💬 Added chat message to thread ${threadId}:`, docRef.id);
    return docRef.id;
  } catch (error) {
    console.error(`❌ Error adding chat message:`, error);
    throw error;
  }
};

/**
 * Get statistics for admin dashboard
 * @returns {Promise<Object>} Statistics object
 */
export const getTempDataStats = async () => {
  try {
    const db = getFirestore();
    const snapshot = await db.collection('data_tmp')
      .where('status', '==', 'pending')
      .get();
    
    const stats = {
      total: snapshot.size,
      loans: 0,
      insurances: 0,
      tickets: 0,
      chats: 0
    };
    
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.type === 'loan') stats.loans++;
      else if (data.type === 'insurance') stats.insurances++;
      else if (data.type === 'ticket') stats.tickets++;
      else if (data.type === 'chat') stats.chats++;
    });
    
    console.log('📊 Temp data statistics:', stats);
    return stats;
  } catch (error) {
    console.error('❌ Error fetching statistics:', error);
    throw error;
  }
};

export default {
  addTempData,
  getPendingDataByType,
  getUserData,
  getTempDataById,
  updateTempDataStatus,
  deleteTempData,
  getChatMessages,
  addChatMessage,
  getTempDataStats
};
