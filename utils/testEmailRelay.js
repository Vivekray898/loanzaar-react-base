/**
 * Email Relay Test Script
 * 
 * Tests the PHP email relay connection and email sending
 * Run: node backend/utils/testEmailRelay.js
 */

import dotenv from 'dotenv';
import { sendEmailViaRelay, testRelayConnection, sendEmailSmart } from './emailRelay.js';

// Load environment variables
dotenv.config({ path: '../.env' });

console.log('🧪 Email Relay Test Suite\n');
console.log('Configuration:');
console.log('  USE_EMAIL_RELAY:', process.env.USE_EMAIL_RELAY);
console.log('  PHP_MAIL_RELAY_URL:', process.env.PHP_MAIL_RELAY_URL);
console.log('  PHP_MAIL_RELAY_TOKEN:', process.env.PHP_MAIL_RELAY_TOKEN ? '***' + process.env.PHP_MAIL_RELAY_TOKEN.slice(-4) : 'NOT SET');
console.log('\n' + '='.repeat(60) + '\n');

// Test 1: Connection Test
async function runTest1() {
  console.log('Test 1: Connection Test');
  console.log('-'.repeat(60));
  
  try {
    const result = await testRelayConnection();
    
    if (result) {
      console.log('✅ PASSED: PHP relay endpoint is reachable and authenticated');
    } else {
      console.log('❌ FAILED: Connection test returned false');
    }
  } catch (error) {
    console.log('❌ FAILED:', error.message);
  }
  
  console.log('\n');
}

// Test 2: Send Test Email via Relay
async function runTest2() {
  console.log('Test 2: Send Test Email via Relay');
  console.log('-'.repeat(60));
  
  try {
    const testEmail = {
      to: process.env.ADMIN_EMAIL || 'test@example.com',
      subject: '🧪 Test Email from Email Relay',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #e11d48;">Email Relay Test</h1>
          <p>This is a test email sent via the PHP email relay system.</p>
          <p><strong>Test Time:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>Backend:</strong> Node.js on Render</p>
          <p><strong>Relay:</strong> PHP on Hostinger</p>
          <p><strong>SMTP:</strong> Zoho Mail</p>
          <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 14px;">
            If you received this email, the relay system is working correctly! ✅
          </p>
        </div>
      `,
      replyTo: process.env.EMAIL_USER
    };
    
    console.log('Sending test email to:', testEmail.to);
    
    const result = await sendEmailViaRelay(testEmail);
    
    if (result.success) {
      console.log('✅ PASSED: Email sent successfully');
      console.log('   Message ID:', result.messageId);
      console.log('   Check inbox:', testEmail.to);
    } else {
      console.log('❌ FAILED: Email send returned error');
    }
  } catch (error) {
    console.log('❌ FAILED:', error.message);
  }
  
  console.log('\n');
}

// Test 3: Smart Email Sender (with fallback logic)
async function runTest3() {
  console.log('Test 3: Smart Email Sender (Auto-routing)');
  console.log('-'.repeat(60));
  
  try {
    const testEmail = {
      to: process.env.ADMIN_EMAIL || 'test@example.com',
      subject: '🧪 Test Email from Smart Sender',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #10b981;">Smart Email Sender Test</h1>
          <p>This email was sent using the smart routing system.</p>
          <p><strong>Routing Logic:</strong></p>
          <ul>
            <li>If USE_EMAIL_RELAY=true → Use PHP Relay</li>
            <li>Else → Use Direct SMTP</li>
          </ul>
          <p><strong>Current Setting:</strong> USE_EMAIL_RELAY=${process.env.USE_EMAIL_RELAY}</p>
          <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 14px;">
            Test completed at ${new Date().toLocaleString()}
          </p>
        </div>
      `
    };
    
    console.log('Using smart sender with USE_EMAIL_RELAY=' + process.env.USE_EMAIL_RELAY);
    console.log('Sending test email to:', testEmail.to);
    
    const result = await sendEmailSmart(testEmail);
    
    if (result.success) {
      console.log('✅ PASSED: Email sent successfully via smart router');
      console.log('   Message ID:', result.messageId);
    } else {
      console.log('❌ FAILED: Smart sender returned error');
    }
  } catch (error) {
    console.log('❌ FAILED:', error.message);
  }
  
  console.log('\n');
}

// Run all tests
async function runAllTests() {
  console.log('Starting Email Relay Test Suite...\n');
  
  // Check required environment variables
  if (!process.env.PHP_MAIL_RELAY_URL || !process.env.PHP_MAIL_RELAY_TOKEN) {
    console.log('⚠️  WARNING: PHP relay environment variables not set');
    console.log('   Set PHP_MAIL_RELAY_URL and PHP_MAIL_RELAY_TOKEN in .env');
    console.log('   Some tests may fail.\n');
  }
  
  // Run tests sequentially
  await runTest1();
  await runTest2();
  await runTest3();
  
  console.log('='.repeat(60));
  console.log('🎉 Test Suite Complete!\n');
}

// Execute tests
runAllTests().catch(error => {
  console.error('❌ Test suite error:', error);
  process.exit(1);
});
