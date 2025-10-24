import express from 'express';
import {
  submitContact,
  getAllContacts,
  updateContactStatus,
  deleteContact
} from '../controllers/contactController.js';

const router = express.Router();

/**
 * @route   POST /api/contact
 * @desc    Submit a contact form
 * @access  Public
 */
router.post('/', submitContact);

/**
 * @route   GET /api/contact
 * @desc    Get all contact submissions (with filters and pagination)
 * @access  Private/Admin
 * @query   ?page=1&limit=10&status=New
 */
router.get('/', getAllContacts);

/**
 * @route   PATCH /api/contact/:id
 * @desc    Update contact submission status
 * @access  Private/Admin
 * @body    { "status": "Resolved" }
 */
router.patch('/:id', updateContactStatus);

/**
 * @route   DELETE /api/contact/:id
 * @desc    Delete a contact submission
 * @access  Private/Admin
 */
router.delete('/:id', deleteContact);

export default router;
