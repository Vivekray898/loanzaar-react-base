import nodemailer from 'nodemailer';

/**
 * Email Utility - Handles sending emails via Nodemailer
 */

// Create reusable transporter for Zoho Mail
const createTransporter = () => {
  const config = {
    host: process.env.EMAIL_HOST || 'smtp.zoho.in',
    port: parseInt(process.env.EMAIL_PORT) || 465,
    secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for 587
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false
    },
    debug: true,
    logger: true
  };

  console.log('📧 Email Configuration:', {
    host: config.host,
    port: config.port,
    secure: config.secure,
    user: config.auth.user,
    pass: config.auth.pass ? '***' + config.auth.pass.slice(-4) : 'NOT SET'
  });

  return nodemailer.createTransport(config);
};

/**
 * Send email notification
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 */
export const sendEmail = async ({ to, subject, html }) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `LoanZaar <${process.env.EMAIL_USER}>`,
      to: to,
      subject: subject,
      html: html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

/**
 * Generate HTML email template for loan submission
 * @param {Object} loanData - Loan application data
 * @returns {string} HTML email content
 */
export const generateLoanEmailHTML = (loanData) => {
  const {
    fullName,
    email,
    phone,
    cityState,
    loanType,
    loanAmount,
    tenure,
    createdAt
  } = loanData;

  let specificDetails = '';

  // Add specific details based on loan type
  switch(loanType) {
    case 'Personal':
      specificDetails = `
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Purpose:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${loanData.purpose || 'N/A'}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Monthly Income:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${loanData.monthlyIncome || 'N/A'}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Employment Type:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${loanData.employmentType || 'N/A'}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Company Name:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${loanData.companyName || 'N/A'}</td></tr>
      `;
      break;
    
    case 'Home':
      specificDetails = `
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Property Type:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${loanData.propertyType || 'N/A'}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Property Value:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">₹${loanData.propertyValue?.toLocaleString() || 'N/A'}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Loan Purpose:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${loanData.loanPurpose || 'N/A'}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Employment Type:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${loanData.employmentType || 'N/A'}</td></tr>
      `;
      break;
    
    case 'Business':
      specificDetails = `
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Business Name:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${loanData.businessName || 'N/A'}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Business Type:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${loanData.businessType || 'N/A'}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Industry:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${loanData.industryType || 'N/A'}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Years in Business:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${loanData.yearsInBusiness || 'N/A'}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Turnover:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${loanData.turnover || 'N/A'}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>GST No:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${loanData.gstNo || 'N/A'}</td></tr>
      `;
      break;
    
    case 'Education':
      specificDetails = `
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Course Name:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${loanData.courseName || 'N/A'}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Course Type:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${loanData.courseType || 'N/A'}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Institution:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${loanData.institutionName || 'N/A'}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Country:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${loanData.institutionCountry || 'N/A'}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Course Cost:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${loanData.courseCost || 'N/A'}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Co-Applicant:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${loanData.coApplicantName || 'N/A'}</td></tr>
      `;
      break;
    
    case 'Gold':
      specificDetails = `
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Gold Weight:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${loanData.goldWeight || 'N/A'}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Gold Purity:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${loanData.goldPurity || 'N/A'}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Gold Type:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${loanData.goldType || 'N/A'}</td></tr>
      `;
      break;
    
    case 'Machinery':
      specificDetails = `
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Machinery Type:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${loanData.machineryType || 'N/A'}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Machinery Value:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">₹${loanData.machineryValue?.toLocaleString() || 'N/A'}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Machinery Age:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${loanData.machineryAge || 'N/A'}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Vendor:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${loanData.vendorName || 'N/A'}</td></tr>
      `;
      break;
    
    case 'Solar':
      specificDetails = `
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Roof Type:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${loanData.roofType || 'N/A'}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>System Capacity:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${loanData.systemCapacity || 'N/A'} kW</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Ownership Type:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${loanData.ownershipType || 'N/A'}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Electricity Bill:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${loanData.electricityBill || 'N/A'}</td></tr>
      `;
      break;
    
    case 'Property':
      specificDetails = `
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Property Location:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${loanData.propertyLocation || 'N/A'}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Market Value:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">₹${loanData.marketValue?.toLocaleString() || 'N/A'}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Construction Year:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${loanData.constructionYear || 'N/A'}</td></tr>
      `;
      break;

    case 'Life Insurance':
    case 'Health Insurance':
    case 'General Insurance':
      specificDetails = `
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Coverage Amount:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${loanData.coverageAmount || 'N/A'}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Age/DOB:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${loanData.ageDOB || 'N/A'}</td></tr>
        ${loanData.assetType ? `<tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Asset Type:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${loanData.assetType}</td></tr>` : ''}
      `;
      break;
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { text-align: left; padding: 12px; border: 1px solid #ddd; }
        th { background-color: #e5e7eb; }
        .footer { margin-top: 20px; text-align: center; font-size: 12px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏦 New ${loanType} Application</h1>
        </div>
        <div class="content">
          <p><strong>A new ${loanType.toLowerCase()} application has been submitted on LoanZaar.</strong></p>
          
          <table>
            <tr>
              <th colspan="2" style="background-color: #2563eb; color: white;">Applicant Details</th>
            </tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Full Name:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${fullName}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Email:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${email}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Phone:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${phone}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>City/State:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${cityState}</td></tr>
          </table>

          <table>
            <tr>
              <th colspan="2" style="background-color: #2563eb; color: white;">${loanType} Details</th>
            </tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Loan Amount:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">₹${loanAmount?.toLocaleString()}</td></tr>
            ${tenure ? `<tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Tenure:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${tenure}</td></tr>` : ''}
            ${specificDetails}
          </table>

          <table>
            <tr>
              <th colspan="2" style="background-color: #2563eb; color: white;">Submission Info</th>
            </tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Submitted On:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${new Date(createdAt).toLocaleString()}</td></tr>
          </table>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} LoanZaar. All rights reserved.</p>
          <p>This is an automated email. Please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Generate HTML email template for contact form submission
 */
export const generateContactEmailHTML = (contactData) => {
  const { name, email, phone, mobile, state, city, reason, subject, message, createdAt } = contactData;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #ef4444; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        td { padding: 12px; border: 1px solid #ddd; }
        .message-box { background-color: white; padding: 15px; border-left: 4px solid #ef4444; margin-top: 15px; }
        .footer { margin-top: 20px; text-align: center; font-size: 12px; color: #6b7280; }
        .badge { display: inline-block; padding: 4px 8px; background-color: #fef2f2; color: #ef4444; border-radius: 4px; font-size: 11px; font-weight: 600; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📧 New Contact Form Submission</h1>
        </div>
        <div class="content">
          <table>
            <tr><td style="background-color: #f3f4f6;"><strong>Name:</strong></td><td>${name}</td></tr>
            <tr><td style="background-color: #f3f4f6;"><strong>Email:</strong></td><td>${email}</td></tr>
            ${phone || mobile ? `<tr><td style="background-color: #f3f4f6;"><strong>Phone:</strong></td><td>${phone || mobile}</td></tr>` : ''}
            ${state ? `<tr><td style="background-color: #f3f4f6;"><strong>State:</strong></td><td>${state}</td></tr>` : ''}
            ${city ? `<tr><td style="background-color: #f3f4f6;"><strong>City:</strong></td><td>${city}</td></tr>` : ''}
            ${reason ? `<tr><td style="background-color: #f3f4f6;"><strong>Reason:</strong></td><td><span class="badge">${reason}</span></td></tr>` : ''}
            ${subject ? `<tr><td style="background-color: #f3f4f6;"><strong>Subject:</strong></td><td>${subject}</td></tr>` : ''}
            <tr><td style="background-color: #f3f4f6;"><strong>Submitted On:</strong></td><td>${new Date(createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'full', timeStyle: 'short' })}</td></tr>
          </table>

          <div class="message-box">
            <strong>Message:</strong><br><br>
            ${message ? message.replace(/\n/g, '<br>') : 'No message provided'}
          </div>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} LoanZaar. All rights reserved.</p>
          <p style="margin-top: 5px;">Contact submissions are stored in your database for future reference.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};
