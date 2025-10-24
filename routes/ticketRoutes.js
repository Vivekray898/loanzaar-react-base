import express from 'express';
import {
  createTicket,
  getAllTickets,
  getTicketById,
  updateTicketStatus,
  assignTicket,
  addTicketNote,
  deleteTicket
} from '../controllers/ticketController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @route   POST /api/admin/tickets
 * @desc    Create a new ticket for a loan application
 * @access  Private/Admin
 * @body    { "loanId": "mongoId", "subject": "Issue with loan", "description": "Details..." }
 */
router.post('/', protect, adminOnly, createTicket);

/**
 * @route   GET /api/admin/tickets
 * @desc    Get all tickets with filters
 * @access  Private/Admin
 * @query   ?page=1&limit=10&status=Open&priority=High
 */
router.get('/', protect, adminOnly, getAllTickets);

/**
 * @route   GET /api/admin/tickets/:id
 * @desc    Get a single ticket by ID
 * @access  Private/Admin
 */
router.get('/:id', protect, adminOnly, getTicketById);

/**
 * @route   PATCH /api/admin/tickets/:id/status
 * @desc    Update ticket status
 * @access  Private/Admin
 * @body    { "status": "In Progress" }
 */
router.patch('/:id/status', protect, adminOnly, updateTicketStatus);

/**
 * @route   PATCH /api/admin/tickets/:id/assign
 * @desc    Assign ticket to a user
 * @access  Private/Admin
 * @body    { "assignedTo": "userId" }
 */
router.patch('/:id/assign', protect, adminOnly, assignTicket);

/**
 * @route   POST /api/admin/tickets/:id/notes
 * @desc    Add a note to a ticket
 * @access  Private/Admin
 * @body    { "text": "Note content", "addedBy": "userId" }
 */
router.post('/:id/notes', protect, adminOnly, addTicketNote);

/**
 * @route   DELETE /api/admin/tickets/:id
 * @desc    Delete a ticket
 * @access  Private/Admin
 */
router.delete('/:id', protect, adminOnly, deleteTicket);

export default router;
