import express from 'express';
import {
  signUp,
  signIn,
  getProfile,
  updateProfile,
  getAllUsers,
  deleteUser
} from '../controllers/userController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @route   POST /api/users/signup
 * @desc    Register a new user
 * @access  Public
 * @body    { "name": "John Doe", "email": "john@example.com", "password": "password123" }
 */
router.post('/signup', signUp);

/**
 * @route   POST /api/users/signin
 * @desc    Sign in a user
 * @access  Public
 * @body    { "email": "john@example.com", "password": "password123" }
 */
router.post('/signin', signIn);

/**
 * @route   GET /api/users/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', protect, getProfile);

/**
 * @route   PUT /api/users/profile
 * @desc    Update user profile
 * @access  Private
 * @body    { "name": "John Updated", "phone": "1234567890" }
 */
router.put('/profile', protect, updateProfile);

/**
 * @route   GET /api/users
 * @desc    Get all users (Admin only)
 * @access  Private/Admin
 * @query   ?page=1&limit=10&role=user
 */
router.get('/', protect, adminOnly, getAllUsers);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete a user (Admin only)
 * @access  Private/Admin
 */
router.delete('/:id', protect, adminOnly, deleteUser);

export default router;
