import express from 'express';
import Insurance from '../models/Insurance.js';
import { sendEmail } from '../utils/emailService.js';

const router = express.Router();

/**
 * @route   POST /api/insurance/submit
 * @desc    Submit insurance inquiry
 * @access  Public
 */
router.post('/submit', async (req, res) => {
  try {
    console.log('📨 Insurance inquiry received:', req.body);

    const {
      fullName,
      email,
      phone,
      age,
      insuranceType,
      coverageAmount,
      insuranceTerm,
      employmentType,
      monthlyIncome,
      cityState,
      medicalHistory,
      existingPolicies,
      remarks,
      userId,
      createdBy,
      createdById,
      captchaToken
    } = req.body;

    // Validate required fields
    if (!fullName || !email || !phone) {
      return res.status(400).json({
        success: false,
        error: 'Full name, email, and phone are required'
      });
    }

    // Validate createdById is provided
    if (!createdById) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    // Create new insurance inquiry
    const insurance = new Insurance({
      fullName,
      email,
      phone,
      age: age ? parseInt(age) : undefined,
      insuranceType: insuranceType || 'All Insurance',
      coverageAmount,
      insuranceTerm,
      employmentType,
      monthlyIncome,
      cityState,
      medicalHistory,
      existingPolicies,
      remarks,
      userId: userId || createdById,
      createdBy: createdBy || 'user',
      createdById: createdById,
      status: 'Pending'
    });

    // Save to database
    await insurance.save();

    console.log('✅ Insurance inquiry saved:', insurance._id);

    // Send email notification to admin
    try {
      const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
      
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #ef4444; margin-bottom: 20px; border-bottom: 2px solid #ef4444; padding-bottom: 10px;">
              🔔 New Insurance Inquiry Received
            </h2>
            
            <div style="background-color: #fef2f2; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
              <p style="margin: 0; color: #991b1b; font-weight: bold;">
                📋 Inquiry ID: ${insurance._id}
              </p>
              <p style="margin: 5px 0 0 0; color: #991b1b;">
                🕒 Submitted: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
              </p>
            </div>
            
            <h3 style="color: #333; margin-top: 25px; margin-bottom: 15px; border-bottom: 1px solid #e5e5e5; padding-bottom: 8px;">
              👤 Customer Information
            </h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold; width: 40%;">Full Name:</td>
                <td style="padding: 8px 0; color: #333;">${fullName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Email:</td>
                <td style="padding: 8px 0; color: #333;">
                  <a href="mailto:${email}" style="color: #ef4444; text-decoration: none;">${email}</a>
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Phone:</td>
                <td style="padding: 8px 0; color: #333;">
                  <a href="tel:${phone}" style="color: #ef4444; text-decoration: none;">${phone}</a>
                </td>
              </tr>
              ${age ? `
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Age:</td>
                <td style="padding: 8px 0; color: #333;">${age} years</td>
              </tr>
              ` : ''}
              ${cityState ? `
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Location:</td>
                <td style="padding: 8px 0; color: #333;">${cityState}</td>
              </tr>
              ` : ''}
            </table>
            
            <h3 style="color: #333; margin-top: 25px; margin-bottom: 15px; border-bottom: 1px solid #e5e5e5; padding-bottom: 8px;">
              🏥 Insurance Details
            </h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold; width: 40%;">Insurance Type:</td>
                <td style="padding: 8px 0; color: #333;">
                  <span style="background-color: #dbeafe; color: #1e40af; padding: 4px 12px; border-radius: 4px; font-weight: bold;">
                    ${insuranceType || 'All Insurance'}
                  </span>
                </td>
              </tr>
              ${coverageAmount ? `
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Coverage Amount:</td>
                <td style="padding: 8px 0; color: #333;">${coverageAmount}</td>
              </tr>
              ` : ''}
              ${insuranceTerm ? `
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Insurance Term:</td>
                <td style="padding: 8px 0; color: #333;">${insuranceTerm}</td>
              </tr>
              ` : ''}
              ${employmentType ? `
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Employment Type:</td>
                <td style="padding: 8px 0; color: #333;">${employmentType}</td>
              </tr>
              ` : ''}
              ${monthlyIncome ? `
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Monthly Income:</td>
                <td style="padding: 8px 0; color: #333;">${monthlyIncome}</td>
              </tr>
              ` : ''}
            </table>
            
            ${medicalHistory || existingPolicies || remarks ? `
            <h3 style="color: #333; margin-top: 25px; margin-bottom: 15px; border-bottom: 1px solid #e5e5e5; padding-bottom: 8px;">
              📝 Additional Information
            </h3>
            <table style="width: 100%; border-collapse: collapse;">
              ${medicalHistory ? `
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold; width: 40%; vertical-align: top;">Medical History:</td>
                <td style="padding: 8px 0; color: #333;">${medicalHistory}</td>
              </tr>
              ` : ''}
              ${existingPolicies ? `
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold; vertical-align: top;">Existing Policies:</td>
                <td style="padding: 8px 0; color: #333;">${existingPolicies}</td>
              </tr>
              ` : ''}
              ${remarks ? `
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold; vertical-align: top;">Remarks:</td>
                <td style="padding: 8px 0; color: #333;">${remarks}</td>
              </tr>
              ` : ''}
            </table>
            ` : ''}
            
            <div style="margin-top: 30px; padding: 20px; background-color: #f0f9ff; border-left: 4px solid #3b82f6; border-radius: 4px;">
              <p style="margin: 0; color: #1e40af; font-weight: bold;">⚡ Quick Actions</p>
              <p style="margin: 10px 0 0 0; color: #1e3a8a;">
                Please review this inquiry and contact the customer within 24 hours.
              </p>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e5e5; text-align: center; color: #666; font-size: 12px;">
              <p style="margin: 0;">This is an automated notification from LoanZaar Insurance System</p>
              <p style="margin: 5px 0 0 0;">📧 Sent on ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
            </div>
          </div>
        </div>
      `;

      await sendEmail({
        to: adminEmail,
        subject: `🔔 New ${insuranceType || 'Insurance'} Inquiry from ${fullName}`,
        html: emailHtml
      });

      console.log('📧 Admin notification email sent to:', adminEmail);

    } catch (emailError) {
      // Log email error but don't fail the request
      console.error('⚠️ Failed to send admin notification email:', emailError.message);
    }

    res.status(201).json({
      success: true,
      message: 'Insurance inquiry submitted successfully',
      data: {
        id: insurance._id,
        insuranceType: insurance.insuranceType,
        status: insurance.status
      }
    });

  } catch (error) {
    console.error('❌ Insurance submission error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: errors.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to submit insurance inquiry. Please try again.'
    });
  }
});

/**
 * @route   GET /api/insurance
 * @desc    Get all insurance inquiries (admin)
 * @access  Private/Admin
 */
router.get('/', async (req, res) => {
  try {
    const { status, insuranceType, page = 1, limit = 10 } = req.query;

    // Build query
    const query = {};
    if (status) query.status = status;
    if (insuranceType) query.insuranceType = insuranceType;

    // Get total count
    const total = await Insurance.countDocuments(query);

    // Get paginated results
    const insurances = await Insurance.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    res.json({
      success: true,
      data: insurances,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('❌ Get insurances error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch insurance inquiries'
    });
  }
});

/**
 * @route   GET /api/insurance/:id
 * @desc    Get single insurance inquiry
 * @access  Private
 */
router.get('/:id', async (req, res) => {
  try {
    const insurance = await Insurance.findById(req.params.id);

    if (!insurance) {
      return res.status(404).json({
        success: false,
        error: 'Insurance inquiry not found'
      });
    }

    res.json({
      success: true,
      data: insurance
    });

  } catch (error) {
    console.error('❌ Get insurance error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch insurance inquiry'
    });
  }
});

/**
 * @route   PUT /api/insurance/:id/status
 * @desc    Update insurance inquiry status
 * @access  Private/Admin
 */
router.put('/:id/status', async (req, res) => {
  try {
    const { status, remarks } = req.body;

    // Validate status
    const validStatuses = ['Pending', 'Processing', 'Approved', 'Rejected'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed values: ${validStatuses.join(', ')}`
      });
    }

    const insurance = await Insurance.findById(req.params.id);

    if (!insurance) {
      return res.status(404).json({
        success: false,
        error: 'Insurance inquiry not found'
      });
    }

    if (status) insurance.status = status;
    if (remarks) insurance.remarks = remarks;
    insurance.updatedAt = Date.now();

    await insurance.save();

    console.log('✅ Insurance status updated:', insurance._id, '→', status);

    res.json({
      success: true,
      message: 'Insurance inquiry status updated',
      data: insurance
    });

  } catch (error) {
    console.error('❌ Update insurance status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update insurance inquiry status',
      message: error.message
    });
  }
});

