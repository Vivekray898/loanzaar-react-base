// Notification Routes
import express from 'express';
import notificationController from '../controllers/notificationController.js';
import { userAuth } from '../middleware/userAuth.js';

const router = express.Router();

// Public routes (require authentication)
router.post('/subscribe', userAuth, notificationController.subscribeToTopic);
router.post('/unsubscribe', userAuth, notificationController.unsubscribeFromTopic);

// Admin routes (for manual notifications)
router.post('/send-to-topic', userAuth, notificationController.sendToTopic);
router.post('/send-to-device', userAuth, notificationController.sendToDevice);

// User notification history
router.get('/history', userAuth, notificationController.getNotificationHistory);
router.put('/:id/read', userAuth, notificationController.markAsRead);

// MongoDB Atlas Trigger endpoint (no auth - uses trigger secret)
router.post('/send-from-trigger', notificationController.sendFromTrigger);

export default router;
