// Verification Routes
// Routes for approving/rejecting temporary data and migrating to MongoDB

import express from 'express';
import verificationController from '../controllers/verificationController.js';
import { verifyAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get all pending submissions (supports both Firebase Auth and Admin JWT)
router.get('/pending', verifyAuth, verificationController.getPendingSubmissions);

// Loan verification
router.post('/approve-loan/:docId', verifyAuth, verificationController.approveLoan);
router.post('/reject-loan/:docId', verifyAuth, verificationController.rejectLoan);
router.post('/update-status/:docId', verifyAuth, verificationController.updateStatus);

// Insurance verification
router.post('/approve-insurance/:docId', verifyAuth, verificationController.approveInsurance);
router.post('/reject-insurance/:docId', verifyAuth, verificationController.rejectInsurance);

// Ticket verification
router.post('/approve-ticket/:docId', verifyAuth, verificationController.approveTicket);

export default router;
