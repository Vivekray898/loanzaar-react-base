import express from 'express';
import {
  sendSupportMessage,
  getSupportThreads,
  getSupportThread,
  replySupportMessage,
  closeSupportThread,
  getUserSupportThreads,
  getUnreadCount,
  deleteTicket
} from '../controllers/supportControllerFirestore.js';

const router = express.Router();

/**
 * @route   POST /api/support/send
 * @desc    Send a new support message (start thread or reply)
 * @access  Public
 */
router.post('/send', sendSupportMessage);

/**
 * @route   POST /api/support/reply
 * @desc    Admin reply to a support thread
 * @access  Private/Admin
 */
router.post('/reply', replySupportMessage);

/**
 * @route   GET /api/support/unread-count
 * @desc    Get unread message count for admin
 * @access  Private/Admin
 */
router.get('/unread-count', getUnreadCount);

/**
 * @route   GET /api/support/user/:userId/threads
 * @desc    Get support threads for a specific user
 * @access  Private
 */
router.get('/user/:userId/threads', getUserSupportThreads);

/**
 * @route   GET /api/support/threads
 * @desc    Get all support threads (for admin)
 * @access  Private/Admin
 * @query   ?page=1&limit=10&status=New&userId=123
 */
router.get('/threads', getSupportThreads);

/**
 * @route   GET /api/support/thread/:threadId
 * @desc    Get messages in a specific thread
 * @access  Private
 */
router.get('/thread/:threadId', getSupportThread);

/**
 * @route   PATCH /api/support/thread/:threadId/close
 * @desc    Close a support thread
 * @access  Private/Admin
 */
router.patch('/thread/:threadId/close', closeSupportThread);

/**
 * @route   PATCH /api/support/ticket/:ticketId/delete
 * @desc    Soft delete a ticket (by admin or user)
 * @access  Private
 * @body    { deletedBy: 'admin' | 'user' }
 */
router.patch('/ticket/:ticketId/delete', deleteTicket);

export default router;
