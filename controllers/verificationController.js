// Verification Controller
// Handles approval/rejection of temporary data and migration to MongoDB

import {
  getTempDataById,
  updateTempDataStatus,
  deleteTempData,
  getPendingDataByType,
  getTempDataStats
} from '../services/firestoreService.js';
import Loan from '../models/Loan.js';
import User from '../models/User.js';
import Insurance from '../models/Insurance.js';
import Ticket from '../models/Ticket.js';
import SupportThread from '../models/SupportThread.js';
import SupportMessage from '../models/SupportMessage.js';
import { sendNotificationToTopic } from '../config/firebaseMessagingAdmin.js';

/**
 * Get all pending submissions from Firestore
 */
const getPendingSubmissions = async (req, res) => {
  try {
    const { type } = req.query; // Optional: filter by type (loan, insurance, ticket)
    
    if (type) {
      const docs = await getPendingDataByType(type);
      return res.json({ success: true, count: docs.length, data: docs });
    }
    
    // Get all pending submissions
    const stats = await getTempDataStats();
    const loans = await getPendingDataByType('loan');
    const insurances = await getPendingDataByType('insurance');
    const tickets = await getPendingDataByType('ticket');
    
    res.json({
      success: true,
      stats,
      data: {
        loans,
        insurances,
        tickets
      }
    });
  } catch (error) {
    console.error('❌ Error fetching pending submissions:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch submissions', error: error.message });
  }
};

/**
 * Approve and migrate loan to MongoDB
 */
const approveLoan = async (req, res) => {
  try {
    const { docId } = req.params;
    const { adminNotes } = req.body;
    
    console.log(`📝 Approving loan ${docId}`);
    
    // Get document from Firestore
    const tempDoc = await getTempDataById(docId);
    
    if (tempDoc.type !== 'loan') {
      return res.status(400).json({ success: false, message: 'Document is not a loan' });
    }
    
    // Allow approval from pending, processing, or rejected status
    if (tempDoc.status === 'approved') {
      return res.status(400).json({ success: false, message: 'Loan already approved' });
    }
    
    // Get admin ID from either Firebase auth or JWT
    const adminId = req.user?.uid || req.user?.id || null;

    // Resolve createdById (required by Loan schema)
    let createdBy = 'user';
    let createdById = null;

    // If the temporary doc has a Firebase userId, try to map to MongoDB user
    let mongoUser = null;
    if (tempDoc.userId) {
      mongoUser = await User.findOne({ firebaseUID: tempDoc.userId }).select('_id');
      if (mongoUser) {
        createdById = mongoUser._id;
        createdBy = 'user';
      }
    }

    // If we still don't have createdById, use admin's MongoDB id (if JWT admin)
    if (!createdById && req.user?.id) {
      createdById = req.user.id;
      createdBy = 'admin';
    }

    // As a last resort, try to pick any admin user in DB to satisfy required field
    if (!createdById) {
      const anyAdmin = await User.findOne({ role: 'admin' }).select('_id');
      if (anyAdmin) {
        createdById = anyAdmin._id;
        createdBy = 'admin';
      }
    }

    if (!createdById) {
      return res.status(500).json({ success: false, message: 'No MongoDB user found to set createdById; cannot migrate loan' });
    }

    // Ensure consent exists to avoid schema validation failures
    if (typeof tempDoc.formData.consent === 'undefined') {
      tempDoc.formData.consent = true;
    }

    // Create loan in MongoDB (use capitalized status to match enum)
    const loanData = {
      ...tempDoc.formData,
      // Use MongoDB user _id if we found one, otherwise null (do not pass Firebase UID into ObjectId field)
      userId: mongoUser ? mongoUser._id : null,
      status: 'Approved',
      adminNotes: adminNotes || '',
      approvedAt: new Date(),
      approvedBy: adminId || null,
      createdBy,
      createdById,
      createdAt: tempDoc.createdAt?.toDate() || new Date()
    };
    
    // Debug: log loanData shape before creation to help diagnose validation issues
    console.debug('DEBUG: loanData about to be created:', JSON.stringify({
      keys: Object.keys(loanData),
      sample: {
        fullName: loanData.fullName,
        email: loanData.email,
        phone: loanData.phone,
        loanType: loanData.loanType,
        loanAmount: loanData.loanAmount,
        createdById: loanData.createdById ? loanData.createdById.toString() : null,
        consent: loanData.consent
      }
    }));

    let loan;
    try {
      loan = await Loan.create(loanData);
      console.log(`✅ Loan created in MongoDB:`, loan._id);
    } catch (createError) {
      // If Mongoose validation or cast error, return detailed message to caller and log stack
      console.error('❌ Loan.create failed:', createError);
      // Attempt to extract validation errors
      const validationDetails = createError.errors ? Object.keys(createError.errors).map(k => ({ field: k, message: createError.errors[k].message })) : null;
      return res.status(500).json({
        success: false,
        message: 'Failed to approve loan',
        error: createError.message,
        validation: validationDetails,
        loanDataPreview: {
          fullName: loanData.fullName,
          email: loanData.email,
          phone: loanData.phone,
          loanType: loanData.loanType,
          loanAmount: loanData.loanAmount,
          createdBy: loanData.createdBy,
          createdById: loanData.createdById ? loanData.createdById.toString() : null
        }
      });
    }
    
    // Update Firestore status
    await updateTempDataStatus(docId, 'approved', {
      migratedAt: new Date(),
      mongoId: loan._id.toString()
    });
    
    // Send FCM notification to user
    try {
      await sendNotificationToTopic(
        `user_${tempDoc.userId}`,
        '✅ Loan Approved',
        `Your loan application for ₹${tempDoc.formData?.loanAmount || 'N/A'} has been approved!`,
        {
          type: 'loan_approved',
          loanId: loan._id.toString(),
          firestoreDocId: docId
        }
      );
    } catch (fcmError) {
      console.warn('⚠️  FCM notification failed:', fcmError.message);
    }
    
    // Delete from Firestore after successful migration (optional - can keep for audit)
    // await deleteTempData(docId);
    
    res.json({
      success: true,
      message: 'Loan approved and migrated to MongoDB',
      mongoId: loan._id,
      firestoreDocId: docId
    });
  } catch (error) {
    console.error('❌ Error approving loan:', error);
    res.status(500).json({ success: false, message: 'Failed to approve loan', error: error.message });
  }
};

