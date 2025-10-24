import express from 'express';
import crypto from 'crypto';
import { sendEmail } from '../utils/emailService.js';
import User from '../models/User.js';

const router = express.Router();

// In-memory storage for OTPs (in production, use Redis or database)
const otpStore = new Map();

// Generate OTP
function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

// Generate OTP Email Template (White Theme)
function generateOTPEmailTemplate(name, otp) {
  const otpDigits = otp.split('');

  return `
    <section style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333333;">
      <header style="text-align: center; margin-bottom: 30px;">
        <img src="https://placehold.co/180x50/ef4444/white?text=LOANZAAR" alt="Loanzaar Logo" style="width: auto; height: 40px;">
      </header>

      <main style="margin-top: 30px;">
        <h2 style="color: #333333; margin-bottom: 10px; font-size: 24px; font-weight: 600;">Hi ${name},</h2>

        <p style="margin: 20px 0; line-height: 1.6; color: #666666; font-size: 16px;">
          Welcome to Loanzaar! This is your email verification code:
        </p>

        <div style="display: flex; align-items: center; justify-content: center; margin: 30px 0; gap: 12px;">
          ${otpDigits.map(digit => `
            <div style="display: flex; align-items: center; justify-content: center; width: 50px; height: 50px; font-size: 24px; font-weight: 600; color: #ef4444; border: 2px solid #ef4444; border-radius: 8px; background-color: #fef2f2;">
              ${digit}
            </div>
          `).join('')}
        </div>

        <p style="margin: 20px 0; line-height: 1.6; color: #666666; font-size: 16px;">
          This code will only be valid for the next 5 minutes. For your security, please do not share this code with anyone.
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <p style="color: #666666; font-size: 14px; margin-bottom: 10px;">
            If you're having trouble copying the code, you can verify your email directly:
          </p>
          <a href="#" style="display: inline-block; padding: 12px 24px; background-color: #ef4444; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 16px; transition: background-color 0.3s ease;">
            Verify Email
          </a>
        </div>

        <p style="margin: 30px 0 10px 0; color: #666666; font-size: 16px;">
          Best regards,<br>
          <strong>The Loanzaar Team</strong>
        </p>
      </main>

      <footer style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p style="color: #9ca3af; font-size: 14px; line-height: 1.5; margin-bottom: 10px;">
          This email was sent to you because you requested to create an account with Loanzaar.
          If you didn't request this, please ignore this email.
        </p>

        <p style="color: #9ca3af; font-size: 12px;">
          © 2025 Loanzaar. All Rights Reserved.<br>
          Need help? Contact us at <a href="mailto:support@loanzaar.com" style="color: #ef4444; text-decoration: none;">support@loanzaar.com</a>
        </p>
      </footer>
    </section>
  `;
}

