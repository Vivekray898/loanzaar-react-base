/**
 * Email Relay Service
 * 
 * Sends email requests to PHP endpoint hosted on Hostinger
 * Used when SMTP ports are blocked (e.g., Render free tier)
 */

import axios from 'axios';

/**
 * Send email via PHP relay endpoint
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML email content
 * @param {string} options.replyTo - Optional reply-to email
 * @returns {Promise<Object>} Response from PHP endpoint
 */
export const sendEmailViaRelay = async ({ to, subject, html, replyTo = null }) => {
  try {
    // Validate required environment variables
    if (!process.env.PHP_MAIL_RELAY_URL) {
      throw new Error('PHP_MAIL_RELAY_URL environment variable not set');
    }
    
    if (!process.env.PHP_MAIL_RELAY_TOKEN) {
      throw new Error('PHP_MAIL_RELAY_TOKEN environment variable not set');
    }

    console.log('📧 Sending email via PHP relay...');
    console.log('   To:', to);
    console.log('   Subject:', subject);

    // Prepare request payload
    const payload = {
      to,
      subject,
      html,
      replyTo: replyTo || process.env.EMAIL_USER,
      fromName: 'LoanZaar',
      fromEmail: process.env.EMAIL_USER
    };

    // Make POST request to PHP endpoint with authorization
    const response = await axios.post(
      process.env.PHP_MAIL_RELAY_URL,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.PHP_MAIL_RELAY_TOKEN}`
        },
        timeout: 30000 // 30 second timeout
      }
    );

    // Check response
    if (response.data && response.data.success) {
      console.log('✅ Email sent successfully via PHP relay');
      console.log('   Message ID:', response.data.messageId || 'N/A');
      return {
        success: true,
        messageId: response.data.messageId,
        message: response.data.message
      };
    } else {
      throw new Error(response.data?.error || 'Unknown error from PHP relay');
    }

  } catch (error) {
    console.error('❌ Email relay error:', error.message);
    
    // Log detailed error information
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Response:', error.response.data);
    } else if (error.request) {
      console.error('   No response received from PHP relay');
    }
    
    throw new Error(`Email relay failed: ${error.message}`);
  }
};

/**
 * Test PHP relay connection
 * @returns {Promise<boolean>} True if connection is successful
 */
export const testRelayConnection = async () => {
  try {
    console.log('🔍 Testing PHP relay connection...');
    
    const response = await axios.post(
      process.env.PHP_MAIL_RELAY_URL,
      { test: true },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.PHP_MAIL_RELAY_TOKEN}`
        },
        timeout: 10000
      }
    );
    
    if (response.data && response.data.success) {
      console.log('✅ PHP relay connection successful');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('❌ PHP relay connection test failed:', error.message);
    return false;
  }
};

/**
 * Smart email sender - tries relay first, falls back to direct SMTP
 * @param {Object} options - Email options
 * @returns {Promise<Object>} Send result
 */
export const sendEmailSmart = async (options) => {
  // Check if we should use relay
  const useRelay = process.env.USE_EMAIL_RELAY === 'true';
  
  if (useRelay && process.env.PHP_MAIL_RELAY_URL && process.env.PHP_MAIL_RELAY_TOKEN) {
    try {
      console.log('🔄 Using PHP email relay...');
      return await sendEmailViaRelay(options);
    } catch (error) {
      console.warn('⚠️  PHP relay failed, attempting direct SMTP...');
      console.error('   Error:', error.message);
      
      // Fall back to direct SMTP if available
      if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        const { sendEmail } = await import('./emailService.js');
        return await sendEmail(options);
      }
      
      throw error;
    }
  } else {
    // Use direct SMTP
    console.log('📧 Using direct SMTP...');
    const { sendEmail } = await import('./emailService.js');
    return await sendEmail(options);
  }
};

export default sendEmailViaRelay;
