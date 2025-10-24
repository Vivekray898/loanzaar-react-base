import Insurance from '../models/Insurance.js';

/**
 * Submit a new insurance application
 * @route POST /api/insurance/submit
 */
export const submitInsurance = async (req, res) => {
  try {
    const insuranceData = req.body;

    // Validate required fields
    if (!insuranceData.fullName || !insuranceData.email || !insuranceData.phone) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: fullName, email, phone'
      });
    }

    // Set default values for createdBy
    if (!insuranceData.createdBy) {
      insuranceData.createdBy = 'user';
    }
    
    // Ensure createdById is always set (required field)
    // Priority: createdById > userId > throw error
    if (!insuranceData.createdById) {
      if (insuranceData.userId) {
        insuranceData.createdById = insuranceData.userId;
      } else {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }
    }

    // Create new insurance application
    const insurance = new Insurance(insuranceData);
    await insurance.save();

    console.log('✅ Insurance saved to database:', insurance._id);

    // Send response
    res.status(201).json({
      success: true,
      message: 'Insurance application submitted successfully',
      data: {
        insuranceId: insurance._id,
        insuranceType: insurance.insuranceType,
        status: insurance.status
      }
    });

  } catch (error) {
    console.error('Error submitting insurance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit insurance application',
      error: error.message
    });
  }
};

/**
 * Get all insurance applications (Admin only)
 * @route GET /api/insurance
 */
export const getAllInsurance = async (req, res) => {
  try {
    const { page = 1, limit = 10, insuranceType, status } = req.query;

    // Build query
    const query = {};
    if (insuranceType) query.insuranceType = insuranceType;
    if (status) query.status = status;

    // Execute query with pagination
    const insurances = await Insurance.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    // Get total count
    const count = await Insurance.countDocuments(query);

    res.status(200).json({
      success: true,
      data: insurances,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching insurances:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch insurance applications',
      error: error.message
    });
  }
};

/**
 * Get a single insurance application by ID
 * @route GET /api/insurance/:id
 */
export const getInsuranceById = async (req, res) => {
  try {
    const insurance = await Insurance.findById(req.params.id);

    if (!insurance) {
      return res.status(404).json({
        success: false,
        message: 'Insurance application not found'
      });
    }

    res.status(200).json({
      success: true,
      data: insurance
    });

  } catch (error) {
    console.error('Error fetching insurance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch insurance application',
      error: error.message
    });
  }
};

/**
 * Update insurance application status
 * @route PATCH /api/insurance/:id
 */
export const updateInsuranceStatus = async (req, res) => {
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

    const insurance = await Insurance.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: Date.now() },
      { new: true }
    );

    if (!insurance) {
      return res.status(404).json({
        success: false,
        message: 'Insurance application not found'
      });
    }

    console.log(`✅ Insurance status updated: ${insurance._id} -> ${status}`);

    res.status(200).json({
      success: true,
      message: 'Insurance status updated successfully',
      data: insurance
    });

  } catch (error) {
    console.error('Error updating insurance status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update insurance status',
      error: error.message
    });
  }
};

/**
 * Delete insurance application
 * @route DELETE /api/insurance/:id
 */
export const deleteInsurance = async (req, res) => {
  try {
    const insurance = await Insurance.findByIdAndDelete(req.params.id);

    if (!insurance) {
      return res.status(404).json({
        success: false,
        message: 'Insurance application not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Insurance application deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting insurance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete insurance application',
      error: error.message
    });
  }
};

/**
 * Get user-created insurance applications (for admin dashboard)
 * @route GET /api/insurance/filter/user-created
 */
export const getUserCreatedInsurance = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    // Build query
    const query = { createdBy: 'user' };
    if (status) query.status = status;

    // Execute query with pagination
    const insurances = await Insurance.find(query)
      .populate('userId', 'name email phone')
      .populate('createdById', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    // Get total count
    const count = await Insurance.countDocuments(query);

    res.status(200).json({
      success: true,
      data: insurances,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching user-created insurances:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user-created insurances',
      error: error.message
    });
  }
};

/**
 * Get admin-created insurance applications (for admin dashboard)
 * @route GET /api/insurance/filter/admin-created
 */
export const getAdminCreatedInsurance = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    // Build query
    const query = { createdBy: 'admin' };
    if (status) query.status = status;

    // Execute query with pagination
    const insurances = await Insurance.find(query)
      .populate('userId', 'name email phone')
      .populate('createdById', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    // Get total count
    const count = await Insurance.countDocuments(query);

    res.status(200).json({
      success: true,
      data: insurances,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching admin-created insurances:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admin-created insurances',
      error: error.message
    });
  }
};
