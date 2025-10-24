import express from 'express';
import {
  getDashboardStats,
  getUserProfile,
  updateUserProfile,
  applyForLoan,
  applyForInsurance,
  getMyApplications,
  getMyInsuranceApplications,
  getLoanById,
  updateLoanApplication,
  submitSupportMessage,
  getSupportMessages
} from '../controllers/userDashboardController.js';
import { userAuth } from '../middleware/userAuth.js';

const router = express.Router();

// All routes require authentication
router.use(userAuth);

// ========== DASHBOARD ==========
router.get('/dashboard/stats', getDashboardStats);

// ========== PROFILE ==========
router.get('/me', getUserProfile);
router.put('/update-profile', updateUserProfile);

// ========== LOAN APPLICATIONS ==========
router.post('/loans/apply', applyForLoan);
router.get('/loans/my-applications', getMyApplications);
router.get('/loans/:id', getLoanById);
router.put('/loans/:id', updateLoanApplication);

// ========== INSURANCE APPLICATIONS ==========
router.post('/insurance/apply', applyForInsurance);
router.get('/insurance/my-applications', getMyInsuranceApplications);

// ========== SUPPORT ==========
router.post('/support', submitSupportMessage);
router.get('/support', getSupportMessages);

export default router;
