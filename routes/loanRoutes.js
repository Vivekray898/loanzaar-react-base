import express from 'express';
import {
  submitLoan,
  getAllLoans,
  getLoanById,
  updateLoanStatus,
  deleteLoan,
  getUserCreatedLoans,
  getAdminCreatedLoans
} from '../controllers/loanController.js';

const router = express.Router();

/**
 * @route   POST /api/loans
 * @desc    Submit a new loan application
 * @access  Public
 */
router.post('/', submitLoan);

/**
 * @route   GET /api/loans
 * @desc    Get all loan applications (with filters and pagination)
 * @access  Private/Admin
 * @query   ?page=1&limit=10&loanType=Personal&status=Pending
 */
router.get('/', getAllLoans);

/**
 * @route   GET /api/loans/filter/user-created
 * @desc    Get user-created loan applications
 * @access  Private/Admin
 * @query   ?page=1&limit=10&status=Pending
 */
router.get('/filter/user-created', getUserCreatedLoans);

/**
 * @route   GET /api/loans/filter/admin-created
 * @desc    Get admin-created loan applications
 * @access  Private/Admin
 * @query   ?page=1&limit=10&status=Pending
 */
router.get('/filter/admin-created', getAdminCreatedLoans);

/**
 * @route   GET /api/loans/:id
 * @desc    Get a single loan application by ID
 * @access  Private/Admin
 */
router.get('/:id', getLoanById);

/**
 * @route   PATCH /api/loans/:id
 * @desc    Update loan application status
 * @access  Private/Admin
 * @body    { "status": "Approved" }
 */
router.patch('/:id', updateLoanStatus);

/**
 * @route   PUT /api/loans/:id/status
 * @desc    Update loan application status (alternative endpoint)
 * @access  Private/Admin
 * @body    { "status": "Approved" }
 */
router.put('/:id/status', updateLoanStatus);

/**
 * @route   DELETE /api/loans/:id
 * @desc    Delete a loan application
 * @access  Private/Admin
 */
router.delete('/:id', deleteLoan);

export default router;