/**
 * Reject loan application
 */
const rejectLoan = async (req, res) => {
  try {
    const { docId } = req.params;
    const { rejectionReason } = req.body;
    
    console.log(`❌ Rejecting loan ${docId}`);
    
    const tempDoc = await getTempDataById(docId);
    
    if (tempDoc.type !== 'loan') {
      return res.status(400).json({ success: false, message: 'Document is not a loan' });
    }
    
    // Get admin ID from either Firebase auth or JWT
    const adminId = req.user?.uid || req.user?.id || 'unknown-admin';
    
    // Update status to rejected
    await updateTempDataStatus(docId, 'rejected', {
      rejectionReason: rejectionReason || 'Not approved',
      rejectedAt: new Date(),
      rejectedBy: adminId
    });
    
    // Send FCM notification to user
    try {
      await sendNotificationToTopic(
        `user_${tempDoc.userId}`,
        '❌ Loan Application Update',
        rejectionReason || 'Your loan application was not approved',
        {
          type: 'loan_rejected',
          firestoreDocId: docId
        }
      );
    } catch (fcmError) {
      console.warn('⚠️  FCM notification failed:', fcmError.message);
    }
    
    res.json({
      success: true,
      message: 'Loan rejected',
      firestoreDocId: docId
    });
  } catch (error) {
    console.error('❌ Error rejecting loan:', error);
    res.status(500).json({ success: false, message: 'Failed to reject loan', error: error.message });
  }
};

/**
 * Approve and migrate insurance to MongoDB
 */
