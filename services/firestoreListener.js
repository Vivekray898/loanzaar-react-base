/**
 * Firestore Listener Service
 * 
 * Monitors Firestore collections for new document additions and triggers email notifications
 * Collections monitored:
 * - admin_loans: Loan applications
 * - admin_insurance: Insurance applications
 * - admin_messages: Contact form submissions
 * - cibil_score: CIBIL score requests
 */

import admin from 'firebase-admin';
import { sendEmailSmart } from '../utils/emailRelay.js';

let firestoreDb = null;
let isInitialLoad = true;

// Track processed document IDs to prevent duplicate emails on server restart
const processedDocs = {
  loans: new Set(),
  insurance: new Set(),
  messages: new Set(),
  creditCards: new Set(),
  cibilScore: new Set()
};

/**
 * Helper function to format Firestore Timestamp to readable date string
 */
const formatTimestamp = (timestamp) => {
  if (!timestamp) return new Date().toLocaleString('en-IN', { 
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short'
  });
  
  // Check if it's a Firestore Timestamp
  if (timestamp && timestamp.toDate && typeof timestamp.toDate === 'function') {
    return timestamp.toDate().toLocaleString('en-IN', { 
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  }
  
  // Check if it's already a Date object
  if (timestamp instanceof Date) {
    return timestamp.toLocaleString('en-IN', { 
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  }
  
  // Try to parse as date string
  try {
    return new Date(timestamp).toLocaleString('en-IN', { 
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  } catch (e) {
    return new Date().toLocaleString('en-IN', { 
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  }
};

/**
 * Initialize Firestore listener service
 */
export const initializeFirestoreListeners = () => {
  try {
    // Get Firestore instance from already initialized Firebase Admin
    firestoreDb = admin.firestore();
    
    if (!firestoreDb) {
      console.warn('⚠️  Firestore not available - email notifications will not work');
      return;
    }

    console.log('🔥 Initializing Firestore listeners for email notifications...');
    
    // Set up listeners for each collection
    setupLoanListener();
    setupInsuranceListener();
    setupMessageListener();
    setupCreditCardListener();
    setupCibilScoreListener();
    
    // Mark initial load complete after 5 seconds
    setTimeout(() => {
      isInitialLoad = false;
      console.log('✅ Initial document load complete - now monitoring for new submissions only');
    }, 5000);
    
    console.log('✅ Firestore listeners initialized successfully');
    console.log('📧 Email notifications enabled for: admin_loans, admin_insurance, admin_messages, other_data, cibil_score');
    
  } catch (error) {
    console.error('❌ Error initializing Firestore listeners:', error.message);
  }
};

/**
 * Setup listener for loan applications (admin_loans collection)
 */
const setupLoanListener = () => {
  const collectionRef = firestoreDb.collection('admin_loans');
  
  collectionRef.onSnapshot((snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        const docData = change.doc.data();
        const docId = change.doc.id;
        
        // Skip if this is initial load or document already processed
        if (isInitialLoad || processedDocs.loans.has(docId)) {
          processedDocs.loans.add(docId); // Track it anyway
          return;
        }
        
        console.log(`🆕 New loan application detected: ${docId}`);
        console.log('📄 Loan data:', JSON.stringify(docData, null, 2)); // Debug log
        
        processedDocs.loans.add(docId);
        // Extract formData from wrapper if it exists
        const loanData = docData.formData || docData;
        sendLoanEmail(loanData, docId);
      }
    });
  }, (error) => {
    console.error('❌ Error in loan listener:', error.message);
  });
  
  console.log('👂 Listening to admin_loans collection...');
};

/**
 * Setup listener for insurance applications (admin_insurance collection)
 */
const setupInsuranceListener = () => {
  const collectionRef = firestoreDb.collection('admin_insurance');
  
  collectionRef.onSnapshot((snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        const docData = change.doc.data();
        const docId = change.doc.id;
        
        // Skip if this is initial load or document already processed
        if (isInitialLoad || processedDocs.insurance.has(docId)) {
          processedDocs.insurance.add(docId); // Track it anyway
          return;
        }
        
        console.log(`🆕 New insurance application detected: ${docId}`);
        console.log('📄 Insurance data:', JSON.stringify(docData, null, 2)); // Debug log
        
        processedDocs.insurance.add(docId);
        // Extract formData from wrapper if it exists
        const insuranceData = docData.formData || docData;
        sendInsuranceEmail(insuranceData, docId);
      }
    });
  }, (error) => {
    console.error('❌ Error in insurance listener:', error.message);
  });
  
  console.log('👂 Listening to admin_insurance collection...');
};

/**
 * Setup listener for contact messages (admin_messages collection)
 */
const setupMessageListener = () => {
  const collectionRef = firestoreDb.collection('admin_messages');
  
  collectionRef.onSnapshot((snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        const docData = change.doc.data();
        const docId = change.doc.id;
        
        // Skip if this is initial load or document already processed
        if (isInitialLoad || processedDocs.messages.has(docId)) {
          processedDocs.messages.add(docId); // Track it anyway
          return;
        }
        
        console.log(`🆕 New contact message detected: ${docId}`);
        console.log('📄 Message data:', JSON.stringify(docData, null, 2)); // Debug log
        
        processedDocs.messages.add(docId);
        // Extract formData from wrapper if it exists
        const messageData = docData.formData || docData;
        sendMessageEmail(messageData, docId);
      }
    });
  }, (error) => {
    console.error('❌ Error in message listener:', error.message);
  });
  
  console.log('👂 Listening to admin_messages collection...');
};

