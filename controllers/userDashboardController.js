import User from '../models/User.js';
import Loan from '../models/Loan.js';
import SupportMessage from '../models/SupportMessage.js';

/**
 * Get User Dashboard Stats
 * @route GET /api/users/dashboard/stats
 */
export const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all user's loans
    const loans = await Loan.find({ userId });
    // Get all user's insurance applications
    const Insurance = (await import('../models/Insurance.js')).default;
    const insurances = await Insurance.find({ userId });

    // Calculate statistics (loans + insurances)
    const stats = {
      totalApplications: loans.length + insurances.length,
      loanApplications: loans.length,
      insuranceApplications: insurances.length,
      activeLoans: loans.filter(l => l.status === 'Approved').length,
      pendingApplications: loans.filter(l => l.status === 'Pending').length,
      approvedLoans: loans.filter(l => l.status === 'Approved').length,
      rejectedLoans: loans.filter(l => l.status === 'Rejected').length,
      inProgressLoans: loans.filter(l => l.status === 'In Progress').length,
      activeInsurances: insurances.filter(i => i.status === 'Approved').length,
      pendingInsurances: insurances.filter(i => i.status === 'Pending').length,
      approvedInsurances: insurances.filter(i => i.status === 'Approved').length,
      rejectedInsurances: insurances.filter(i => i.status === 'Rejected').length,
      inProgressInsurances: insurances.filter(i => i.status === 'Processing').length
    };

    // Get support messages count
    const supportMessages = await SupportMessage.find({ userId });
    stats.totalMessages = supportMessages.length;
    stats.openMessages = supportMessages.filter(m => m.status === 'Open').length;

    // Recent applications (last 5 loans + last 5 insurances)
    const recentLoans = await Loan.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('loanType loanAmount status createdAt');
    const recentInsurances = await Insurance.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('insuranceType coverageAmount status createdAt');

    // Merge and sort by createdAt (most recent first)
    const recentApplications = [...recentLoans.map(l => ({ ...l.toObject(), type: 'loan' })), ...recentInsurances.map(i => ({ ...i.toObject(), type: 'insurance' }))]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    res.json({
      success: true,
      data: {
        stats,
        recentApplications
      }
    });

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: error.message
    });
  }
};

/**
 * Get User Profile
 * @route GET /api/users/me
 */
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile',
      error: error.message
    });
  }
};

/**
 * Update User Profile
 * @route PUT /api/users/update-profile
 */
export const updateUserProfile = async (req, res) => {
  try {
    const { fullName, phone, age, gender, income, occupation, state, city } = req.body;

    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update fields
    if (fullName) user.fullName = fullName;
    if (phone) user.phone = phone;
    if (age) user.age = age;
    if (gender) user.gender = gender;
    if (income) user.income = income;
    if (occupation) user.occupation = occupation;
    if (state) user.state = state;
    if (city) user.city = city;

    await user.save();

    // Return user without password
    const updatedUser = await User.findById(user._id).select('-password');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    });

  } catch (error) {
    console.error('Update user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user profile',
      error: error.message
    });
  }
};

/**
 * Apply for Loan
 * @route POST /api/loans/apply
 */
export const applyForLoan = async (req, res) => {
  try {
    console.log('🔍 Apply for loan - Request received');
    console.log('User from auth:', req.user);
    console.log('Request body:', req.body);

    const userId = req.user.id;
    const loanData = req.body;

    console.log('📝 Creating loan with data:', { userId, ...loanData });

    // Create new loan application with required fields
    const loan = new Loan({
      ...loanData,
      userId,
      createdBy: 'user',        // Mark as user-created
      createdById: userId,      // Track which user created it
      status: 'Pending'
    });

    console.log('💾 Saving loan to database...');
    await loan.save();

    console.log('✅ Loan saved successfully:', loan._id);

    res.status(201).json({
      success: true,
      message: 'Loan application submitted successfully',
      data: loan
    });

  } catch (error) {
    console.error('❌ Apply for loan error:', error);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: 'Failed to submit loan application',
      error: error.message
    });
  }
};

/**
 * Apply for Insurance
 * @route POST /api/user-dashboard/insurance/apply
 */
