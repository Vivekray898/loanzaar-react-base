// Notification Model
// Stores notification history for users

import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  // Recipient information
  topic: {
    type: String,
    required: false,
    index: true
    // e.g., 'admin_notifications' or 'user_123'
  },
  recipientUserId: {
    type: String,
    required: false,
    index: true
    // Specific user ID if sent directly
  },

  // Notification content
  title: {
    type: String,
    required: true
  },
  body: {
    type: String,
    required: true
  },
  
  // Additional data payload
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
    // e.g., { type: 'loan_status_update', loanId: '123', status: 'approved' }
  },

  // Notification type for categorization
  type: {
    type: String,
    enum: [
      'new_loan',
      'loan_status_update',
      'new_insurance',
      'insurance_status_update',
      'new_support_ticket',
      'new_support_message',
      'system_announcement',
      'other'
    ],
    default: 'other'
  },

  // Read status
  read: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },

  // FCM response
  messageId: {
    type: String,
    // Firebase message ID from FCM response
  },

  // Timestamps
  sentAt: {
    type: Date,
    default: Date.now
  },
  
  // Link to related entities
  relatedLoanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Loan'
  },
  relatedInsuranceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Insurance'
  },
  relatedTicketId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket'
  },
  relatedThreadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SupportThread'
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
notificationSchema.index({ recipientUserId: 1, sentAt: -1 });
notificationSchema.index({ topic: 1, sentAt: -1 });
notificationSchema.index({ read: 1, sentAt: -1 });
notificationSchema.index({ type: 1, sentAt: -1 });

// Virtual for age of notification
notificationSchema.virtual('age').get(function() {
  const now = new Date();
  const diff = now - this.sentAt;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
});

// Static method to get unread count for a user
notificationSchema.statics.getUnreadCount = async function(userId) {
  return await this.countDocuments({
    recipientUserId: userId,
    read: false
  });
};

// Static method to mark all as read for a user
notificationSchema.statics.markAllAsRead = async function(userId) {
  return await this.updateMany(
    { recipientUserId: userId, read: false },
    { read: true, readAt: new Date() }
  );
};

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
