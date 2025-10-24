// Firebase Authentication Controller
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import { verifyIdToken, getUserByUID } from '../config/firebaseMessagingAdmin.js';

/**
 * Generate JWT Token (optional - can use Firebase tokens instead)
 */
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '30d' }
  );
};

/**
 * Create or Update User Profile in MongoDB after Firebase Auth
 * @route POST /api/auth/firebase/profile
 */
export const createOrUpdateUserProfile = async (req, res) => {
  try {
    const { 
      firebaseUID, 
      name, 
      email, 
      phone, 
      age, 
      gender, 
      income, 
      occupation 
    } = req.body;

    // Validate required fields
    if (!firebaseUID || !name || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Please provide firebaseUID, name, email, and phone'
      });
    }

    // Verify Firebase UID (optional - skip if Firebase Admin not properly configured)
    /* Temporarily disabled until Firebase Admin service account is configured
    try {
      await getUserByUID(firebaseUID);
    } catch (error) {
      console.warn('⚠️ Firebase UID verification skipped:', error.message);
    }
    */

    // Check if user already exists
    let user = await User.findOne({ firebaseUID });

    if (user) {
      // Update existing user
      user.name = name;
      user.email = email;
      user.phone = phone;
      user.age = age ? parseInt(age) : user.age;
      user.gender = gender || user.gender;
      user.income = income || user.income;
      user.occupation = occupation || user.occupation;
      user.isVerified = true; // Firebase email is already verified
      
      await user.save();

      return res.status(200).json({
        success: true,
        message: 'User profile updated successfully',
        data: {
          userId: user._id,
          firebaseUID: user.firebaseUID,
          name: user.name,
          email: user.email,
          phone: user.phone,
          age: user.age,
          gender: user.gender,
          income: user.income,
          occupation: user.occupation,
          role: user.role,
          isVerified: user.isVerified,
          token: generateToken(user._id)
        }
      });
    }

    // Create new user
    user = new User({
      firebaseUID,
      name,
      email,
      phone,
      age: age ? parseInt(age) : undefined,
      gender: gender || '',
      income: income || '',
      occupation: occupation || '',
      isVerified: true, // Firebase email is verified
      authProvider: 'firebase'
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User profile created successfully',
      data: {
        userId: user._id,
        firebaseUID: user.firebaseUID,
        name: user.name,
        email: user.email,
        phone: user.phone,
        age: user.age,
        gender: user.gender,
        income: user.income,
        occupation: user.occupation,
        role: user.role,
        isVerified: user.isVerified,
        token
      }
    });

  } catch (error) {
    console.error('Error creating/updating user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create/update user profile',
      error: error.message
    });
  }
};

/**
 * Get User Profile by Firebase UID
 * @route GET /api/auth/firebase/profile/:firebaseUID
 */
export const getUserProfileByUID = async (req, res) => {
  try {
    const { firebaseUID } = req.params;

    if (!firebaseUID) {
      return res.status(400).json({
        success: false,
        message: 'Firebase UID is required'
      });
    }

    const user = await User.findOne({ firebaseUID }).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        userId: user._id,
        firebaseUID: user.firebaseUID,
        name: user.name,
        email: user.email,
        phone: user.phone,
        age: user.age,
        gender: user.gender,
        income: user.income,
        occupation: user.occupation,
        role: user.role,
        isVerified: user.isVerified,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('Error getting user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user profile',
      error: error.message
    });
  }
};

/**
 * Verify Firebase Token and Get/Create User Profile
 * @route POST /api/auth/firebase/verify
 */
export const verifyTokenAndGetProfile = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'Firebase ID token is required'
      });
    }

    // Verify Firebase token
    const decodedToken = await verifyIdToken(idToken);

    if (!decodedToken.success) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    // Find user in MongoDB
    const user = await User.findOne({ firebaseUID: decodedToken.uid }).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found. Please complete registration.',
        needsProfile: true,
        firebaseUID: decodedToken.uid,
        email: decodedToken.email
      });
    }

    // Generate JWT token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Token verified successfully',
      data: {
        userId: user._id,
        firebaseUID: user.firebaseUID,
        name: user.name,
        email: user.email,
        phone: user.phone,
        age: user.age,
        gender: user.gender,
        income: user.income,
        occupation: user.occupation,
        role: user.role,
        isVerified: user.isVerified,
        token
      }
    });

  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify token',
      error: error.message
    });
  }
};

/**
 * Delete User Profile (and Firebase user)
 * @route DELETE /api/auth/firebase/profile/:firebaseUID
 */
export const deleteUserProfile = async (req, res) => {
  try {
    const { firebaseUID } = req.params;

    if (!firebaseUID) {
      return res.status(400).json({
        success: false,
        message: 'Firebase UID is required'
      });
    }

    // Delete from MongoDB
    const user = await User.findOneAndDelete({ firebaseUID });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User profile deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user profile',
      error: error.message
    });
  }
};

export default {
  createOrUpdateUserProfile,
  getUserProfileByUID,
  verifyTokenAndGetProfile,
  deleteUserProfile
};
