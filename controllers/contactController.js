import Contact from '../models/Contact.js';
import { sendEmail, generateContactEmailHTML } from '../utils/emailService.js';

/**
 * Submit a contact form
 * @route POST /api/contact
 */
export const submitContact = async (req, res) => {
  try {
    const { name, email, phone, mobile, state, city, reason, subject, message } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, phone, subject, and message'
      });
    }

    // Create new contact entry
    const contact = new Contact({
      name,
      email,
      phone: phone || mobile, // Accept either phone or mobile
      mobile,
      state,
      city,
      reason,
      subject,
      message
    });

    await contact.save();

    console.log('✅ Contact saved to database:', contact._id);

    // Send email notification to admin
    try {
      console.log('📧 Attempting to send contact email to:', process.env.ADMIN_EMAIL);
      const emailHTML = generateContactEmailHTML(contact);
      const emailResult = await sendEmail({
        to: process.env.ADMIN_EMAIL || 'admin@loanzaar.com',
        subject: `New Contact Form Submission - ${name}`,
        html: emailHTML
      });
      console.log('✅ Contact email sent successfully:', emailResult);
    } catch (emailError) {
      console.error('❌ Contact email sending failed:', emailError.message);
      console.error('Email error details:', emailError);
      // Continue even if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Contact form submitted successfully',
      data: {
        contactId: contact._id
      }
    });

  } catch (error) {
    console.error('Error submitting contact form:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit contact form',
      error: error.message
    });
  }
};

/**
 * Get all contact submissions (Admin only)
 * @route GET /api/contact
 */
export const getAllContacts = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    // Build query
    const query = {};
    if (status) query.status = status;

    // Execute query with pagination
    const contacts = await Contact.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    // Get total count
    const count = await Contact.countDocuments(query);

    res.status(200).json({
      success: true,
      data: contacts,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contact submissions',
      error: error.message
    });
  }
};

/**
 * Update contact status
 * @route PATCH /api/contact/:id
 */
export const updateContactStatus = async (req, res) => {
  try {
    const { status } = req.body;

    // Validate status
    const validStatuses = ['New', 'Contacted', 'Client Not Responded', 'Not Interested'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact submission not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Contact status updated successfully',
      data: contact
    });

  } catch (error) {
    console.error('Error updating contact status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update contact status',
      error: error.message
    });
  }
};

/**
 * Delete contact submission
 * @route DELETE /api/contact/:id
 */
export const deleteContact = async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact submission not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Contact submission deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting contact:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete contact submission',
      error: error.message
    });
  }
};
