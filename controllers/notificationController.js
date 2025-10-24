// Notification Controller
// Handles FCM topic subscription, token management, and notification history

import {
  subscribeToTopic as fcmSubscribe,
  unsubscribeFromTopic as fcmUnsubscribe,
  sendNotificationToTopic as fcmSendToTopic,
  sendNotificationToDevice as fcmSendToDevice
} from '../config/firebaseMessagingAdmin.js';
import Notification from '../models/Notification.js';

// Subscribe user token to FCM topic
const subscribeToTopic = async (req, res) => {
  try {
    const { token, topic } = req.body;
    if (!token || !topic) {
      return res.status(400).json({ success: false, message: 'Token and topic are required' });
    }
    console.log(`📡 Subscribing token to topic: ${topic}`);
    const response = await fcmSubscribe(token, topic);
    console.log(`✅ Successfully subscribed to topic ${topic}`);
    res.json({ success: true, message: `Subscribed to topic: ${topic}`, response });
  } catch (error) {
    console.error('❌ Error subscribing to topic:', error);
    res.status(500).json({ success: false, message: 'Failed to subscribe to topic', error: error.message });
  }
};

// Unsubscribe user token from FCM topic
const unsubscribeFromTopic = async (req, res) => {
  try {
    const { token, topic } = req.body;
    if (!token || !topic) {
      return res.status(400).json({ success: false, message: 'Token and topic are required' });
    }
    console.log(`📡 Unsubscribing token from topic: ${topic}`);
    const response = await fcmUnsubscribe(token, topic);
    console.log(`✅ Successfully unsubscribed from topic ${topic}`);
    res.json({ success: true, message: `Unsubscribed from topic: ${topic}`, response });
  } catch (error) {
    console.error('❌ Error unsubscribing from topic:', error);
    res.status(500).json({ success: false, message: 'Failed to unsubscribe from topic', error: error.message });
  }
};

// Send notification to specific topic
const sendToTopic = async (req, res) => {
  try {
    const { topic, title, body, data } = req.body;
    if (!topic || !title || !body) {
      return res.status(400).json({ success: false, message: 'Topic, title, and body are required' });
    }
    console.log(`📤 Sending notification to topic: ${topic}`);
    const response = await fcmSendToTopic(topic, title, body, data || {});
    console.log('✅ Notification sent successfully:', response);
    await Notification.create({ topic, title, body, data, sentAt: new Date(), messageId: response });
    res.json({ success: true, message: 'Notification sent successfully', messageId: response });
  } catch (error) {
    console.error('❌ Error sending notification:', error);
    res.status(500).json({ success: false, message: 'Failed to send notification', error: error.message });
  }
};

// Send notification to specific device token
const sendToDevice = async (req, res) => {
  try {
    const { token, title, body, data } = req.body;
    if (!token || !title || !body) {
      return res.status(400).json({ success: false, message: 'Token, title, and body are required' });
    }
    console.log(`📤 Sending notification to device`);
    const response = await fcmSendToDevice(token, title, body, data || {});
    console.log('✅ Notification sent to device:', response);
    res.json({ success: true, message: 'Notification sent successfully', messageId: response });
  } catch (error) {
    console.error('❌ Error sending notification to device:', error);
    res.status(500).json({ success: false, message: 'Failed to send notification', error: error.message });
  }
};

// Get notification history for a user
const getNotificationHistory = async (req, res) => {
  try {
    const userId = req.user.userId;
    const notifications = await Notification.find({
      $or: [{ topic: `user_${userId}` }, { recipientUserId: userId }]
    }).sort({ sentAt: -1 }).limit(50);
    res.json({ success: true, notifications });
  } catch (error) {
    console.error('❌ Error fetching notification history:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch notification history', error: error.message });
  }
};

// Mark notification as read
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findByIdAndUpdate(
      id,
      { read: true, readAt: new Date() },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    res.json({ success: true, notification });
  } catch (error) {
    console.error('❌ Error marking notification as read:', error);
    res.status(500).json({ success: false, message: 'Failed to mark notification as read', error: error.message });
  }
};

// Handle notification requests from MongoDB Atlas Triggers
const sendFromTrigger = async (req, res) => {
  try {
    const triggerSecret = req.headers['x-trigger-secret'];
    if (!process.env.TRIGGER_SECRET || triggerSecret !== process.env.TRIGGER_SECRET) {
      console.warn('⚠️  Unauthorized trigger request');
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    const { type, data } = req.body;
    console.log(`📬 Trigger notification: ${type}`);
    
    let title, body, topic, notificationData;
    
    switch (type) {
      case 'new_loan':
        title = '🆕 New Loan Application';
        body = `${data.applicantName || 'User'} applied for ${data.loanType}`;
        topic = 'admin_notifications';
        notificationData = { type: 'new_loan', loanId: data.documentId, userId: data.userId };
        break;
      case 'loan_status_update':
        const msgs = {
          approved: '✅ Your loan has been approved!',
          rejected: '❌ Application status updated',
          under_review: '🔍 Application under review',
          pending: '⏳ Application pending'
        };
        title = 'Loan Status Update';
        body = msgs[data.status] || 'Status changed';
        topic = `user_${data.userId}`;
        notificationData = { type: 'loan_status_update', loanId: data.documentId, status: data.status };
        break;
      case 'new_insurance':
        title = '🆕 New Insurance Application';
        body = `${data.applicantName || 'User'} applied for ${data.insuranceType}`;
        topic = 'admin_notifications';
        notificationData = { type: 'new_insurance', insuranceId: data.documentId, userId: data.userId };
        break;
      case 'new_support_message':
        title = '💬 New Message';
        body = data.message?.substring(0, 50) || 'New message';
        topic = data.senderType === 'user' ? 'admin_notifications' : `user_${data.userId}`;
        notificationData = { type: 'new_support_message', threadId: data.threadId, messageId: data.documentId };
        break;
      case 'new_support_ticket':
        title = '🎫 New Support Ticket';
        body = `${data.userName || 'User'}: ${data.subject}`;
        topic = 'admin_notifications';
        notificationData = { type: 'new_support_ticket', ticketId: data.documentId, userId: data.userId };
        break;
      default:
        return res.status(400).json({ success: false, message: 'Unknown type' });
    }
    
    console.log(`📤 Sending to topic: ${topic}`);
    const messageId = await fcmSendToTopic(topic, title, body, notificationData);
    
    await Notification.create({
      topic,
      title,
      body,
      data: notificationData,
      type,
      messageId,
      sentAt: new Date()
    });
    
    console.log(`✅ Notification sent: ${messageId}`);
    res.json({ success: true, message: 'Notification sent', messageId });
  } catch (error) {
    console.error('❌ Error from trigger:', error);
    res.status(500).json({ success: false, message: 'Failed to send notification', error: error.message });
  }
};

export default {
  subscribeToTopic,
  unsubscribeFromTopic,
  sendToTopic,
  sendToDevice,
  getNotificationHistory,
  markAsRead,
  sendFromTrigger
};