// Send OTP endpoint
router.post('/send-otp', async (req, res) => {
  try {
    const { name, email, captchaToken } = req.body;

    // Validate required fields
    if (!name || !email || !captchaToken) {
      return res.status(400).json({ error: 'Name, email, and captcha token are required' });
    }

    // Verify reCAPTCHA token (you can implement server-side verification)
    // For now, we'll trust the client-side verification

    // Generate OTP
    const otp = generateOTP();

    // Store OTP with expiration (5 minutes)
    otpStore.set(email, {
      otp,
      expires: Date.now() + 5 * 60 * 1000, // 5 minutes
      name,
      attempts: 0
    });

    // Send OTP email
    const emailHtml = generateOTPEmailTemplate(name, otp);

    await sendEmail({
      to: email,
      subject: 'Verify Your Email - Loanzaar Account',
      html: emailHtml
    });

    console.log(`✅ OTP sent to ${email}: ${otp}`);

    res.json({ success: true, message: 'OTP sent successfully' });

  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// Resend OTP endpoint
router.post('/resend-otp', async (req, res) => {
  try {
    const { email, captchaToken } = req.body;

    if (!email || !captchaToken) {
      return res.status(400).json({ error: 'Email and captcha token are required' });
    }

    const storedData = otpStore.get(email);
    if (!storedData) {
      return res.status(400).json({ error: 'No OTP request found. Please start registration again.' });
    }

    // Generate new OTP
    const otp = generateOTP();

    // Update stored data
    otpStore.set(email, {
      ...storedData,
      otp,
      expires: Date.now() + 5 * 60 * 1000,
      attempts: 0
    });

    // Send OTP email
    const emailHtml = generateOTPEmailTemplate(storedData.name, otp);

    await sendEmail({
      to: email,
      subject: 'Verify Your Email - Loanzaar Account (Resent)',
      html: emailHtml
    });

    console.log(`✅ OTP resent to ${email}: ${otp}`);

    res.json({ success: true, message: 'OTP resent successfully' });

  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ error: 'Failed to resend OTP' });
  }
});

// Verify OTP and create account endpoint
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp, userData } = req.body;

    console.log('📥 Verify OTP request received:', { email, otp, userData: userData ? 'present' : 'missing' });

    if (!email || !otp || !userData) {
      console.log('❌ Missing required fields');
      return res.status(400).json({ error: 'Email, OTP, and user data are required' });
    }

    const storedData = otpStore.get(email);
    if (!storedData) {
      console.log('❌ OTP not found for email:', email);
      console.log('📋 Current OTP store has', otpStore.size, 'entries');
      return res.status(400).json({ 
        error: 'OTP expired or not found. Please click "Resend OTP" to get a new verification code.' 
      });
    }

    console.log('✅ Found stored OTP data');

    // Check expiration
    if (Date.now() > storedData.expires) {
      otpStore.delete(email);
      console.log('❌ OTP expired');
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }

    // Check attempts (max 3)
    if (storedData.attempts >= 3) {
      otpStore.delete(email);
      console.log('❌ Too many attempts');
      return res.status(400).json({ error: 'Too many failed attempts. Please request a new OTP.' });
    }

    // Verify OTP
    if (storedData.otp !== otp) {
      storedData.attempts += 1;
      console.log('❌ Invalid OTP. Attempt:', storedData.attempts);
      return res.status(400).json({ error: 'Invalid OTP. Please try again.' });
    }

    console.log('✅ OTP verified successfully');

    // OTP verified successfully
    otpStore.delete(email);

    // Check if user already exists
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      console.log('❌ User already exists:', userData.email);
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    console.log('📝 Creating new user with data:', {
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      age: userData.age,
      gender: userData.gender,
      income: userData.income,
      occupation: userData.occupation
    });

    // Create new user with all fields from SignUpPage
    const newUser = new User({
      name: userData.name,
      email: userData.email,
      password: userData.password,
      phone: userData.phone,
      age: userData.age ? parseInt(userData.age) : undefined,
      gender: userData.gender || '',
      income: userData.income || '',
      occupation: userData.occupation || '',
      isVerified: true // Mark as verified since OTP was successful
    });

    await newUser.save();

    console.log('✅ Account created successfully for:', userData.email);

    res.json({
      success: true,
      message: 'Account created successfully',
      user: { 
        email: newUser.email, 
        name: newUser.name,
        phone: newUser.phone,
        age: newUser.age,
        gender: newUser.gender,
        income: newUser.income,
        occupation: newUser.occupation
      }
    });

  } catch (error) {
    console.error('❌ Verify OTP error:', error);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      errors: error.errors
    });
    
    // Send detailed error message
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        error: 'Validation failed: ' + validationErrors.join(', ') 
      });
    }
    
    res.status(500).json({ error: 'Failed to verify OTP: ' + error.message });
  }
});

// Clean up expired OTPs periodically (optional)
setInterval(() => {
  const now = Date.now();
  for (const [email, data] of otpStore.entries()) {
    if (now > data.expires) {
      otpStore.delete(email);
    }
  }
}, 60000); // Clean up every minute

// Debug endpoint to check OTP store (remove in production)
router.get('/debug-otp-store', (req, res) => {
  const otps = [];
  for (const [email, data] of otpStore.entries()) {
    otps.push({
      email,
      otp: data.otp,
      expires: new Date(data.expires).toISOString(),
      attempts: data.attempts,
      isExpired: Date.now() > data.expires
    });
  }
  console.log('🔍 Current OTP Store:', otps);
  res.json({ otps });
});

// ==================== PASSWORD RESET ENDPOINTS ====================

// Request OTP for Password Reset
router.post('/request-otp-password-reset', async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    console.log('📨 Password reset OTP request:', { name, email, phone });

    // Validate input
    if (!name || !email || !phone) {
      return res.status(400).json({ error: 'Name, email, and phone are required' });
    }

    // Find user by email, name, and phone
    const user = await User.findOne({ 
      email: email.toLowerCase(),
      name: name.trim(),
      phone: phone.replace(/\D/g, '')
    });

    if (!user) {
      console.log('❌ No user found matching these credentials:', { name, email, phone });
      return res.status(404).json({ 
        error: 'No account found with these details. Please verify your name, email, and phone number.' 
      });
    }

    console.log('✅ User found:', user.email);

    // Generate OTP
    const otp = generateOTP();

    // Store OTP with expiration (5 minutes)
    otpStore.set(`pwd-reset-${email}`, {
      otp,
      expires: Date.now() + 5 * 60 * 1000,
      attempts: 0,
      email: user.email,
      userId: user._id
    });

    // Send OTP email
    const emailHtml = generateOTPEmailTemplate(user.name, otp);

    await sendEmail({
      to: user.email,
      subject: 'Password Reset - Loanzaar Account',
      html: emailHtml
    });

    console.log(`✅ Password reset OTP sent to ${user.email}: ${otp}`);

    res.json({ 
      success: true, 
      message: 'OTP sent to your email for password reset',
      email: user.email 
    });

  } catch (error) {
    console.error('❌ Password reset OTP request error:', error);
    res.status(500).json({ error: 'Failed to request OTP' });
  }
});