/**
 * @route   PATCH /api/insurance/:id
 * @desc    Update insurance application status
 * @access  Private/Admin
 */
router.patch('/:id', async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required'
      });
    }

    const validStatuses = ['Pending', 'Processing', 'Approved', 'Rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const insurance = await Insurance.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: new Date() },
      { new: true }
    );

    if (!insurance) {
      return res.status(404).json({
        success: false,
        error: 'Insurance inquiry not found'
      });
    }

    console.log(`✅ Insurance ${req.params.id} status updated to ${status}`);

    res.json({
      success: true,
      message: 'Insurance status updated successfully',
      data: insurance
    });

  } catch (error) {
    console.error('❌ Update insurance error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update insurance status'
    });
  }
});

/**
 * @route   DELETE /api/insurance/:id
 * @desc    Delete insurance inquiry
 * @access  Private/Admin
 */
router.delete('/:id', async (req, res) => {
  try {
    const insurance = await Insurance.findById(req.params.id);

    if (!insurance) {
      return res.status(404).json({
        success: false,
        error: 'Insurance inquiry not found'
      });
    }

    await insurance.deleteOne();

    console.log('✅ Insurance inquiry deleted:', req.params.id);

    res.json({
      success: true,
      message: 'Insurance inquiry deleted successfully'
    });

  } catch (error) {
    console.error('❌ Delete insurance error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete insurance inquiry'
    });
  }
});

