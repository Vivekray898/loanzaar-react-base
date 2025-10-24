import Admin from '../models/Admin.js';
import User from '../models/User.js';
import Loan from '../models/Loan.js';
import Contact from '../models/Contact.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { sendEmail } from '../utils/emailService.js';
import admin from 'firebase-admin';

/**
 * Generate JWT Token for Admin
 */
const generateToken = (adminId) => {
  return jwt.sign(
    { id: adminId, role: 'admin' },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '7d' }
  );
};

/**
 * OTP Storage (In production, use Redis)
 */
const otpStore = new Map();

/**
 * Generate OTP
 */
function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Generate OTP Email Template for Admin Password Reset
 */
function generateAdminOTPEmailTemplate(fullName, otp) {
  const otpDigits = otp.split('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f3f4f6; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { color: #ef4444; font-size: 32px; font-weight: 700; }
        .otp-container { display: flex; justify-content: center; gap: 12px; margin: 30px 0; }
        .otp-digit { width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 600; color: #ef4444; border: 2px solid #ef4444; border-radius: 8px; background-color: #fef2f2; }
        .content { color: #374151; line-height: 1.6; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🔒 LOANZAAR ADMIN</div>
        </div>
        <div class="content">
          <h2 style="color: #1f2937; margin-bottom: 10px;">Hi ${fullName},</h2>
          <p style="margin: 20px 0;">You requested to reset your admin password. Use this verification code:</p>
          <div class="otp-container">
            ${otpDigits.map(digit => `<div class="otp-digit">${digit}</div>`).join('')}
          </div>
          <p style="margin: 20px 0;">
            <strong>This code will expire in 10 minutes.</strong> For security reasons, please do not share this code with anyone.
          </p>
          <p style="margin: 20px 0;">
            If you didn't request this password reset, please ignore this email or contact support immediately.
          </p>
          <p style="margin: 30px 0 10px 0;">
            Best regards,<br>
            <strong>The Loanzaar Admin Team</strong>
          </p>
        </div>
        <div class="footer">
          <p>This is an automated email for admin password reset. Please do not reply.</p>
          <p style="margin-top: 10px;">© ${new Date().getFullYear()} Loanzaar. All Rights Reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Admin Sign Up
 * @route POST /api/admin/signup
 */
export const adminSignUp = async (req, res) => {
  try {
    const { fullName, email, phone, password } = req.body;

    // Validate required fields
    if (!fullName || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: fullName, email, phone, password'
      });
    }

    // Validate password length
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Admin with this email already exists'
      });
    }

    // Create new admin
    const admin = new Admin({
      fullName,
      email,
      phone,
      password // Will be hashed by pre-save middleware
    });

    await admin.save();

    // Generate token
    const token = generateToken(admin._id);

    res.status(201).json({
      success: true,
      message: 'Admin account created successfully',
      data: {
        adminId: admin._id,
        fullName: admin.fullName,
        email: admin.email,
        phone: admin.phone,
        role: admin.role,
        token
      }
    });

  } catch (error) {
    console.error('Admin signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create admin account',
      error: error.message
    });
  }
};

/**
 * Admin Login
 * @route POST /api/admin/login
 */
export const adminLogin = async (req, res) => {
  try {
    const { identifier, email, password } = req.body;

    // Accept either 'identifier' (email or phone) or 'email'
    const loginIdentifier = identifier || email;

    // Validate required fields
    if (!loginIdentifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email/phone and password'
      });
    }

    // Find admin by email or phone
    let admin;
    
    // Check if it's an email format
    const isEmail = loginIdentifier.includes('@');
    
    if (isEmail) {
      admin = await Admin.findOne({ email: loginIdentifier.toLowerCase() });
    } else {
      // It's a phone number
      admin = await Admin.findOne({ phone: loginIdentifier });
    }

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if admin is active
    if (!admin.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Admin account is deactivated. Please contact support.'
      });
    }

    // Check password
    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Generate token
    const token = generateToken(admin._id);

    res.status(200).json({
      success: true,
      message: 'Admin login successful',
      data: {
        adminId: admin._id,
        fullName: admin.fullName,
        email: admin.email,
        phone: admin.phone,
        role: admin.role,
        profilePicture: admin.profilePicture,
        lastLogin: admin.lastLogin,
        token
      }
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to login',
      error: error.message
    });
  }
};

