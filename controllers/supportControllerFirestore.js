// Support Controller - Firestore Implementation
// Handles all support chat operations using Firestore
// Collections:
// - support_chats: Thread documents with userId, subject, createdAt, lastMessage, status
// - support_chats/{threadId}/messages: Message subcollection with senderType, text, timestamp, seen

import admin from 'firebase-admin';
import { sendSupportMessageNotification } from '../services/notificationService.js';

const db = admin.firestore();
const SUPPORT_CHATS_COLLECTION = 'support_chats';

/**
 * Send a support message (create new thread or add to existing thread)
 * @route POST /api/support/send
 */
export const sendSupportMessage = async (req, res) => {
  try {
    const { userId, subject, message, threadId, senderType = 'user', senderName, senderEmail } = req.body;

    console.log('📤 Sending support message:', { userId, subject, threadId, senderType });

    // Validate required fields
    if (!userId || !message) {
      return res.status(400).json({
        success: false,
        message: 'userId and message are required'
      });
    }

    let actualThreadId = threadId;
    const timestamp = admin.firestore.FieldValue.serverTimestamp();

    // If threadId not provided, create new thread
    if (!actualThreadId) {
      if (!subject) {
        return res.status(400).json({
          success: false,
          message: 'subject is required for new threads'
        });
      }

      // Create new thread document
      const threadRef = db.collection(SUPPORT_CHATS_COLLECTION).doc();
      actualThreadId = threadRef.id;

      const threadData = {
        userId,
        userName: senderName || 'User',
        userEmail: senderEmail || '',
        subject,
        status: 'New',
        createdAt: timestamp,
        lastMessage: message.substring(0, 100),
        lastMessageAt: timestamp,
        lastMessageSenderType: senderType,
        messageCount: 1,
        seen: false
      };

      await threadRef.set(threadData);
      console.log(`✅ New thread created: ${actualThreadId}`);
    }

    // Add message to thread's messages subcollection
    const messagesRef = db
      .collection(SUPPORT_CHATS_COLLECTION)
      .doc(actualThreadId)
      .collection('messages');

    const messageData = {
      senderType,
      senderName: senderName || 'User',
      senderEmail: senderEmail || '',
      text: message,
      timestamp,
      seen: false
    };

    const messageRef = await messagesRef.add(messageData);
    console.log(`✅ Message saved to thread ${actualThreadId}: ${messageRef.id}`);

    // Update thread with last message info
    const threadRef = db.collection(SUPPORT_CHATS_COLLECTION).doc(actualThreadId);
    
    await threadRef.update({
      lastMessage: message.substring(0, 100),
      lastMessageAt: timestamp,
      lastMessageSenderType: senderType,
      messageCount: admin.firestore.FieldValue.increment(1),
      // If user replied after admin, reset status to 'New'
      ...(senderType === 'user' && { status: 'New' })
    });

    console.log(`✅ Thread updated: ${actualThreadId}`);

    // 🔔 Send FCM notification
    try {
      await sendSupportMessageNotification(
        actualThreadId,
        message,
        senderType,
        senderName || 'User'
      );
    } catch (notifyError) {
      console.warn('⚠️ Failed to send notification:', notifyError.message);
      // Don't fail the request if notification fails
    }

    res.status(201).json({
      success: true,
      message: 'Support message sent successfully',
      data: {
        messageId: messageRef.id,
        threadId: actualThreadId,
        timestamp
      }
    });

  } catch (error) {
    console.error('❌ Error sending support message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send support message',
      error: error.message
    });
  }
};

/**
 * Get all support threads for admin
 * @route GET /api/support/threads
 */
export const getSupportThreads = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, userId } = req.query;
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    console.log(`📋 Fetching support threads: page=${pageNum}, limit=${limitNum}, status=${status}, userId=${userId}`);

    let query = db.collection(SUPPORT_CHATS_COLLECTION).orderBy('lastMessageAt', 'desc');

    // Apply filters
    if (status) {
      query = query.where('status', '==', status);
    }
    if (userId) {
      query = query.where('userId', '==', userId);
    }

    // Get total count
    const countSnapshot = await query.count().get();
    const total = countSnapshot.data().count;

    // Get paginated results
    const snapshot = await query.limit(limitNum).offset(skip).get();
    const threads = [];

    snapshot.forEach(doc => {
      threads.push({
        _id: doc.id,
        ...doc.data(),
        // Convert Firestore timestamps to ISO strings
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
        lastMessageAt: doc.data().lastMessageAt?.toDate?.()?.toISOString() || null
      });
    });

    res.status(200).json({
      success: true,
      data: threads,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum)
      }
    });

  } catch (error) {
    console.error('❌ Error fetching support threads:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch support threads',
      error: error.message
    });
  }
};

/**
 * Get messages in a specific thread
 * @route GET /api/support/thread/:threadId
 */
export const getSupportThread = async (req, res) => {
  try {
    const { threadId } = req.params;

    console.log(`📖 Fetching thread: ${threadId}`);

    const threadDoc = await db.collection(SUPPORT_CHATS_COLLECTION).doc(threadId).get();

    if (!threadDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Thread not found'
      });
    }

    // Get messages
    const messagesSnapshot = await db
      .collection(SUPPORT_CHATS_COLLECTION)
      .doc(threadId)
      .collection('messages')
      .orderBy('timestamp', 'asc')
      .get();

    const messages = [];
    messagesSnapshot.forEach(doc => {
      messages.push({
        _id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || null
      });
    });

    res.status(200).json({
      success: true,
      data: {
        thread: {
          _id: threadDoc.id,
          ...threadDoc.data(),
          createdAt: threadDoc.data().createdAt?.toDate?.()?.toISOString() || null,
          lastMessageAt: threadDoc.data().lastMessageAt?.toDate?.()?.toISOString() || null
        },
        messages
      }
    });

  } catch (error) {
    console.error('❌ Error fetching thread:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch thread',
      error: error.message
    });
  }
};

