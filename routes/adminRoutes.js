import express from 'express';
import {
  adminSignUp,
  adminLogin,
  forgotPassword,
  resetPassword,
  getDashboardStats,
  getMessages,
  updateMessageStatus,
  getAdminProfile,
  getAllUsersForAdmin,
  deleteUserByAdmin,
  updateUserRole,
  getFirestoreCollection
} from '../controllers/adminController.js';
import { verifyFirebaseAdminToken } from '../middleware/verifyFirebaseAdminToken.js';

const router = express.Router();

console.log('🔧 Admin routes file loaded');

// ========== PUBLIC ROUTES ==========
// Admin Authentication
router.post('/signup', adminSignUp);
router.post('/login', adminLogin);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// ========== PROTECTED ROUTES (Admin Only - Firebase Token Required) ==========
// Dashboard Statistics
router.get('/stats', verifyFirebaseAdminToken, getDashboardStats);

// Messages Management
router.get('/messages', verifyFirebaseAdminToken, getMessages);
router.patch('/messages/:id', verifyFirebaseAdminToken, updateMessageStatus);

// Admin Profile
router.get('/profile', verifyFirebaseAdminToken, getAdminProfile);

// User Management
router.get('/users', verifyFirebaseAdminToken, getAllUsersForAdmin);
router.delete('/users/:id', verifyFirebaseAdminToken, deleteUserByAdmin);
router.put('/users/:id/role', verifyFirebaseAdminToken, updateUserRole);

// Firestore Collections
router.get('/collections/:collectionName', verifyFirebaseAdminToken, getFirestoreCollection);

export default router;