/**
 * Forgot Password - Send OTP
 * @route POST /api/admin/forgot-password
 */
export const forgotPassword = async (req, res) => {
  try {
    const { fullName, phone, email } = req.body;

    // Validate required fields
    if (!fullName || !phone || !email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide fullName, phone, and email'
      });
    }

    // Find admin by email, phone, and fullName (security check)
    const admin = await Admin.findOne({
      email: email.toLowerCase(),
      phone: phone,
      fullName: { $regex: new RegExp('^' + fullName + '$', 'i') }
    });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'No admin account found with these details'
      });
    }

    // Generate OTP
    const otp = generateOTP();

    // Store OTP with expiration (10 minutes)
    otpStore.set(email.toLowerCase(), {
      otp,
      expires: Date.now() + 10 * 60 * 1000, // 10 minutes
      adminId: admin._id,
      attempts: 0
    });

    // Send OTP email
    const emailHtml = generateAdminOTPEmailTemplate(admin.fullName, otp);

    await sendEmail({
      to: email,
      subject: 'Admin Password Reset - Loanzaar',
      html: emailHtml
    });

    console.log(`✅ Admin password reset OTP sent to ${email}: ${otp}`);

    res.json({ 
      success: true, 
      message: 'OTP sent successfully to your email' 
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to send OTP',
      error: error.message
    });
  }
};

/**
 * Reset Password - Verify OTP and Update Password
 * @route POST /api/admin/reset-password
 */
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ 
        success: false,
        message: 'Email, OTP, and new password are required' 
      });
    }

    // Validate password length
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }

    const storedData = otpStore.get(email.toLowerCase());
    if (!storedData) {
      return res.status(400).json({ 
        success: false,
        message: 'OTP expired or not found. Please request a new one.' 
      });
    }

    // Check expiration
    if (Date.now() > storedData.expires) {
      otpStore.delete(email.toLowerCase());
      return res.status(400).json({ 
        success: false,
        message: 'OTP has expired. Please request a new one.' 
      });
    }

    // Check attempts (max 3)
    if (storedData.attempts >= 3) {
      otpStore.delete(email.toLowerCase());
      return res.status(400).json({ 
        success: false,
        message: 'Too many failed attempts. Please request a new OTP.' 
      });
    }

    // Verify OTP
    if (storedData.otp !== otp) {
      storedData.attempts += 1;
      return res.status(400).json({ 
        success: false,
        message: 'Invalid OTP. Please try again.' 
      });
    }

    // OTP verified successfully - update password
    const admin = await Admin.findById(storedData.adminId);
    if (!admin) {
      return res.status(404).json({ 
        success: false,
        message: 'Admin account not found' 
      });
    }

    admin.password = newPassword; // Will be hashed by pre-save middleware
    await admin.save();

    // Clear OTP from store
    otpStore.delete(email.toLowerCase());

    console.log('✅ Admin password reset successful for:', admin.email);

    res.json({
      success: true,
      message: 'Password reset successfully. You can now login with your new password.'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to reset password',
      error: error.message
    });
  }
};

/**
 * Get Dashboard Statistics
 * @route GET /api/admin/stats
 */
export const getDashboardStats = async (req, res) => {
  try {
    // Get counts
    const totalUsers = await User.countDocuments();
    const totalLoans = await Loan.countDocuments();
    const pendingLoans = await Loan.countDocuments({ status: 'Pending' });
    const totalMessages = await Contact.countDocuments();
    const newMessages = await Contact.countDocuments({ status: 'New' });

    // Get loan statistics by type
    const loansByType = await Loan.aggregate([
      {
        $group: {
          _id: '$loanType',
          count: { $sum: 1 },
          totalAmount: { $sum: '$loanAmount' }
        }
      }
    ]);

    // Get recent loans
    const recentLoans = await Loan.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('fullName loanType loanAmount status createdAt');

    // Get loan statistics by status
    const loansByStatus = await Loan.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get monthly loan trends (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyLoans = await Loan.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          totalAmount: { $sum: '$loanAmount' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalLoans,
          pendingLoans,
          totalMessages,
          newMessages
        },
        loansByType,
        loansByStatus,
        recentLoans,
        monthlyLoans
      }
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: error.message
    });
  }
};