const approveInsurance = async (req, res) => {
  try {
    const { docId } = req.params;
    const { adminNotes } = req.body;
    
    console.log(`📝 Approving insurance ${docId}`);
    
    const tempDoc = await getTempDataById(docId);
    
    if (tempDoc.type !== 'insurance') {
      return res.status(400).json({ success: false, message: 'Document is not an insurance' });
    }
    
    // Get admin ID from either Firebase auth or JWT
    const adminId = req.user?.uid || req.user?.id || null;

    // Resolve createdById (required by Insurance schema)
    let createdBy = 'user';
    let createdById = null;
    let mongoUser = null;

    if (tempDoc.userId) {
      mongoUser = await User.findOne({ firebaseUID: tempDoc.userId }).select('_id');
      if (mongoUser) {
        createdById = mongoUser._id;
        createdBy = 'user';
      }
    }

    // Fallback to admin JWT user id
    if (!createdById && req.user?.id) {
      createdById = req.user.id;
      createdBy = 'admin';
    }

    // As last resort, find any admin
    if (!createdById) {
      const anyAdmin = await User.findOne({ role: 'admin' }).select('_id');
      if (anyAdmin) {
        createdById = anyAdmin._id;
        createdBy = 'admin';
      }
    }

    if (!createdById) {
      return res.status(500).json({ success: false, message: 'No MongoDB user found to set createdById; cannot migrate insurance' });
    }

    // Ensure required fields defaults
    if (typeof tempDoc.formData.consent === 'undefined') {
      tempDoc.formData.consent = true;
    }

    const insuranceData = {
      ...tempDoc.formData,
      // map userId to MongoDB user _id if found
      userId: mongoUser ? mongoUser._id : null,
      status: 'Approved',
      adminNotes: adminNotes || '',
      approvedAt: new Date(),
      approvedBy: adminId || null,
      createdBy,
      createdById,
      createdAt: tempDoc.createdAt?.toDate() || new Date()
    };

    // Debug before create
    console.debug('DEBUG: insuranceData about to be created:', JSON.stringify({
      keys: Object.keys(insuranceData),
      sample: {
        fullName: insuranceData.fullName,
        email: insuranceData.email,
        phone: insuranceData.phone,
        insuranceType: insuranceData.insuranceType,
        coverageAmount: insuranceData.coverageAmount,
        createdById: insuranceData.createdById ? insuranceData.createdById.toString() : null
      }
    }));

    let insurance;
    try {
      insurance = await Insurance.create(insuranceData);
      console.log(`✅ Insurance created in MongoDB:`, insurance._id);
    } catch (createError) {
      console.error('❌ Insurance.create failed:', createError);
      const validationDetails = createError.errors ? Object.keys(createError.errors).map(k => ({ field: k, message: createError.errors[k].message })) : null;
      return res.status(500).json({
        success: false,
        message: 'Failed to approve insurance',
        error: createError.message,
        validation: validationDetails,
        insuranceDataPreview: {
          fullName: insuranceData.fullName,
          email: insuranceData.email,
          phone: insuranceData.phone,
          insuranceType: insuranceData.insuranceType,
          coverageAmount: insuranceData.coverageAmount,
          createdBy: insuranceData.createdBy,
          createdById: insuranceData.createdById ? insuranceData.createdById.toString() : null
        }
      });
    }

    await updateTempDataStatus(docId, 'approved', {
      migratedAt: new Date(),
      mongoId: insurance._id.toString()
    });
    
    // Send FCM notification
    try {
      await sendNotificationToTopic(
        `user_${tempDoc.userId}`,
        '✅ Insurance Application Approved',
        `Your ${tempDoc.formData.insuranceType || 'insurance'} application has been approved!`,
        {
          type: 'insurance_approved',
          insuranceId: insurance._id.toString(),
          firestoreDocId: docId
        }
      );
    } catch (fcmError) {
      console.warn('⚠️  FCM notification failed:', fcmError.message);
    }
    
    res.json({
      success: true,
      message: 'Insurance approved and migrated to MongoDB',
      mongoId: insurance._id,
      firestoreDocId: docId
    });
  } catch (error) {
    console.error('❌ Error approving insurance:', error);
    res.status(500).json({ success: false, message: 'Failed to approve insurance', error: error.message });
  }
};

/**
 * Reject insurance application
 */