// Verify OTP for Password Reset
router.post('/verify-otp-password-reset', async (req, res) => {
  try {
    const { email, otp } = req.body;

    console.log('📨 Password reset OTP verification:', { email, otp: '****' });

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    const key = `pwd-reset-${email}`;
    const storedData = otpStore.get(key);

    if (!storedData) {
      return res.status(400).json({ 
        error: 'OTP expired or not found. Please request a new OTP.' 
      });
    }

    // Check expiration
    if (Date.now() > storedData.expires) {
      otpStore.delete(key);
      return res.status(400).json({ 
        error: 'OTP has expired. Please request a new one.' 
      });
    }

    // Check attempts (max 3)
    if (storedData.attempts >= 3) {
      otpStore.delete(key);
      return res.status(400).json({ 
        error: 'Too many failed attempts. Please request a new OTP.' 
      });
    }

    // Verify OTP
    if (storedData.otp !== otp) {
      storedData.attempts += 1;
      console.log('❌ Invalid OTP. Attempt:', storedData.attempts);
      return res.status(400).json({ 
        error: 'Invalid OTP. Please try again.' 
      });
    }

    console.log('✅ OTP verified for password reset');

    // Don't delete OTP yet - keep it for reset-password endpoint
    // Return success with userId
    res.json({ 
      success: true, 
      message: 'OTP verified successfully',
      userId: storedData.userId
    });

  } catch (error) {
    console.error('❌ Password reset OTP verification error:', error);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    console.log('📨 Password reset request for:', email);

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'Email, OTP, and new password are required' });
    }

    // Validate password
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const key = `pwd-reset-${email}`;
    const storedData = otpStore.get(key);

    if (!storedData) {
      return res.status(400).json({ 
        error: 'OTP expired. Please request a new OTP.' 
      });
    }

    // Check expiration
    if (Date.now() > storedData.expires) {
      otpStore.delete(key);
      return res.status(400).json({ 
        error: 'OTP has expired. Please request a new one.' 
      });
    }

    // Verify OTP one more time
    if (storedData.otp !== otp) {
      return res.status(400).json({ 
        error: 'Invalid OTP. Please verify your OTP again.' 
      });
    }

    // Find user and update password
    const user = await User.findById(storedData.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update password (will be hashed by middleware)
    user.password = newPassword;
    await user.save();

    // Delete OTP after successful reset
    otpStore.delete(key);

    console.log('✅ Password reset successfully for:', email);

    res.json({ 
      success: true, 
      message: 'Password reset successfully. Please sign in with your new password.' 
    });

  } catch (error) {
    console.error('❌ Password reset error:', error);
    res.status(500).json({ error: 'Failed to reset password. ' + error.message });
  }
});

// Sign In endpoint
router.post('/signin', async (req, res) => {
  try {
    const { identifier, password, recaptchaToken } = req.body;

    console.log('📨 Sign in request received for:', identifier);

    // Validate input
    if (!identifier || !password) {
      return res.status(400).json({ message: 'Email/phone and password are required' });
    }

    // Check if identifier is email or phone
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
    const isPhone = /^[6-9]\d{9}$/.test(identifier);

    if (!isEmail && !isPhone) {
      return res.status(400).json({ message: 'Please enter a valid email or phone number' });
    }

    // Find user by email or phone
    const query = isEmail ? { email: identifier } : { phone: identifier };
    const user = await User.findOne(query);

    if (!user) {
      console.log('❌ User not found:', identifier);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user is verified
    if (!user.isVerified) {
      console.log('❌ User not verified:', identifier);
      return res.status(401).json({ message: 'Please verify your email first' });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      console.log('❌ Invalid password for:', identifier);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const jwt = await import('jsonwebtoken');
    const token = jwt.default.sign(
      { 
        id: user._id, 
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role || 'user'  // Include role in JWT
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    console.log('✅ Sign in successful for:', identifier, '| Role:', user.role || 'user');

    res.json({
      success: true,
      message: 'Sign in successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        age: user.age,
        gender: user.gender,
        income: user.income,
        occupation: user.occupation,
        role: user.role || 'user'  // Include role in response
      }
    });

  } catch (error) {
    console.error('❌ Sign in error:', error);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
});

export default router;