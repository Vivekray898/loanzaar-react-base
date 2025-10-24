import mongoose from 'mongoose';

/**
 * Loan Schema - Handles all types of loan applications
 * Supports: Personal, Home, Business, Education, Gold, Machinery, Solar, Property, Insurance
 */
const loanSchema = new mongoose.Schema({
  // ========== USER REFERENCE ==========
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Optional for backward compatibility with existing loans
  },
  
  // ========== COMMON FIELDS (All Loan Types) ==========
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  cityState: {
    type: String,
    required: true,
    trim: true
  },
  loanType: {
    type: String,
    required: true,
    enum: ['Personal', 'Home', 'Business', 'Education', 'Gold', 'Machinery', 'Solar', 'Property', 'Life Insurance', 'Health Insurance', 'General Insurance']
  },
  loanAmount: {
    type: Number,
    required: true
  },
  tenure: {
    type: String,
    trim: true
  },

  // ========== PERSONAL LOAN FIELDS ==========
  purpose: String, // Personal loan purpose
  monthlyIncome: String,
  employmentType: {
    type: String,
    enum: ['Salaried', 'Self-Employed', 'Business Owner', 'Professional']
  },
  companyName: String,
  existingLoans: {
    type: String,
    enum: ['Yes', 'No']
  },
  creditScore: String,

  // ========== HOME LOAN FIELDS ==========
  age: String,
  propertyType: {
    type: String,
    enum: ['Flat', 'Villa', 'Plot', 'Commercial']
  },
  propertyValue: Number,
  loanPurpose: String, // Purchase, Construction, Renovation
  workExperience: String,

  // ========== BUSINESS LOAN FIELDS ==========
  ageDob: String,
  businessName: String,
  businessType: {
    type: String,
    enum: ['Proprietorship', 'Partnership', 'Private Limited', 'LLP', 'Public Limited']
  },
  industryType: {
    type: String,
    enum: ['Retail', 'Manufacturing', 'Services', 'Trading', 'Healthcare', 'IT', 'Construction', 'Agriculture', 'Other']
  },
  yearsInBusiness: String,
  businessAddress: String,
  gstNo: String,
  turnover: String,
  profit: String,
  bankStatement: {
    type: String,
    enum: ['Yes', 'No']
  },
  itrFiled: {
    type: String,
    enum: ['Yes', 'No']
  },

  // ========== EDUCATION LOAN FIELDS ==========
  dobAge: String,
  qualification: {
    type: String,
    enum: ['10th', '12th', 'Diploma', 'Undergraduate', 'Postgraduate', 'Doctorate']
  },
  courseName: String,
  courseType: {
    type: String,
    enum: ['Undergraduate', 'Postgraduate', 'Diploma', 'Certificate', 'Doctorate']
  },
  institutionName: String,
  institutionCountry: {
    type: String,
    enum: ['India', 'USA', 'UK', 'Canada', 'Australia', 'Germany', 'Other']
  },
  courseDuration: String,
  admissionStatus: {
    type: String,
    enum: ['Applied', 'Admitted', 'Offer Letter Received']
  },
  courseCost: String,
  coApplicantName: String,
  relation: {
    type: String,
    enum: ['Father', 'Mother', 'Guardian', 'Spouse', 'Other']
  },
  occupation: {
    type: String,
    enum: ['Salaried', 'Self-Employed', 'Business', 'Retired', 'Other']
  },

  // ========== GOLD LOAN FIELDS ==========
  goldWeight: String,
  goldPurity: {
    type: String,
    enum: ['18K', '22K', '24K']
  },
  goldType: {
    type: String,
    enum: ['Jewelry', 'Coins', 'Bars']
  },

  // ========== MACHINERY LOAN FIELDS ==========
  machineryType: {
    type: String,
    enum: ['Construction', 'Manufacturing', 'Agriculture', 'IT Equipment', 'Medical Equipment', 'Other']
  },
  machineryValue: Number,
  machineryAge: {
    type: String,
    enum: ['New', 'Used (1-3 years)', 'Used (3-5 years)', 'Used (5+ years)']
  },
  vendorName: String,
  usageType: {
    type: String,
    enum: ['Own Business', 'Rental', 'Contract Work']
  },

  // ========== SOLAR LOAN FIELDS ==========
  roofType: {
    type: String,
    enum: ['RCC', 'Tin', 'Asbestos', 'Tile']
  },
  systemCapacity: String, // in kW
  ownershipType: {
    type: String,
    enum: ['Owned', 'Rented', 'Leased']
  },
  electricityBill: String,
  location: String,

  // ========== PROPERTY LOAN FIELDS ==========
  propertyLocation: String,
  marketValue: Number,
  constructionYear: String,
  propertyDocuments: {
    type: String,
    enum: ['Yes', 'No']
  },

  // ========== INSURANCE FIELDS ==========
  insuranceType: {
    type: String,
    enum: ['Life Insurance', 'Health Insurance', 'General Insurance', '']
  },
  coverageAmount: String,
  ageDOB: String,
  assetType: String, // For General Insurance

  // ========== CONSENT & METADATA ==========
  consent: {
    type: Boolean,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Processing', 'Approved', 'Rejected'],
    default: 'Pending'
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

// Indexes for faster queries
loanSchema.index({ email: 1 });
loanSchema.index({ userId: 1 });
loanSchema.index({ loanType: 1 });
loanSchema.index({ status: 1 });
loanSchema.index({ createdBy: 1 });
loanSchema.index({ createdById: 1 });
loanSchema.index({ createdAt: -1 });

const Loan = mongoose.model('Loan', loanSchema);

export default Loan;
