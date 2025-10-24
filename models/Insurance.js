import mongoose from 'mongoose';

/**
 * Insurance Schema - Handles insurance inquiries
 */
const insuranceSchema = new mongoose.Schema({
  // Personal Information
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  age: {
    type: Number,
    min: 18,
    max: 100
  },
  
  // Insurance Details
  insuranceType: {
    type: String,
    required: [true, 'Insurance type is required'],
    enum: ['Life Insurance', 'Health Insurance', 'General Insurance', 'All Insurance', '']
  },
  coverageAmount: {
    type: String,
    trim: true
  },
  insuranceTerm: {
    type: String,
    trim: true
  },
  
  // Employment Details
  employmentType: {
    type: String,
    enum: ['Salaried', 'Self-Employed', 'Business Owner', 'Professional', '']
  },
  monthlyIncome: {
    type: String,
    trim: true
  },
  
  // Additional Information
  cityState: {
    type: String,
    trim: true
  },
  medicalHistory: {
    type: String,
    trim: true
  },
  existingPolicies: {
    type: String,
    trim: true
  },
  remarks: {
    type: String,
    trim: true
  },
  
  // Application Status
  status: {
    type: String,
    enum: ['Pending', 'Processing', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  
  // User Reference (optional - for logged-in users)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  
  // ========== CREATION TRACKING ==========
  createdBy: {
    type: String,
    enum: ['admin', 'user'],
    required: true,
    default: 'user'
  },
  createdById: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
insuranceSchema.index({ email: 1 });
insuranceSchema.index({ phone: 1 });
insuranceSchema.index({ status: 1 });
insuranceSchema.index({ createdAt: -1 });
insuranceSchema.index({ userId: 1 });
insuranceSchema.index({ createdBy: 1 });
insuranceSchema.index({ createdById: 1 });

const Insurance = mongoose.model('Insurance', insuranceSchema);

export default Insurance;