export const applyForInsurance = async (req, res) => {
  try {
    console.log('🔍 Apply for insurance - Request received');
    console.log('User from auth:', req.user);
    console.log('Request body:', req.body);

    const userId = req.user.id;
    const insuranceData = req.body;

    console.log('📝 Creating insurance with data:', { userId, ...insuranceData });

    // Import Insurance model
    const Insurance = (await import('../models/Insurance.js')).default;

    // Create new insurance application with required fields
    const insurance = new Insurance({
      ...insuranceData,
      userId,
      createdBy: 'user',        // Mark as user-created
      createdById: userId,      // Track which user created it
      status: 'Pending'
    });

    console.log('💾 Saving insurance to database...');
    await insurance.save();

    console.log('✅ Insurance saved successfully:', insurance._id);

    res.status(201).json({
      success: true,
      message: 'Insurance application submitted successfully',
      data: insurance
    });

  } catch (error) {
    console.error('❌ Apply for insurance error:', error);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: 'Failed to submit insurance application',
      error: error.message
    });
  }
};

/**
 * Get User's Loan Applications
 * @route GET /api/loans/my-applications
 */
export const getMyApplications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, loanType, page = 1, limit = 10 } = req.query;

    // Build query
    const query = { userId };
    if (status) query.status = status;
    if (loanType) query.loanType = loanType;

    // Pagination
    const skip = (page - 1) * limit;

    const loans = await Loan.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Loan.countDocuments(query);

    res.json({
      success: true,
      data: {
        loans,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get my applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch loan applications',
      error: error.message
    });
  }
};

/**
 * Get My Insurance Applications
 * @route GET /api/user-dashboard/insurance/my-applications
 */
export const getMyInsuranceApplications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, insuranceType, page = 1, limit = 10 } = req.query;

    // Build query
    const query = { userId };
    if (status) query.status = status;
    if (insuranceType) query.insuranceType = insuranceType;

    // Pagination
    const skip = (page - 1) * limit;

    const Insurance = (await import('../models/Insurance.js')).default;
    const insurances = await Insurance.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Insurance.countDocuments(query);

    res.json({
      success: true,
      data: {
        insurances,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get my insurance applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch insurance applications',
      error: error.message
    });
  }
};

/**
 * Get Single Loan Application
 * @route GET /api/loans/:id
 */
export const getLoanById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const loan = await Loan.findOne({ _id: id, userId });

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan application not found'
      });
    }

    res.json({
      success: true,
      data: loan
    });

  } catch (error) {
    console.error('Get loan by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch loan application',
      error: error.message
    });
  }
};

/**
 * Update Loan Application (only if pending)
 * @route PUT /api/loans/:id
 */
export const updateLoanApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const updates = req.body;

    const loan = await Loan.findOne({ _id: id, userId });

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan application not found'
      });
    }

    // Only allow updates if status is Pending
    if (loan.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update loan application after it has been processed'
      });
    }

    // Update loan
    Object.assign(loan, updates);
    await loan.save();

    res.json({
      success: true,
      message: 'Loan application updated successfully',
      data: loan
    });

  } catch (error) {
    console.error('Update loan application error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update loan application',
      error: error.message
    });
  }
};

/**
 * Submit Support Message
 * @route POST /api/users/support
 */
export const submitSupportMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { subject, message } = req.body;

    if (!subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Subject and message are required'
      });
    }

    const supportMessage = new SupportMessage({
      userId,
      subject,
      message,
      status: 'Open'
    });

    await supportMessage.save();

    res.status(201).json({
      success: true,
      message: 'Support message submitted successfully',
      data: supportMessage
    });

  } catch (error) {
    console.error('Submit support message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit support message',
      error: error.message
    });
  }
};

/**
 * Get User's Support Messages
 * @route GET /api/users/support
 */
export const getSupportMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;

    // Build query
    const query = { userId };
    if (status) query.status = status;

    // Pagination
    const skip = (page - 1) * limit;

    const messages = await SupportMessage.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await SupportMessage.countDocuments(query);

    res.json({
      success: true,
      data: {
        messages,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get support messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch support messages',
      error: error.message
    });
  }
};