/**
 * Setup listener for credit card applications (other_data collection)
 */
const setupCreditCardListener = () => {
  const collectionRef = firestoreDb.collection('other_data');
  
  collectionRef.onSnapshot((snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        const docData = change.doc.data();
        const docId = change.doc.id;
        
        // Skip if this is initial load or document already processed
        if (isInitialLoad || processedDocs.creditCards.has(docId)) {
          processedDocs.creditCards.add(docId); // Track it anyway
          return;
        }
        
        console.log(`🆕 New credit card application detected: ${docId}`);
        console.log('📄 Credit Card data:', JSON.stringify(docData, null, 2)); // Debug log
        
        processedDocs.creditCards.add(docId);
        // Extract formData from wrapper if it exists
        const creditCardData = docData.formData || docData;
        sendCreditCardEmail(creditCardData, docId);
      }
    });
  }, (error) => {
    console.error('❌ Error in credit card listener:', error.message);
  });
  
  console.log('👂 Listening to other_data collection...');
};

/**
 * Setup listener for CIBIL score requests (cibil_score collection)
 */
const setupCibilScoreListener = () => {
  const collectionRef = firestoreDb.collection('cibil_score');
  
  collectionRef.onSnapshot((snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        const docData = change.doc.data();
        const docId = change.doc.id;
        
        // Skip if this is initial load or document already processed
        if (isInitialLoad || processedDocs.cibilScore.has(docId)) {
          processedDocs.cibilScore.add(docId); // Track it anyway
          return;
        }
        
        console.log(`🆕 New CIBIL score request detected: ${docId}`);
        console.log('📄 CIBIL Score data:', JSON.stringify(docData, null, 2)); // Debug log
        
        processedDocs.cibilScore.add(docId);
        sendCibilScoreEmail(docData, docId);
      }
    });
  }, (error) => {
    console.error('❌ Error in CIBIL score listener:', error.message);
  });
  
  console.log('👂 Listening to cibil_score collection...');
};

/**
 * Send email notification for new loan application
 * Dynamically adapts to different loan types (Property, Personal, Business, Car, etc.)
 */