/**
 * Get All Messages from Contact Form
 * @route GET /api/admin/messages
 */
export const getMessages = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    // Build query
    const query = {};
    if (status) query.status = status;

    // Execute query with pagination
    const messages = await Contact.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    // Get total count
    const count = await Contact.countDocuments(query);

    res.status(200).json({
      success: true,
      data: messages,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit),
        hasMore: page * limit < count
      }
    });

  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages',
      error: error.message
    });
  }
};

/**
 * Update Message Status
 * @route PATCH /api/admin/messages/:id
 */
export const updateMessageStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['New', 'In Progress', 'Resolved', 'Closed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    const message = await Contact.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Message status updated successfully',
      data: message
    });

  } catch (error) {
    console.error('Update message status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update message status',
      error: error.message
    });
  }
};

/**
 * Get Admin Profile
 * @route GET /api/admin/profile
 */
export const getAdminProfile = async (req, res) => {
  try {
    // req.admin is set by auth middleware
    const admin = await Admin.findById(req.admin.id).select('-password');

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    res.status(200).json({
      success: true,
      data: admin
    });

  } catch (error) {
    console.error('Get admin profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admin profile',
      error: error.message
    });
  }
};

/**
 * Get All Users (Admin Only)
 * @route GET /api/admin/users
 */
export const getAllUsersForAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 10, role } = req.query;

    // Build query
    const query = {};
    if (role) query.role = role;

    // Execute query with pagination
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    // Get total count
    const count = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
};

/**
 * Delete User (Admin Only)
 * @route DELETE /api/admin/users/:id
 */
export const deleteUserByAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
      data: user
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message
    });
  }
};

/**
 * Update User Role (Admin Only)
 * @route PUT /api/admin/users/:id/role
 */
export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // Validate role
    if (!role || !['user', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be either "user" or "admin"'
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log(`✅ User role updated: ${user.email} -> ${role}`);

    res.status(200).json({
      success: true,
      message: `User role updated to ${role} successfully`,
      data: user
    });

  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user role',
      error: error.message
    });
  }
};

/**
 * Get all documents from a Firestore collection
 * Used for admin collections dashboard
 */
export const getFirestoreCollection = async (req, res) => {
  try {
    const { collectionName } = req.params;

    // Whitelist allowed collections for security
    const allowedCollections = [
      'admin_insurance',
      'admin_loans',
      'admin_messages',
      'admin_users',
      'cibil_score',
      'insurance_applications',
      'loan_applications',
      'other_data'
    ];

    if (!allowedCollections.includes(collectionName)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid collection name'
      });
    }

    try {
      const db = admin.firestore();
      
      console.log(`📖 Fetching Firestore collection: ${collectionName}`);
      
      const snapshot = await db.collection(collectionName).get();
      const documents = [];
      
      snapshot.forEach(doc => {
        documents.push({
          id: doc.id,
          ...doc.data()
        });
      });

      console.log(`✅ Fetched ${documents.length} documents from ${collectionName}`);

      res.json({
        success: true,
        data: documents,
        count: documents.length
      });
    } catch (error) {
      console.error(`❌ Error fetching ${collectionName}:`, error);
      res.status(500).json({
        success: false,
        message: `Failed to fetch ${collectionName}`,
        error: error.message
      });
    }
  } catch (error) {
    console.error('❌ Error in getFirestoreCollection:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Clean up expired OTPs periodically
setInterval(() => {
  const now = Date.now();
  for (const [email, data] of otpStore.entries()) {
    if (now > data.expires) {
      otpStore.delete(email);
    }
  }
}, 60000); // Clean up every minute