/**
 * @route   GET /api/insurance/filter/admin-created
 * @desc    Get admin-created insurance applications
 * @access  Public
 */
router.get('/filter/admin-created', async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    // Build query for admin-created insurance
    const query = { createdBy: 'admin' };
    if (status) {
      query.status = status;
    }

    const applications = await Insurance.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Insurance.countDocuments(query);
    const pages = Math.ceil(total / limit);

    console.log(`📊 Found ${applications.length} admin-created insurance applications (page ${page})`);

    res.json({
      success: true,
      data: applications,
      pagination: {
        total,
        page: parseInt(page),
        pages,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('❌ Error fetching admin-created insurance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch admin-created insurance applications'
    });
  }
});

/**
 * @route   GET /api/insurance/filter/user-created
 * @desc    Get user-created insurance applications
 * @access  Public
 */
router.get('/filter/user-created', async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    // Build query for user-created insurance
    const query = { createdBy: 'user' };
    if (status) {
      query.status = status;
    }

    const applications = await Insurance.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Insurance.countDocuments(query);
    const pages = Math.ceil(total / limit);

    console.log(`📊 Found ${applications.length} user-created insurance applications (page ${page})`);

    res.json({
      success: true,
      data: applications,
      pagination: {
        total,
        page: parseInt(page),
        pages,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('❌ Error fetching user-created insurance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user-created insurance applications'
    });
  }
});

export default router;
