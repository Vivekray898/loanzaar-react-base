import mongoose from 'mongoose';

/**
 * SupportThread Schema - Manages support conversation threads
 * Groups related messages together
 */
const supportThreadSchema = new mongoose.Schema({
  // User Information
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    trim: true
  },
  userEmail: {
    type: String,
    trim: true,
    lowercase: true
  },
  
  // Thread Subject
  subject: {
    type: String,
    required: true,
    trim: true
  },
  
  // Thread Status
  status: {
    type: String,
    enum: ['New', 'Replied', 'Closed'],
    default: 'New'
  },
  
  // Last Message Preview
  lastMessagePreview: {
    type: String,
    trim: true
  },
  lastMessageSenderType: {
    type: String,
    enum: ['user', 'admin']
  },
  
  // Message Count
  messageCount: {
    type: Number,
    default: 1
  },
  
  // Unread Messages Count
  unreadCount: {
    type: Number,
    default: 0
  },
  
  // Soft Delete Flags
  deletedByAdmin: {
    type: Boolean,
    default: false
  },
  deletedByUser: {
    type: Boolean,
    default: false
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  lastMessageAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for faster queries
supportThreadSchema.index({ userId: 1 });
supportThreadSchema.index({ status: 1 });
supportThreadSchema.index({ lastMessageAt: -1 });
supportThreadSchema.index({ createdAt: -1 });

const SupportThread = mongoose.model('SupportThread', supportThreadSchema);

export default SupportThread;
