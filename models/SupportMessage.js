import mongoose from 'mongoose';

/**
 * SupportMessage Schema - Handles user-admin support/messaging threads
 * Supports multi-message conversations in a single thread
 */
const supportMessageSchema = new mongoose.Schema({
  // Thread Information
  threadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SupportThread',
    required: true
  },
  
  // User Information
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Message Content
  subject: {
    type: String,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  
  // Sender Information
  senderType: {
    type: String,
    enum: ['user', 'admin'],
    required: true
  },
  senderName: {
    type: String,
    trim: true
  },
  senderEmail: {
    type: String,
    trim: true,
    lowercase: true
  },
  
  // Message Status
  status: {
    type: String,
    enum: ['New', 'Replied', 'Closed'],
    default: 'New'
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for faster queries
supportMessageSchema.index({ threadId: 1 });
supportMessageSchema.index({ userId: 1 });
supportMessageSchema.index({ senderType: 1 });
supportMessageSchema.index({ createdAt: -1 });

const SupportMessage = mongoose.model('SupportMessage', supportMessageSchema);

export default SupportMessage;