const rejectInsurance = async (req, res) => {
  try {
    const { docId } = req.params;
    const { rejectionReason } = req.body;
    
    const tempDoc = await getTempDataById(docId);
    
    if (tempDoc.type !== 'insurance') {
      return res.status(400).json({ success: false, message: 'Document is not an insurance' });
    }
    
    // Get admin ID from either Firebase auth or JWT
    const adminId = req.user?.uid || req.user?.id || 'unknown-admin';
    
    await updateTempDataStatus(docId, 'rejected', {
      rejectionReason: rejectionReason || 'Not approved',
      rejectedAt: new Date(),
      rejectedBy: adminId
    });
    
    // Send FCM notification
    try {
      await sendNotificationToTopic(
        `user_${tempDoc.userId}`,
        '❌ Insurance Application Update',
        rejectionReason || 'Your insurance application was not approved',
        {
          type: 'insurance_rejected',
          firestoreDocId: docId
        }
      );
    } catch (fcmError) {
      console.warn('⚠️  FCM notification failed:', fcmError.message);
    }
    
    res.json({
      success: true,
      message: 'Insurance rejected',
      firestoreDocId: docId
    });
  } catch (error) {
    console.error('❌ Error rejecting insurance:', error);
    res.status(500).json({ success: false, message: 'Failed to reject insurance', error: error.message });
  }
};

/**
 * Approve and migrate ticket to MongoDB
 */
const approveTicket = async (req, res) => {
  try {
    const { docId } = req.params;
    const { adminNotes, priority } = req.body;
    
    console.log(`📝 Approving ticket ${docId}`);
    
    const tempDoc = await getTempDataById(docId);
    
    if (tempDoc.type !== 'ticket') {
      return res.status(400).json({ success: false, message: 'Document is not a ticket' });
    }
    
    // Create ticket in MongoDB
    const ticketData = {
      ...tempDoc.formData,
      userId: tempDoc.userId,
      status: 'open',
      priority: priority || 'medium',
      adminNotes: adminNotes || '',
      createdAt: tempDoc.createdAt?.toDate() || new Date()
    };
    
    const ticket = await Ticket.create(ticketData);
    console.log(`✅ Ticket created in MongoDB:`, ticket._id);
    
    await updateTempDataStatus(docId, 'approved', {
      migratedAt: new Date(),
      mongoId: ticket._id.toString()
    });
    
    // Send FCM notification
    try {
      await sendNotificationToTopic(
        `user_${tempDoc.userId}`,
        '🎫 Support Ticket Created',
        `Your ticket "${tempDoc.formData.subject || 'Support Request'}" has been created`,
        {
          type: 'ticket_created',
          ticketId: ticket._id.toString(),
          firestoreDocId: docId
        }
      );
    } catch (fcmError) {
      console.warn('⚠️  FCM notification failed:', fcmError.message);
    }
    
    res.json({
      success: true,
      message: 'Ticket approved and migrated to MongoDB',
      mongoId: ticket._id,
      firestoreDocId: docId
    });
  } catch (error) {
    console.error('❌ Error approving ticket:', error);
    res.status(500).json({ success: false, message: 'Failed to approve ticket', error: error.message });
  }
};

/**
 * Update status of temporary data (Processing, Pending, etc.)
 * Does not migrate to MongoDB - just updates Firestore status
 */
const updateStatus = async (req, res) => {
  try {
    const { docId } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }
    
    console.log(`📝 Updating status of ${docId} to ${status}`);
    
    const tempDoc = await getTempDataById(docId);
    
    if (!tempDoc) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }
    
    // Update Firestore status
    await updateTempDataStatus(docId, status, {
      updatedAt: new Date()
    });
    
    res.json({
      success: true,
      message: `Status updated to ${status}`,
      firestoreDocId: docId
    });
  } catch (error) {
    console.error('❌ Error updating status:', error);
    res.status(500).json({ success: false, message: 'Failed to update status', error: error.message });
  }
};

export default {
  getPendingSubmissions,
  approveLoan,
  rejectLoan,
  approveInsurance,
  rejectInsurance,
  approveTicket,
  updateStatus
};
