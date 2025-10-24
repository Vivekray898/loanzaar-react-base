import Loan from '../models/Loan.js';
import { sendEmail, generateLoanEmailHTML } from '../utils/emailService.js';

/**
 * Submit a new loan application
 * @route POST /api/loans
 */
export const submitLoan = async (req, res) => {
  try {
    // Extract loan data from request body
    const loanData = req.body;

    // Validate required fields
    if (!loanData.fullName || !loanData.email || !loanData.phone || !loanData.loanType) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: fullName, email, phone, loanType'
      });
    }

    // Create new loan application
    const loan = new Loan(loanData);
    await loan.save();

    console.log('✅ Loan saved to database:', loan._id);

    // Send email notification to admin
    try {
      console.log('📧 Attempting to send email to:', process.env.ADMIN_EMAIL);
      const emailHTML = generateLoanEmailHTML(loan);
      const emailResult = await sendEmail({
        to: process.env.ADMIN_EMAIL || 'admin@loanzaar.com',
        subject: `New ${loanData.loanType} Loan Application - ${loanData.fullName}`,
        html: emailHTML
      });
      console.log('✅ Email sent successfully:', emailResult);
    } catch (emailError) {
      console.error('❌ Email sending failed:', emailError.message);
      console.error('Email error details:', emailError);
      // Continue even if email fails
    }

    // Send response
    res.status(201).json({
      success: true,
      message: 'Loan application submitted successfully',
      data: {
        loanId: loan._id,
        loanType: loan.loanType,
        status: loan.status
      }
    });

  } catch (error) {
    console.error('Error submitting loan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit loan application',
      error: error.message
    });
  }
};

/**
 * Get all loan applications (Admin only)
 * @route GET /api/loans
 */
export const getAllLoans = async (req, res) => {
  try {
    const { page = 1, limit = 10, loanType, status } = req.query;

    // Build query
    const query = {};
    if (loanType) query.loanType = loanType;
    if (status) query.status = status;

    // Execute query with pagination
    const loans = await Loan.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    // Get total count
    const count = await Loan.countDocuments(query);

    res.status(200).json({
      success: true,
      data: loans,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching loans:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch loan applications',
      error: error.message
    });
  }
};

/**
 * Get a single loan application by ID
 * @route GET /api/loans/:id
 */
export const getLoanById = async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id);

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan application not found'
      });
    }

    res.status(200).json({
      success: true,
      data: loan
    });

  } catch (error) {
    console.error('Error fetching loan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch loan application',
      error: error.message
    });
  }
};

/**
 * Update loan application status
 * @route PATCH /api/loans/:id
 */
export const updateLoanStatus = async (req, res) => {
  try {
    const { status } = req.body;

    // Validate status
    const validStatuses = ['Pending', 'Processing', 'Approved', 'Rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value. Must be one of: Pending, Processing, Approved, Rejected'
      });
    }

    const loan = await Loan.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: Date.now() },
      { new: true }
    );

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan application not found'
      });
    }

    console.log(`✅ Loan status updated: ${loan._id} -> ${status}`);

    res.status(200).json({
      success: true,
      message: 'Loan status updated successfully',
      data: loan
    });

  } catch (error) {
    console.error('Error updating loan status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update loan status',
      error: error.message
    });
  }
};

/**
 * Delete loan application
 * @route DELETE /api/loans/:id
 */
export const deleteLoan = async (req, res) => {
  try {
    const loan = await Loan.findByIdAndDelete(req.params.id);

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan application not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Loan application deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting loan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete loan application',
      error: error.message
    });
  }
};

/**
 * Get user-created loan applications (for admin dashboard)
 * @route GET /api/loans/filter/user-created
 */
export const getUserCreatedLoans = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    // Build query
    const query = { createdBy: 'user' };
    if (status) query.status = status;

    // Execute query with pagination
    const loans = await Loan.find(query)
      .populate('userId', 'name email phone')
      .populate('createdById', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    // Get total count
    const count = await Loan.countDocuments(query);

    res.status(200).json({
      success: true,
      data: loans,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching user-created loans:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user-created loans',
      error: error.message
    });
  }
};

/**
 * Get admin-created loan applications (for admin dashboard)
 * @route GET /api/loans/filter/admin-created
 */
export const getAdminCreatedLoans = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    // Build query
    const query = { createdBy: 'admin' };
    if (status) query.status = status;

    // Execute query with pagination
    const loans = await Loan.find(query)
      .populate('userId', 'name email phone')
      .populate('createdById', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    // Get total count
    const count = await Loan.countDocuments(query);

    res.status(200).json({
      success: true,
      data: loans,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching admin-created loans:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admin-created loans',
      error: error.message
    });
  }
};
