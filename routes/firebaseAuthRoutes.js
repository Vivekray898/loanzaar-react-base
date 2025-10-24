// Firebase Authentication Routes
import express from 'express';
import firebaseAuthController from '../controllers/firebaseAuthController.js';
const {
  createOrUpdateUserProfile,
  getUserProfileByUID,
  verifyTokenAndGetProfile,
  deleteUserProfile
} = firebaseAuthController;
import { verifyFirebaseToken } from '../middleware/firebaseAuthMiddleware.js';

const router = express.Router();

/**
 * @route   POST /api/auth/firebase/profile
 * @desc    Create or update user profile in MongoDB after Firebase authentication
 * @access  Public (but requires valid Firebase UID)
 */
router.post('/profile', createOrUpdateUserProfile);

/**
 * @route   GET /api/auth/firebase/profile/:firebaseUID
 * @desc    Get user profile by Firebase UID
 * @access  Public
 */
router.get('/profile/:firebaseUID', getUserProfileByUID);

/**
 * @route   POST /api/auth/firebase/verify
 * @desc    Verify Firebase token and get user profile
 * @access  Public
 */
router.post('/verify', verifyTokenAndGetProfile);

/**
 * @route   DELETE /api/auth/firebase/profile/:firebaseUID
 * @desc    Delete user profile
 * @access  Protected (requires Firebase authentication)
 */
router.delete('/profile/:firebaseUID', verifyFirebaseToken, deleteUserProfile);

export default router;
