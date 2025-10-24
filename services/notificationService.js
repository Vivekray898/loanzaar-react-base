// Notification Service - Listens to Firestore changes and sends FCM notifications
// Runs on backend to automatically send notifications for support chats and loan updates

import {
  sendNotificationToTopic,
  sendNotificationToDevice,
  getFirestore
} from '../config/firebaseMessagingAdmin.js';

const db = getFirestore();

/**
 * Send notification for new support message
 * @param {string} threadId - Support chat thread ID
 * @param {string} message - Message content
 * @param {string} senderType - 'user' or 'admin'
 * @param {string} senderName - Sender's name
 * @param {Object} senderData - User/Admin data (fcmToken, etc.)
 */
export const sendSupportMessageNotification = async (
  threadId,
  message,
  senderType,
  senderName,
  senderData = {}
) => {
  try {
    // Determine who receives the notification
    let topic, title, body;

    if (senderType === 'admin') {
      // Admin sent message → notify user
      const threadDoc = await db.collection('support_chats').doc(threadId).get();
      const threadData = threadDoc.data() || {};
      
      title = '💬 New Message from Admin';
      body = message.substring(0, 60) + (message.length > 60 ? '...' : '');
      topic = `user_${threadData.userId}`;
    } else {
      // User sent message → notify admin
      title = '💬 New Message from User';
      body = `${senderName}: ${message.substring(0, 50)}...`;
      topic = 'admin_notifications';
    }

    const notificationData = {
      type: 'support_message',
      threadId,
      senderType,
      timestamp: new Date().toISOString()
    };

    console.log(`📤 Sending support message notification to ${topic}`);
    const messageId = await sendNotificationToTopic(topic, title, body, notificationData);
    
    console.log(`✅ Support notification sent: ${messageId}`);
    return messageId;
  } catch (error) {
    console.error('❌ Error sending support message notification:', error);
    throw error;
  }
};

/**
 * Send notification for support thread status change
 * @param {string} threadId - Support chat thread ID
 * @param {string} status - New status (e.g., 'closed', 'resolved')
 * @param {string} reason - Reason for closure/change
 * @param {string} userId - User ID
 */
export const sendSupportThreadStatusNotification = async (
  threadId,
  status,
  reason = '',
  userId
) => {
  try {
    let title, body;

    switch (status) {
      case 'closed':
        title = '🔒 Support Thread Closed';
        body = reason || 'Your support thread has been closed';
        break;
      case 'resolved':
        title = '✅ Issue Resolved';
        body = 'Your support issue has been marked as resolved';
        break;
      case 'reopened':
        title = '🔓 Support Thread Reopened';
        body = 'Your support thread has been reopened';
        break;
      default:
        title = '📋 Support Thread Updated';
        body = `Status changed to: ${status}`;
    }

    const notificationData = {
      type: 'support_status',
      threadId,
      status,
      timestamp: new Date().toISOString()
    };

    const topic = `user_${userId}`;
    console.log(`📤 Sending support status notification to ${topic}`);
    const messageId = await sendNotificationToTopic(topic, title, body, notificationData);
    
    console.log(`✅ Support status notification sent: ${messageId}`);
    return messageId;
  } catch (error) {
    console.error('❌ Error sending support status notification:', error);
    throw error;
  }
};

/**
 * Send notification for loan status update
 * @param {string} loanId - Loan ID
 * @param {string} userId - User ID
 * @param {string} status - New status (e.g., 'approved', 'rejected', 'pending', 'under_review')
 * @param {string} reason - Reason (optional)
 */
export const sendLoanStatusNotification = async (
  loanId,
  userId,
  status,
  reason = ''
) => {
  try {
    let title, body, emoji;

    switch (status.toLowerCase()) {
      case 'approved':
        emoji = '✅';
        title = 'Loan Approved!';
        body = 'Congratulations! Your loan has been approved.';
        break;
      case 'rejected':
        emoji = '❌';
        title = 'Application Status';
        body = 'Your loan application has been rejected. Please review the details.';
        break;
      case 'under_review':
        emoji = '🔍';
        title = 'Application Under Review';
        body = 'Your loan application is being reviewed by our team.';
        break;
      case 'pending':
        emoji = '⏳';
        title = 'Application Pending';
        body = 'Your loan application is pending. Please check back soon.';
        break;
      case 'approved_partial':
        emoji = '📊';
        title = 'Partial Approval';
        body = 'Your loan has been partially approved. Check the details for more information.';
        break;
      default:
        emoji = '📋';
        title = 'Loan Status Updated';
        body = `Status: ${status}${reason ? '. ' + reason : ''}`;
    }

    const notificationData = {
      type: 'loan_status',
      loanId,
      status,
      timestamp: new Date().toISOString()
    };

    const topic = `user_${userId}`;
    console.log(`📤 Sending loan status notification to ${topic}`);
    const messageId = await sendNotificationToTopic(topic, title, body, notificationData);
    
    console.log(`✅ Loan status notification sent: ${messageId}`);
    return messageId;
  } catch (error) {
    console.error('❌ Error sending loan status notification:', error);
    throw error;
  }
};