/**
 * Get support threads for a specific user
 * @route GET /api/support/user/:userId/threads
 */
export const getUserSupportThreads = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20 } = req.query;

    console.log(`📋 Fetching threads for user: ${userId}`);

    const snapshot = await db
      .collection(SUPPORT_CHATS_COLLECTION)
      .where('userId', '==', userId)
      .orderBy('lastMessageAt', 'desc')
      .limit(parseInt(limit))
      .get();

    const threads = [];
    snapshot.forEach(doc => {
      threads.push({
        _id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
        lastMessageAt: doc.data().lastMessageAt?.toDate?.()?.toISOString() || null
      });
    });

    console.log(`✅ Found ${threads.length} threads for user ${userId}`);

    res.status(200).json({
      success: true,
      data: threads
    });

  } catch (error) {
    console.error('❌ Error fetching user threads:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user threads',
      error: error.message
    });
  }
};

/**
 * Reply to support thread (admin)
 * @route POST /api/support/reply
 */
export const replySupportMessage = async (req, res) => {
  try {
    const { threadId, message, adminName, adminEmail } = req.body;

    if (!threadId || !message) {
      return res.status(400).json({
        success: false,
        message: 'threadId and message are required'
      });
    }

    console.log(`💬 Admin replying to thread: ${threadId}`);

    const threadRef = db.collection(SUPPORT_CHATS_COLLECTION).doc(threadId);
    const threadDoc = await threadRef.get();

    if (!threadDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Thread not found'
      });
    }

    const timestamp = admin.firestore.FieldValue.serverTimestamp();

    // Add admin message to messages subcollection
    const messageRef = await threadRef.collection('messages').add({
      senderType: 'admin',
      senderName: adminName || 'Admin',
      senderEmail: adminEmail || '',
      text: message,
      timestamp,
      seen: false
    });

    // Update thread status to 'Replied'
    await threadRef.update({
      status: 'Replied',
      lastMessage: message.substring(0, 100),
      lastMessageAt: timestamp,
      lastMessageSenderType: 'admin',
      messageCount: admin.firestore.FieldValue.increment(1)
    });

    console.log(`✅ Admin reply added to thread ${threadId}`);

    res.status(201).json({
      success: true,
      message: 'Reply sent successfully',
      data: {
        messageId: messageRef.id,
        threadId
      }
    });

  } catch (error) {
    console.error('❌ Error replying to thread:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send reply',
      error: error.message
    });
  }
};

/**
 * Close a support thread
 * @route PATCH /api/support/thread/:threadId/close
 */
export const closeSupportThread = async (req, res) => {
  try {
    const { threadId } = req.params;
    const { reason } = req.body || {};

    console.log(`🔒 Closing thread: ${threadId}`);

    const threadRef = db.collection(SUPPORT_CHATS_COLLECTION).doc(threadId);
    
    // Check if thread exists before updating
    const threadDoc = await threadRef.get();
    if (!threadDoc.exists) {
      console.warn(`⚠️ Thread not found: ${threadId}`);
      return res.status(404).json({
        success: false,
        message: 'Thread not found'
      });
    }

    await threadRef.update({
      status: 'Closed',
      closedAt: admin.firestore.FieldValue.serverTimestamp(),
      closedReason: reason || 'Closed by admin'
    });

    console.log(`✅ Thread closed: ${threadId}`);

    res.status(200).json({
      success: true,
      message: 'Thread closed successfully'
    });

  } catch (error) {
    console.error('❌ Error closing thread:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to close thread',
      error: error.message
    });
  }
};

/**
 * Get unread message count for admin
 * @route GET /api/support/unread-count
 */
export const getUnreadCount = async (req, res) => {
  try {
    const snapshot = await db
      .collection(SUPPORT_CHATS_COLLECTION)
      .where('status', '==', 'New')
      .count()
      .get();

    const count = snapshot.data().count;

    res.status(200).json({
      success: true,
      data: { unreadCount: count }
    });

  } catch (error) {
    console.error('❌ Error fetching unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unread count',
      error: error.message
    });
  }
};

/**
 * Soft delete a thread (by admin or user)
 * @route PATCH /api/support/ticket/:ticketId/delete
 */
export const deleteTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { deletedBy = 'user' } = req.body;

    if (!ticketId) {
      return res.status(400).json({ success: false, message: 'Ticket ID is required' });
    }

    console.log(`🗑️  Deleting thread: ${ticketId} by ${deletedBy}`);

    const threadRef = db.collection(SUPPORT_CHATS_COLLECTION).doc(ticketId);
    
    // Verify thread exists before deleting
    const threadDoc = await threadRef.get();
    if (!threadDoc.exists) {
      return res.status(404).json({ success: false, message: 'Thread not found' });
    }

    if (deletedBy === 'admin') {
      await threadRef.update({
        deletedByAdmin: true,
        deletedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } else {
      await threadRef.update({
        deletedByUser: true,
        deletedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    console.log(`✅ Thread soft deleted: ${ticketId}`);

    res.status(200).json({
      success: true,
      message: 'Thread deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting thread:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete thread',
      error: error.message
    });
  }
};
