import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

// Import routes
import loanRoutes from './routes/loanRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import userRoutes from './routes/userRoutes.js';
import ticketRoutes from './routes/ticketRoutes.js';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import userDashboardRoutes from './routes/userDashboardRoutes.js';
import insuranceRoutes from './routes/insuranceRoutes.js';
import supportRoutes from './routes/supportRoutes.js';
import firebaseAuthRoutes from './routes/firebaseAuthRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import verificationRoutes from './routes/verificationRoutes.js';

// Initialize Firebase Messaging Admin (for push notifications + Firestore)
import './config/firebaseMessagingAdmin.js';

// Initialize Firestore listeners for email notifications
import { initializeFirestoreListeners } from './services/firestoreListener.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// ========== MIDDLEWARE ==========

// CORS - Allow cross-origin requests from frontend
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000,https://loanzaar.in').split(',').map(url => url.trim());
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

// Body parser middleware - Parse JSON requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware - Always enabled for debugging
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path}`);
  next();
});

// ========== DATABASE CONNECTION ==========

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/loanzaar');

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1); // Exit process with failure
  }
};

// Connect to MongoDB
connectDB();

// Initialize Firestore listeners for real-time email notifications
// This must be called after Firebase Admin is initialized
setTimeout(() => {
  initializeFirestoreListeners();
}, 2000); // Wait 2 seconds for Firebase Admin to fully initialize

// ========== API ROUTES ==========

// Health check route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'LoanZaar API is running',
    version: '1.0.0',
    endpoints: {
      loans: '/api/loans',
      contact: '/api/contact',
      users: '/api/users',
      userDashboard: '/api/user-dashboard',
      tickets: '/api/admin/tickets',
      auth: '/api/auth',
      admin: '/api/admin'
    }
  });
});

// API health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is healthy',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Mount routes
app.use('/api/loans', loanRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/users', userRoutes);
app.use('/api/user-dashboard', userDashboardRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/auth/firebase', firebaseAuthRoutes);
app.use('/api/insurance', insuranceRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/notifications', notificationRoutes);  // Notification routes
app.use('/api/verify', verificationRoutes);         // Verification routes (Firestore → MongoDB)
app.use('/api/admin/tickets', ticketRoutes);  // More specific route first
app.use('/api/admin', adminRoutes);            // General route after

console.log('📌 Admin routes mounted at /api/admin');
console.log('📌 User dashboard routes mounted at /api/user-dashboard');
console.log('📌 Insurance routes mounted at /api/insurance');
console.log('📌 Firebase auth routes mounted at /api/auth/firebase');
console.log('📌 Support routes mounted at /api/support');
console.log('📌 Notification routes mounted at /api/notifications');
console.log('📌 Verification routes mounted at /api/verify');

// ========== ERROR HANDLING ==========

// 404 - Route not found
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// ========== SERVER ==========

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 CORS enabled for: ${allowedOrigins.join(', ')}`);
});


// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
  // Close server & exit process
  process.exit(1);
});

export default app;