const sendLoanEmail = async (loanData, docId) => {
  try {
    // Extract contact information
    const fullName = loanData.fullName || loanData.name || loanData.applicantName || 'Not provided';
    const email = loanData.email || loanData.applicantEmail || 'Not provided';
    const phone = loanData.phone || loanData.phoneNumber || loanData.mobileNumber || 'Not provided';
    const city = loanData.city || loanData.cityState || loanData.location || '';
    
    // Extract loan details - dynamically support all loan types
    const loanType = loanData.loanType || loanData.type || 'Loan';
    const loanPurpose = loanData.loanPurpose || loanData.purpose || '';
    const loanAmount = loanData.loanAmount || loanData.expectedLoanAmount || loanData.amount || loanData.requestedAmount || '';
    const tenure = loanData.tenure || loanData.loanTenure || loanData.preferredTenure || loanData.period || '';
    const existingLoans = loanData.existingLoans || '';
    
    // Property-specific fields
    const ownershipType = loanData.ownershipType || '';
    const propertyType = loanData.propertyType || '';
    const propertyUsage = loanData.propertyUsage || '';
    const marketValue = loanData.marketValue || '';
    
    // Car-specific fields
    const carMakeModel = loanData.carMakeModel || loanData.carModel || loanData.carTypeModel || '';
    const carPrice = loanData.carPrice || '';
    const downPayment = loanData.downPayment || '';
    const carVariant = loanData.carVariant || '';
    const carYear = loanData.carYear || '';
    const carAge = loanData.carAge || '';
    
    // Financial & Employment information
    const employmentType = loanData.employmentType || loanData.employment || '';
    const monthlyIncome = loanData.monthlyIncome || '';
    const incomeTurnover = loanData.incomeTurnover || '';
    const companyName = loanData.companyName || '';
    const itrFiled = loanData.itrFiled || '';
    
    // Additional information
    const message = loanData.message || loanData.comments || loanData.additionalInfo || loanData.queries || loanData.interestQueries || '';
    
    const submittedDate = formatTimestamp(loanData.createdAt || loanData.submittedAt || loanData.timestamp);
    
    // Dynamic subject based on loan type
    const subject = `� New ${loanType} Loan Inquiry - LoanZaar`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #2c3e50; background: #ecf0f1; }
          .container { max-width: 700px; margin: 0 auto; padding: 20px; background: white; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; margin: -20px -20px 20px -20px; }
          .header h1 { margin: 0; font-size: 24px; }
          .header p { margin: 5px 0 0 0; opacity: 0.9; }
          .section { margin-bottom: 25px; }
          .section-title { color: #667eea; font-size: 16px; font-weight: 700; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
          .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #ecf0f1; }
          .info-row:last-child { border-bottom: none; }
          .info-label { font-weight: 600; color: #34495e; width: 40%; }
          .info-value { color: #7f8c8d; word-break: break-word; text-align: right; width: 60%; }
          .info-value a { color: #667eea; text-decoration: none; }
          .info-value a:hover { text-decoration: underline; }
          .currency { color: #27ae60; font-weight: 600; }
          .badge { display: inline-block; background: #667eea; color: white; padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-top: 10px; }
          .message-box { background: #f8f9fa; padding: 15px; border-left: 4px solid #667eea; border-radius: 4px; margin-top: 10px; line-height: 1.7; }
          .alert-box { background: #e0e7ff; border-left: 4px solid #667eea; padding: 15px; margin-top: 20px; border-radius: 4px; line-height: 1.6; }
          .alert-box strong { color: #667eea; }
          .footer { text-align: center; color: #7f8c8d; font-size: 12px; margin-top: 25px; padding-top: 15px; border-top: 1px solid #ecf0f1; }
          .doc-id { background: #f0f2f5; padding: 10px; border-radius: 4px; font-family: 'Courier New', monospace; font-size: 12px; color: #555; margin-top: 10px; }
          .field-empty { color: #bdc3c7; font-style: italic; }
          .divider { height: 1px; background: #ecf0f1; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>� New ${loanType} Loan Inquiry</h1>
            <p>A new ${loanType} loan application has been submitted</p>
          </div>
          
          <div class="section">
            <div class="section-title">👤 Contact Information</div>
            <div class="info-row">
              <div class="info-label">Full Name</div>
              <div class="info-value">${fullName}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Email Address</div>
              <div class="info-value"><a href="mailto:${email}">${email}</a></div>
            </div>
            <div class="info-row">
              <div class="info-label">Phone / WhatsApp</div>
              <div class="info-value"><a href="tel:${phone}">${phone}</a></div>
            </div>
            ${city ? `
            <div class="info-row">
              <div class="info-label">City / Location</div>
              <div class="info-value">${city}</div>
            </div>
            ` : ''}
            <div class="doc-id">Document ID: <strong>${docId}</strong></div>
          </div>
          
          <div class="section">
            <div class="section-title">🏦 Loan Details</div>
            ${loanPurpose ? `
            <div class="info-row">
              <div class="info-label">Loan Purpose</div>
              <div class="info-value">${loanPurpose}</div>
            </div>
            ` : ''}
            ${loanAmount ? `
            <div class="info-row">
              <div class="info-label">Loan Amount</div>
              <div class="info-value currency">₹${Number(loanAmount).toLocaleString('en-IN')}</div>
            </div>
            ` : ''}
            ${tenure ? `
            <div class="info-row">
              <div class="info-label">Tenure</div>
              <div class="info-value">${tenure}</div>
            </div>
            ` : ''}
            ${existingLoans ? `
            <div class="info-row">
              <div class="info-label">Existing Loans</div>
              <div class="info-value">${existingLoans}</div>
            </div>
            ` : ''}
          </div>
          
          ${(ownershipType || propertyType || propertyUsage || marketValue) ? `
          <div class="section">
            <div class="section-title">🏠 Property Details</div>
            ${ownershipType ? `
            <div class="info-row">
              <div class="info-label">Ownership Type</div>
              <div class="info-value">${ownershipType}</div>
            </div>
            ` : ''}
            ${propertyType ? `
            <div class="info-row">
              <div class="info-label">Property Type</div>
              <div class="info-value">${propertyType}</div>
            </div>
            ` : ''}
            ${propertyUsage ? `
            <div class="info-row">
              <div class="info-label">Property Usage</div>
              <div class="info-value">${propertyUsage}</div>
            </div>
            ` : ''}
            ${marketValue ? `
            <div class="info-row">
              <div class="info-label">Market Value</div>
              <div class="info-value currency">₹${Number(marketValue).toLocaleString('en-IN')}</div>
            </div>
            ` : ''}
          </div>
          ` : ''}
          
          ${(carMakeModel || carPrice || downPayment || carVariant || carYear || carAge) ? `
          <div class="section">
            <div class="section-title">🚗 Vehicle Details</div>
            ${carMakeModel ? `
            <div class="info-row">
              <div class="info-label">Car Make & Model</div>
              <div class="info-value">${carMakeModel}</div>
            </div>
            ` : ''}
            ${carVariant ? `
            <div class="info-row">
              <div class="info-label">Car Variant</div>
              <div class="info-value">${carVariant}</div>
            </div>
            ` : ''}
            ${carYear ? `
            <div class="info-row">
              <div class="info-label">Car Year</div>
              <div class="info-value">${carYear}</div>
            </div>
            ` : ''}
            ${carAge ? `
            <div class="info-row">
              <div class="info-label">Car Age</div>
              <div class="info-value">${carAge}</div>
            </div>
            ` : ''}
            ${carPrice ? `
            <div class="info-row">
              <div class="info-label">Car Price</div>
              <div class="info-value currency">₹${Number(carPrice).toLocaleString('en-IN')}</div>
            </div>
            ` : ''}
            ${downPayment ? `
            <div class="info-row">
              <div class="info-label">Down Payment</div>
              <div class="info-value currency">₹${Number(downPayment).toLocaleString('en-IN')}</div>
            </div>
            ` : ''}
          </div>
          ` : ''}
          
          ${(employmentType || monthlyIncome || incomeTurnover || companyName || itrFiled) ? `
          <div class="section">
            <div class="section-title">💼 Financial & Employment Information</div>
            ${employmentType ? `
            <div class="info-row">
              <div class="info-label">Employment Type</div>
              <div class="info-value">${employmentType}</div>
            </div>
            ` : ''}
            ${monthlyIncome ? `
            <div class="info-row">
              <div class="info-label">Monthly Income</div>
              <div class="info-value currency">₹${Number(monthlyIncome).toLocaleString('en-IN')}</div>
            </div>
            ` : ''}
            ${incomeTurnover ? `
            <div class="info-row">
              <div class="info-label">Income / Turnover</div>
              <div class="info-value">${incomeTurnover}</div>
            </div>
            ` : ''}
            ${companyName ? `
            <div class="info-row">
              <div class="info-label">Company Name</div>
              <div class="info-value">${companyName}</div>
            </div>
            ` : ''}
            ${itrFiled ? `
            <div class="info-row">
              <div class="info-label">ITR Filed</div>
              <div class="info-value">${itrFiled}</div>
            </div>
            ` : ''}
          </div>
          ` : ''}
          
          ${message ? `
          <div class="section">
            <div class="section-title">💬 Additional Information</div>
            <div class="message-box">
              ${message}
            </div>
          </div>
          ` : ''}
          
          <div class="section">
            <div class="info-row">
              <div class="info-label">📅 Submitted Date & Time</div>
              <div class="info-value"><strong>${submittedDate}</strong></div>
            </div>
          </div>
          
          <div class="alert-box">
            <strong>⚡ Action Required:</strong> Please contact the customer within 24 hours to discuss their ${loanType} loan requirements and provide personalized assistance.
          </div>
          
          <div class="footer">
            <p><strong>LoanZaar Admin Notification System</strong></p>
            <p>This is an automated email notification from your website contact form</p>
            <p>© ${new Date().getFullYear()} LoanZaar. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    // Debug log: Log the full email content before sending
    console.log('📧 DEBUG: Email Content for Loan Application');
    console.log('Subject:', subject);
    console.log('To:', process.env.ADMIN_EMAIL || 'moddriod.co@gmail.com');
    console.log('Applicant:', fullName);
    console.log('Email:', email);
    console.log('Phone:', phone);
    console.log('Loan Type:', loanType);
    console.log('Loan Amount:', loanAmount ? `₹${Number(loanAmount).toLocaleString('en-IN')}` : 'Not provided');
    console.log('-----------------------------------');
    
    await sendEmailSmart({
      to: process.env.ADMIN_EMAIL || 'moddriod.co@gmail.com',
      subject,
      html
    });
    
    console.log(`✅ ${loanType} loan inquiry email sent successfully`);
    console.log(`   Applicant: ${fullName} | Amount: ₹${loanAmount ? Number(loanAmount).toLocaleString('en-IN') : 'N/A'} | Doc ID: ${docId}`);
  } catch (error) {
    console.error('❌ Error sending loan email:', error.message);
  }
};

/**
 * Send email notification for new insurance application
 */
const sendInsuranceEmail = async (insuranceData, docId) => {
  try {
    // Extract and format data with multiple possible field names
    const fullName = insuranceData.fullName || insuranceData.name || insuranceData.applicantName || 'Not provided';
    const email = insuranceData.email || insuranceData.applicantEmail || 'Not provided';
    const phone = insuranceData.phone || insuranceData.phoneNumber || insuranceData.mobileNumber || 'Not provided';
    const city = insuranceData.city || insuranceData.location || insuranceData.cityState || 'Not provided';
    const insuranceType = insuranceData.insuranceType || insuranceData.type || insuranceData.policyType || 'Not specified';
    const coverageAmount = insuranceData.coverageAmount || insuranceData.amount || insuranceData.sumInsured;
    const submittedDate = formatTimestamp(insuranceData.createdAt || insuranceData.submittedAt || insuranceData.timestamp);
    
    const subject = '🛡️ New Insurance Application Received - LoanZaar';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .info-table td { padding: 12px; border-bottom: 1px solid #e0e0e0; }
          .info-table td:first-child { font-weight: bold; color: #f5576c; width: 40%; }
          .badge { display: inline-block; padding: 5px 15px; background: #f5576c; color: white; border-radius: 20px; font-size: 12px; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🛡️ New Insurance Application</h1>
            <p>A new insurance application has been submitted</p>
          </div>
          <div class="content">
            <p><span class="badge">Insurance Type: ${insuranceType}</span></p>
            
            <h3>Applicant Details:</h3>
            <table class="info-table">
              <tr>
                <td>Document ID</td>
                <td>${docId}</td>
              </tr>
              <tr>
                <td>Full Name</td>
                <td>${fullName}</td>
              </tr>
              <tr>
                <td>Email</td>
                <td>${email}</td>
              </tr>
              <tr>
                <td>Phone</td>
                <td>${phone}</td>
              </tr>
              <tr>
                <td>City</td>
                <td>${city}</td>
              </tr>
              <tr>
                <td>Coverage Amount</td>
                <td>₹${coverageAmount ? Number(coverageAmount).toLocaleString('en-IN') : 'Not specified'}</td>
              </tr>
              <tr>
                <td>Submission Date</td>
                <td>${submittedDate}</td>
              </tr>
            </table>
            
            ${insuranceData.message || insuranceData.additionalInfo || insuranceData.comments ? `
              <h3>Additional Information:</h3>
              <p style="background: white; padding: 15px; border-radius: 5px; border-left: 4px solid #f5576c;">
                ${insuranceData.message || insuranceData.additionalInfo || insuranceData.comments}
              </p>
            ` : ''}
            
            <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin-top: 20px; border-radius: 5px;">
              <strong>⚡ Action Required:</strong> Please review this application in your admin dashboard.
            </div>
          </div>
          <div class="footer">
            <p>This is an automated notification from LoanZaar Admin System</p>
            <p>© ${new Date().getFullYear()} LoanZaar. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    await sendEmailSmart({
      to: process.env.ADMIN_EMAIL || 'moddriod.co@gmail.com',
      subject,
      html
    });
    
    console.log(`✅ Insurance application email sent for: ${fullName}`);
  } catch (error) {
    console.error('❌ Error sending insurance email:', error.message);
  }
};

/**
 * Send email notification for new contact message
 */
const sendMessageEmail = async (messageData, docId) => {
  try {
    // Extract and format data with multiple possible field names
    const name = messageData.name || messageData.fullName || messageData.senderName || 'Not provided';
    const email = messageData.email || messageData.senderEmail || 'Not provided';
    const phone = messageData.phone || messageData.phoneNumber || messageData.mobileNumber || 'Not provided';
    const subject = messageData.subject || messageData.topic || 'General Inquiry';
    const message = messageData.message || messageData.body || messageData.content || 'No message content provided';
    const submittedDate = formatTimestamp(messageData.createdAt || messageData.submittedAt || messageData.timestamp);
    
    const emailSubject = '📩 New Contact Message Received - LoanZaar';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .info-table td { padding: 12px; border-bottom: 1px solid #e0e0e0; }
          .info-table td:first-child { font-weight: bold; color: #4facfe; width: 40%; }
          .message-box { background: white; padding: 20px; border-radius: 5px; border-left: 4px solid #4facfe; margin: 20px 0; word-wrap: break-word; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📩 New Contact Message</h1>
            <p>Someone has reached out through the contact form</p>
          </div>
          <div class="content">
            <h3>Contact Details:</h3>
            <table class="info-table">
              <tr>
                <td>Document ID</td>
                <td>${docId}</td>
              </tr>
              <tr>
                <td>Name</td>
                <td>${name}</td>
              </tr>
              <tr>
                <td>Email</td>
                <td>${email}</td>
              </tr>
              <tr>
                <td>Phone</td>
                <td>${phone}</td>
              </tr>
              <tr>
                <td>Subject</td>
                <td>${subject}</td>
              </tr>
              <tr>
                <td>Received Date</td>
                <td>${submittedDate}</td>
              </tr>
            </table>
            
            <h3>Message:</h3>
            <div class="message-box">
              ${message}
            </div>
            
            <div style="background: #d1ecf1; border-left: 4px solid #0c5460; padding: 15px; margin-top: 20px; border-radius: 5px;">
              <strong>💡 Tip:</strong> Reply to this inquiry within 24 hours for better customer satisfaction.
            </div>
          </div>
          <div class="footer">
            <p>This is an automated notification from LoanZaar Admin System</p>
            <p>© ${new Date().getFullYear()} LoanZaar. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    await sendEmailSmart({
      to: process.env.ADMIN_EMAIL || 'moddriod.co@gmail.com',
      subject: emailSubject,
      html
    });
    
    console.log(`✅ Contact message email sent for: ${name}`);
  } catch (error) {
    console.error('❌ Error sending message email:', error.message);
  }
};

/**
 * Send email notification for new credit card application
 */
const sendCreditCardEmail = async (creditCardData, docId) => {
  try {
    // Extract and format data with multiple possible field names
    const fullName = creditCardData.fullName || creditCardData.name || creditCardData.applicantName || 'Not provided';
    const email = creditCardData.email || creditCardData.applicantEmail || 'Not provided';
    const phone = creditCardData.phone || creditCardData.phoneNumber || creditCardData.mobileNumber || 'Not provided';
    const cardType = creditCardData.cardType || creditCardData.preferredCardType || 'Not specified';
    const monthlyIncome = creditCardData.monthlyIncome || creditCardData.income || '';
    const employmentType = creditCardData.employmentType || creditCardData.employment || 'Not specified';
    const message = creditCardData.message || creditCardData.additionalInfo || creditCardData.comments || '';
    const submittedDate = formatTimestamp(creditCardData.createdAt || creditCardData.submittedAt || creditCardData.timestamp);
    
    const subject = '💳 New Credit Card Application - LoanZaar';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; background: white; }
          .info-table td { padding: 12px; border-bottom: 1px solid #e0e0e0; }
          .info-table td:first-child { font-weight: bold; color: #667eea; width: 40%; }
          .badge { display: inline-block; padding: 6px 16px; background: #667eea; color: white; border-radius: 20px; font-size: 13px; font-weight: 600; }
          .section-title { color: #667eea; font-size: 18px; margin: 25px 0 15px 0; font-weight: 600; }
          .message-box { background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0; }
          .alert-box { background: #e0e7ff; border-left: 4px solid #667eea; padding: 15px; margin-top: 20px; border-radius: 5px; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💳 New Credit Card Application</h1>
            <p>New credit card inquiry received from website</p>
          </div>
          <div class="content">
            <p><span class="badge">${cardType} Card</span></p>
            
            <h3 class="section-title">📋 Applicant Information</h3>
            <table class="info-table">
              <tr>
                <td>Document ID</td>
                <td>${docId}</td>
              </tr>
              <tr>
                <td>Full Name</td>
                <td>${fullName}</td>
              </tr>
              <tr>
                <td>Email Address</td>
                <td><a href="mailto:${email}" style="color: #667eea;">${email}</a></td>
              </tr>
              <tr>
                <td>Phone / WhatsApp</td>
                <td><a href="tel:${phone}" style="color: #667eea;">${phone}</a></td>
              </tr>
            </table>
            
            <h3 class="section-title">💼 Financial & Employment Details</h3>
            <table class="info-table">
              ${monthlyIncome ? `
              <tr>
                <td>Monthly Income</td>
                <td>₹${Number(monthlyIncome).toLocaleString('en-IN')}</td>
              </tr>
              ` : ''}
              <tr>
                <td>Employment Type</td>
                <td>${employmentType}</td>
              </tr>
              <tr>
                <td>Preferred Card Type</td>
                <td>${cardType}</td>
              </tr>
            </table>
            
            ${message ? `
              <h3 class="section-title">💬 Additional Information</h3>
              <div class="message-box">
                ${message}
              </div>
            ` : ''}
            
            <table class="info-table" style="margin-top: 20px;">
              <tr>
                <td>Application Received</td>
                <td>${submittedDate}</td>
              </tr>
            </table>
            
            <div class="alert-box">
              <strong>⚡ Action Required:</strong> Please contact the applicant within 24 hours to discuss their credit card options and requirements.
            </div>
          </div>
          <div class="footer">
            <p><strong>LoanZaar Admin Notification System</strong></p>
            <p>This is an automated email notification from your website</p>
            <p>© ${new Date().getFullYear()} LoanZaar. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    await sendEmailSmart({
      to: process.env.ADMIN_EMAIL || 'moddriod.co@gmail.com',
      subject,
      html
    });
    
    console.log(`✅ Credit card application email sent for: ${fullName} (${cardType})`);
  } catch (error) {
    console.error('❌ Error sending credit card email:', error.message);
  }
};

/**
 * Send email notification for new CIBIL score request
 */
const sendCibilScoreEmail = async (cibilData, docId) => {
  try {
  // Extract actual form data wrapper if exists
  const form = cibilData.formData || cibilData;
  const fullName = form.fullName || 'Not provided';
  const phone = form.phone || 'Not provided';
  const pan = form.pan || 'Not provided';
  const requestedAt = formatTimestamp(form.requestedAt);
    
    const subject = `🆔 New CIBIL Score Request - ${fullName}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #2c3e50; background: #ecf0f1; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; background: white; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; margin: -20px -20px 20px -20px; }
          .header h1 { margin: 0; font-size: 24px; }
          .header p { margin: 5px 0 0 0; opacity: 0.9; }
          .section { margin-bottom: 25px; }
          .section-title { color: #667eea; font-size: 16px; font-weight: 700; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
          .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #ecf0f1; }
          .info-row:last-child { border-bottom: none; }
          .info-label { font-weight: 600; color: #34495e; width: 40%; }
          .info-value { color: #7f8c8d; word-break: break-word; text-align: right; width: 60%; }
          .info-value a { color: #667eea; text-decoration: none; }
          .info-value a:hover { text-decoration: underline; }
          .alert-box { background: #e0e7ff; border-left: 4px solid #667eea; padding: 15px; margin-top: 20px; border-radius: 4px; line-height: 1.6; }
          .alert-box strong { color: #667eea; }
          .footer { text-align: center; color: #7f8c8d; font-size: 12px; margin-top: 25px; padding-top: 15px; border-top: 1px solid #ecf0f1; }
          .doc-id { background: #f0f2f5; padding: 10px; border-radius: 4px; font-family: 'Courier New', monospace; font-size: 12px; color: #555; margin-top: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🆔 New CIBIL Score Request</h1>
            <p>A new CIBIL score check request has been submitted</p>
          </div>
          
          <div class="section">
            <div class="section-title">👤 Customer Information</div>
            <div class="info-row">
              <div class="info-label">Full Name</div>
              <div class="info-value">${fullName}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Phone Number</div>
              <div class="info-value"><a href="tel:${phone}">${phone}</a></div>
            </div>
            <div class="info-row">
              <div class="info-label">PAN Number</div>
              <div class="info-value">${pan}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Requested At</div>
              <div class="info-value">${requestedAt}</div>
            </div>
            <div class="doc-id">Document ID: <strong>${docId}</strong></div>
          </div>
          
          <div class="alert-box">
            <strong>⚡ Action Required:</strong> Please process this CIBIL score request and contact the customer within 24 hours with their credit score information.
          </div>
          
          <div class="footer">
            <p><strong>LoanZaar Admin Notification System</strong></p>
            <p>This is an automated notification from your website contact form</p>
            <p>© ${new Date().getFullYear()} LoanZaar. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    await sendEmailSmart({
      to: process.env.ADMIN_EMAIL || 'moddriod.co@gmail.com',
      subject,
      html
    });
    
    console.log(`✅ CIBIL score request email sent for: ${fullName}`);
  } catch (error) {
    console.error('❌ Error sending CIBIL score email:', error.message);
  }
};
