import SupportMessage from '../models/SupportMessage.js';
import SupportThread from '../models/SupportThread.js';

export const sendSupportMessage = async (req, res) => {
  try {
    const { userId, subject, message, threadId, senderType, senderName, senderEmail } = req.body;

    console.log('📤 Sending support message:', { userId, subject, threadId, senderType });

    // Validate required fields
    if (!userId || !message) {
      return res.status(400).json({
        success: false,
        message: 'userId and message are required'
      });
    }

    let thread;
    const actualSenderType = senderType || 'user';

    // If threadId provided, add to existing thread
    if (threadId) {
      console.log(`🔍 Finding thread: ${threadId}`);
      thread = await SupportThread.findById(threadId);
      if (!thread) {
        return res.status(404).json({
          success: false,
          message: 'Thread not found'
        });
      }

      // If user replies to an admin message, set status back to 'New' to notify admin
      if (actualSenderType === 'user' && thread.status === 'Replied') {
        thread.status = 'New';
        console.log(`✏️  Status changed from Replied to New`);
      }
    } else {
      // Create new thread
      if (!subject) {
        return res.status(400).json({
          success: false,
          message: 'subject is required for new threads'
        });
      }

      thread = new SupportThread({
        userId,
        userName: senderName || 'User',
        userEmail: senderEmail,
        subject,
        status: 'New',
        messageCount: 0,
        lastMessagePreview: message.substring(0, 100),
        lastMessageSenderType: actualSenderType,
        lastMessageAt: new Date()
      });

      await thread.save();
      console.log(`✅ New thread created: ${thread._id}`);
    }

    // Create support message
    const supportMessage = new SupportMessage({
      threadId: thread._id,
      userId,
      subject: subject || thread.subject,
      message,
      senderType: actualSenderType,
      senderName: senderName || 'User',
      senderEmail: senderEmail,
      status: 'New'
    });

    await supportMessage.save();
    console.log(`✅ Message saved: ${supportMessage._id}`);

    // Update thread
    thread.messageCount += 1;
    thread.lastMessagePreview = message.substring(0, 100);
    thread.lastMessageSenderType = actualSenderType;
    thread.lastMessageAt = new Date();

    await thread.save();
    console.log(`✅ Thread updated: message count = ${thread.messageCount}`);

    res.status(201).json({
      success: true,
      message: 'Support message sent successfully',
      data: {
        messageId: supportMessage._id,
        threadId: thread._id,
        threadStatus: thread.status,
        message: supportMessage
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

    // Build query - filter out threads deleted by admin
    const query = { deletedByAdmin: false };
    if (status) query.status = status;
    if (userId) query.userId = userId;

    // Execute query with pagination
    const threads = await SupportThread.find(query)
      .populate('userId', 'name email')
      .sort({ lastMessageAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    // Get total count
    const count = await SupportThread.countDocuments(query);

    res.status(200).json({
      success: true,
      data: threads,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching support threads:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch support threads',
      error: error.message
    });
  }
};

/**
 * Get messages in a specific support thread
 * @route GET /api/support/thread/:threadId
 */
export const getSupportThread = async (req, res) => {
  try {
    const { threadId } = req.params;

    // Get thread details
    const thread = await SupportThread.findById(threadId).populate('userId', 'name email');

    if (!thread) {
      return res.status(404).json({
        success: false,
        message: 'Thread not found'
      });
    }

    // Get all messages in thread
    const messages = await SupportMessage.find({ threadId })
      .sort({ createdAt: 1 })
      .exec();

    res.status(200).json({
      success: true,
      data: {
        thread,
        messages
      }
    });

  } catch (error) {
    console.error('Error fetching support thread:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch support thread',
      error: error.message
    });
  }
};

/**
 * Admin reply to a support thread
 * @route POST /api/support/reply
 */
export const replySupportMessage = async (req, res) => {
  try {
    const { threadId, message } = req.body;

    // Validate required fields
    if (!threadId || !message) {
      return res.status(400).json({
        success: false,
        message: 'threadId and message are required'
      });
    }

    // Find thread
    const thread = await SupportThread.findById(threadId);
    if (!thread) {
      return res.status(404).json({
        success: false,
        message: 'Thread not found'
      });
    }

    // Create admin reply message
    const adminMessage = new SupportMessage({
      threadId: thread._id,
      userId: thread.userId,
      subject: thread.subject,
      message,
      senderType: 'admin',
      senderName: 'Admin Support',
      senderEmail: process.env.ADMIN_EMAIL || 'admin@loanzaar.com',
      status: 'Replied'
    });

    await adminMessage.save();

    // Update thread
    thread.status = 'Replied';
    thread.messageCount += 1;
    thread.lastMessagePreview = message.substring(0, 100);
    thread.lastMessageSenderType = 'admin';
    thread.lastMessageAt = new Date();
    thread.unreadCount = 1; // User has unread admin reply

    await thread.save();

    console.log('✅ Admin reply sent:', adminMessage._id);

    res.status(201).json({
      success: true,
      message: 'Admin reply sent successfully',
      data: {
        messageId: adminMessage._id,
        threadId: thread._id,
        threadStatus: thread.status
      }
    });

  } catch (error) {
    console.error('Error sending admin reply:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send admin reply',
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

    const thread = await SupportThread.findByIdAndUpdate(
      threadId,
      { status: 'Closed', updatedAt: new Date() },
      { new: true }
    );

    if (!thread) {
      return res.status(404).json({
        success: false,
        message: 'Thread not found'
      });
    }

    console.log(`✅ Support thread closed: ${threadId}`);

    res.status(200).json({
      success: true,
      message: 'Support thread closed successfully',
      data: thread
    });

  } catch (error) {
    console.error('Error closing support thread:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to close support thread',
      error: error.message
    });
  }
};

/**
 * Get threads for a specific user (with full message history)
 * @route GET /api/support/user/:userId/threads
 */
export const getUserSupportThreads = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10, status } = req.query;

    console.log(`📥 Fetching threads for user: ${userId}`);

    // Build query - ensure userId is treated as ObjectId
    const query = { 
      userId: userId,
      deletedByUser: false  // Filter out threads deleted by user
    };
    if (status) query.status = status;

    console.log(`🔎 Query:`, query);

    // Execute query with pagination
    const threads = await SupportThread.find(query)
      .sort({ lastMessageAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    console.log(`📋 Found ${threads.length} threads`);

    // Fetch all messages for each thread
    const threadsWithMessages = [];
    for (const thread of threads) {
      try {
        console.log(`🔍 Fetching messages for thread: ${thread._id}`);
        
        const messages = await SupportMessage.find({ threadId: thread._id })
          .sort({ createdAt: 1 })
          .exec();
        
        console.log(`✅ Found ${messages.length} messages for thread ${thread._id}`);
        
        threadsWithMessages.push({
          ...thread.toObject(),
          messages
        });
      } catch (threadErr) {
        console.error(`❌ Error fetching messages for thread ${thread._id}:`, threadErr);
        threadsWithMessages.push({
          ...thread.toObject(),
          messages: []
        });
      }
    }

    // Get total count
    const count = await SupportThread.countDocuments(query);

    console.log(`✅ Returning ${threadsWithMessages.length} threads with messages`);

    res.status(200).json({
      success: true,
      data: threadsWithMessages,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('❌ Error fetching user support threads:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user support threads',
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
    // Count threads with 'New' status (user's new messages)
    const newThreads = await SupportThread.countDocuments({ 
      status: 'New'
    });

    // Count unread messages in threads with 'Replied' status
    const repliedThreads = await SupportThread.countDocuments({ 
      status: 'Replied',
      unreadCount: { $gt: 0 }
    });

    const totalUnread = newThreads + repliedThreads;

    res.status(200).json({
      success: true,
      data: {
        newThreads,
        repliedThreads,
        totalUnread
      }
    });

  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get unread count',
      error: error.message
    });
  }
};

/**
 * Delete a support ticket/thread (soft delete)
 * @route PATCH /api/support/:ticketId/delete
 * @desc Soft delete a ticket for admin or user
 */
export const deleteTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { deletedBy } = req.body; // 'admin' or 'user'

    if (!deletedBy || !['admin', 'user'].includes(deletedBy)) {
      return res.status(400).json({
        success: false,
        message: 'deletedBy must be "admin" or "user"'
      });
    }

    console.log(`🗑️  Deleting ticket ${ticketId} by ${deletedBy}`);

    // Find the ticket
    const thread = await SupportThread.findById(ticketId);

    if (!thread) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    // Set the appropriate deleted flag
    if (deletedBy === 'admin') {
      thread.deletedByAdmin = true;
    } else if (deletedBy === 'user') {
      thread.deletedByUser = true;
    }

    // If both admin and user have deleted, completely remove from DB
    if (thread.deletedByAdmin && thread.deletedByUser) {
      console.log(`🗑️  Ticket ${ticketId} deleted by both - removing completely`);
      // Optionally: Also delete all messages for this thread
      await SupportMessage.deleteMany({ threadId: ticketId });
      await SupportThread.findByIdAndDelete(ticketId);
    } else {
      // Otherwise just save the flag
      await thread.save();
      console.log(`✅ Ticket ${ticketId} marked as deleted by ${deletedBy}`);
    }

    res.status(200).json({
      success: true,
      message: `Ticket deleted successfully by ${deletedBy}`,
      data: { ticketId, deletedBy, fullyDeleted: thread.deletedByAdmin && thread.deletedByUser }
    });

  } catch (error) {
    console.error('❌ Error deleting ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete ticket',
      error: error.message
    });
  }
};
