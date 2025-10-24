import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

/**
 * User Schema - Handles user authentication (Admin & Customers)
 */
const userSchema = new mongoose.Schema({
  firebaseUID: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: false, // Not required anymore since Firebase handles auth
    minlength: 8
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  age: {
    type: Number,
    min: 18,
    max: 100
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other', '']
  },
  income: {
    type: String,
    enum: ['<₹2L', '₹2-5L', '₹5-10L', '>₹10L', '']
  },
  occupation: {
    type: String,
    enum: ['Salaried', 'Self-Employed', 'Student', 'Retired', 'Other', '']
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  authProvider: {
    type: String,
    enum: ['firebase', 'legacy'],
    default: 'firebase'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Hash password before saving (only for legacy users)
userSchema.pre('save', async function(next) {
  // Skip password hashing for Firebase users
  if (this.authProvider === 'firebase' || !this.password) {
    return next();
  }
  
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Indexes
// email index is automatically created by unique: true

const User = mongoose.model('User', userSchema);

export default User;