/**
 * Send notification for new support ticket (admin)
 * @param {string} ticketId - Ticket ID
 * @param {string} subject - Ticket subject
 * @param {string} userName - User name
 * @param {string} userId - User ID
 */
export const sendNewTicketNotification = async (
  ticketId,
  subject,
  userName,
  userId
) => {
  try {
    const title = '🎫 New Support Ticket';
    const body = `${userName}: ${subject}`;

    const notificationData = {
      type: 'new_ticket',
      ticketId,
      userId,
      timestamp: new Date().toISOString()
    };

    const topic = 'admin_notifications';
    console.log(`📤 Sending new ticket notification to ${topic}`);
    const messageId = await sendNotificationToTopic(topic, title, body, notificationData);
    
    console.log(`✅ New ticket notification sent: ${messageId}`);
    return messageId;
  } catch (error) {
    console.error('❌ Error sending new ticket notification:', error);
    throw error;
  }
};

/**
 * Send direct device notification (if user FCM token is known)
 * @param {string} fcmToken - Device FCM token
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {Object} data - Additional data
 */
export const sendDirectDeviceNotification = async (
  fcmToken,
  title,
  body,
  data = {}
) => {
  try {
    if (!fcmToken) {
      console.warn('⚠️ No FCM token provided');
      return null;
    }

    console.log(`📤 Sending direct notification to device`);
    const messageId = await sendNotificationToDevice(fcmToken, title, body, data);
    
    console.log(`✅ Direct notification sent: ${messageId}`);
    return messageId;
  } catch (error) {
    console.error('❌ Error sending direct device notification:', error);
    throw error;
  }
};

/**
 * Setup Firestore listeners for automatic notifications
 * Call this once on server startup
 */
export const setupNotificationListeners = () => {
  try {
    console.log('🔧 Setting up Firestore listeners for notifications...');

    // Listen for new support messages
    setupSupportMessageListener();

    // Listen for loan status updates
    setupLoanStatusListener();

    console.log('✅ Notification listeners set up successfully');
  } catch (error) {
    console.error('❌ Error setting up notification listeners:', error);
  }
};

/**
 * Listen to support_chats messages subcollection for new messages
 */
const setupSupportMessageListener = () => {
  try {
    // This would need to be implemented with Firestore onSnapshot
    // For now, we'll trigger this from the controller when a message is added
    console.log('📡 Support message listener ready (triggered on add)');
  } catch (error) {
    console.error('❌ Error setting up support message listener:', error);
  }
};

/**
 * Listen to loans collection for status updates
 */
const setupLoanStatusListener = () => {
  try {
    // This would need to be implemented with Firestore onSnapshot
    // For now, we'll trigger this from the controller when status changes
    console.log('📡 Loan status listener ready (triggered on update)');
  } catch (error) {
    console.error('❌ Error setting up loan status listener:', error);
  }
};

/**
 * Batch send notification to multiple users by topic
 * @param {Array<string>} topics - Array of topic names
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {Object} data - Additional data
 */
export const sendBatchNotification = async (topics, title, body, data = {}) => {
  try {
    console.log(`📤 Sending batch notification to ${topics.length} topics`);

    const promises = topics.map(topic =>
      sendNotificationToTopic(topic, title, body, data).catch(err => {
        console.error(`❌ Failed to send to topic ${topic}:`, err.message);
        return null;
      })
    );

    const results = await Promise.all(promises);
    const successCount = results.filter(r => r !== null).length;

    console.log(`✅ Batch notification sent to ${successCount}/${topics.length} topics`);
    return {
      sent: successCount,
      total: topics.length,
      messageIds: results
    };
  } catch (error) {
    console.error('❌ Error sending batch notification:', error);
    throw error;
  }
};

export default {
  sendSupportMessageNotification,
  sendSupportThreadStatusNotification,
  sendLoanStatusNotification,
  sendNewTicketNotification,
  sendDirectDeviceNotification,
  setupNotificationListeners,
  sendBatchNotification
};
