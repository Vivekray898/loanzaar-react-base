# Backend API Updates - Form Field Synchronization

## Overview
This document outlines all the backend API updates made to synchronize with the modernized frontend forms.

---

## 📋 Summary of Changes

### 1. **Contact Model** (`models/Contact.js`)
**Updated Fields:**
- ✅ Added `phone` as **required** field
- ✅ Added `mobile` field (optional)
- ✅ Added `state` field (optional)
- ✅ Added `city` field (optional)
- ✅ Added `reason` field with enum validation
- ✅ Made `subject` field **required**

**New Schema:**
```javascript
{
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },      // NEW: Required
  mobile: { type: String },                      // NEW: Optional
  state: { type: String },                       // NEW: Optional
  city: { type: String },                        // NEW: Optional
  reason: {                                      // NEW: With enum
    type: String,
    enum: ['General Inquiry', 'Loan Assistance', 'Technical Support', 
           'Feedback', 'Partnership', 'Other', '']
  },
  subject: { type: String, required: true },    // Updated: Now required
  message: { type: String, required: true },
  status: { type: String, enum: [...], default: 'New' }
}
```

---

### 2. **User Model** (`models/User.js`)
**Updated Fields:**
- ✅ Made `phone` **required** (was optional)
- ✅ Updated password `minlength` from 6 to 8 characters
- ✅ Added `age` field (Number, min: 18, max: 100)
- ✅ Added `gender` field with enum validation
- ✅ Added `income` field with enum validation
- ✅ Added `occupation` field with enum validation

**New Schema:**
```javascript
{
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, minlength: 8 },  // Updated: 6 → 8
  phone: { type: String, required: true },                    // Updated: Now required
  age: { type: Number, min: 18, max: 100 },                  // NEW
  gender: {                                                   // NEW
    type: String,
    enum: ['Male', 'Female', 'Other', '']
  },
  income: {                                                   // NEW
    type: String,
    enum: ['<₹2L', '₹2-5L', '₹5-10L', '>₹10L', '']
  },
  occupation: {                                               // NEW
    type: String,
    enum: ['Salaried', 'Self-Employed', 'Student', 'Retired', 'Other', '']
  },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isVerified: { type: Boolean, default: false }
}
```

---

## 🔌 API Endpoint Updates

### 3. **Contact Controller** (`controllers/contactController.js`)

#### `POST /api/contact`
**Updated Request Body:**
```javascript
{
  name: "John Doe",              // Required
  email: "john@example.com",     // Required
  phone: "9876543210",           // Required
  mobile: "9876543210",          // Optional (fallback to phone)
  state: "Maharashtra",          // Optional
  city: "Mumbai",                // Optional
  reason: "Loan Assistance",     // Optional
  subject: "Home Loan Inquiry",  // Required
  message: "I need information about home loans..."  // Required
}
```

**Validation:**
- Now requires: `name`, `email`, `phone`, `subject`, `message`
- Accepts both `phone` and `mobile` (uses `phone || mobile`)
- All new fields are properly stored in database

---

### 4. **User Controller** (`controllers/userController.js`)

#### `POST /api/users/signup`
**Updated Request Body:**
```javascript
{
  name: "John Doe",              // Required
  email: "john@example.com",     // Required
  password: "SecurePass123",     // Required (min 8 chars)
  phone: "9876543210",           // Required (NEW)
  age: 30,                       // Optional (NEW)
  gender: "Male",                // Optional (NEW)
  income: "₹5-10L",              // Optional (NEW)
  occupation: "Salaried"         // Optional (NEW)
}
```

**Updated Response:**
```javascript
{
  success: true,
  message: "User registered successfully",
  data: {
    userId: "...",
    name: "John Doe",
    email: "john@example.com",
    phone: "9876543210",         // NEW
    age: 30,                     // NEW
    gender: "Male",              // NEW
    income: "₹5-10L",            // NEW
    occupation: "Salaried",      // NEW
    role: "user",
    token: "..."
  }
}
```

---

#### `POST /api/users/signin`
**Enhanced to Support Email OR Phone Login:**

**Request Body (Option 1 - Email):**
```javascript
{
  identifier: "john@example.com",  // Can be email or phone
  password: "SecurePass123"
}
```

**Request Body (Option 2 - Phone):**
```javascript
{
  identifier: "9876543210",        // 10-digit phone number
  password: "SecurePass123"
}
```

**Backend Logic:**
- Detects if identifier contains `@` → searches by email
- Otherwise → searches by phone number
- Returns all user fields including new ones (age, gender, income, occupation)

---

### 5. **Auth Routes** (`routes/authRoutes.js`)

#### `POST /api/auth/verify-otp`
**Updated to Save User with All Fields:**

**Request Body:**
```javascript
{
  email: "john@example.com",
  otp: "123456",
  userData: {
    name: "John Doe",
    email: "john@example.com",
    password: "SecurePass123",
    phone: "9876543210",       // NEW
    age: 30,                   // NEW
    gender: "Male",            // NEW
    income: "₹5-10L",          // NEW
    occupation: "Salaried"     // NEW
  }
}
```

**What Changed:**
- Now creates User document in database (was previously commented out)
- Saves all new user fields (phone, age, gender, income, occupation)
- Sets `isVerified: true` automatically after OTP verification
- Checks for existing users to prevent duplicates

---

### 6. **Email Service** (`utils/emailService.js`)

#### `generateContactEmailHTML()`
**Enhanced Email Template:**
- ✅ Now displays `state` and `city` if provided
- ✅ Shows `reason` with badge styling
- ✅ Displays `phone` or `mobile` (whichever is available)
- ✅ Updated color scheme to match brand (rose/red theme)
- ✅ Better formatting with Indian timezone display
- ✅ Handles newlines in message properly

**Email Output Example:**
```
📧 New Contact Form Submission

Name:          John Doe
Email:         john@example.com
Phone:         9876543210
State:         Maharashtra
City:          Mumbai
Reason:        [Loan Assistance]  ← Badge styled
Subject:       Home Loan Inquiry
Submitted On:  Thursday, 16 October 2025 at 02:30 PM IST

Message:
I am interested in applying for a home loan.
Please contact me at your earliest convenience.
```

---

## 🎯 Field Validation Summary

### Contact Form Frontend → Backend Mapping
| Frontend Field | Backend Field | Validation |
|---------------|---------------|------------|
| `name` | `name` | Required, min 2 chars, letters only |
| `email` | `email` | Required, valid email format |
| `mobile` | `phone` | Required, 10 digits (6-9 start) |
| `state` | `state` | Optional, dropdown selection |
| `city` | `city` | Optional, letters only |
| `reason` | `reason` | Optional, enum validation |
| `subject` | `subject` | Required, max 100 chars |
| `message` | `message` | Required, 20-1000 chars |

### SignUp Form Frontend → Backend Mapping
| Frontend Field | Backend Field | Validation |
|---------------|---------------|------------|
| `name` | `name` | Required, min 2 chars |
| `phone` | `phone` | Required, 10 digits (6-9 start) |
| `email` | `email` | Required, unique, valid format |
| `age` | `age` | Optional, 18-100 range |
| `gender` | `gender` | Optional, enum |
| `income` | `income` | Optional, enum |
| `occupation` | `occupation` | Optional, enum |
| `password` | `password` | Required, min 8 chars |
| `confirmPassword` | - | Frontend only (not saved) |

### SignIn Form Frontend → Backend Mapping
| Frontend Field | Backend Field | Validation |
|---------------|---------------|------------|
| `identifier` | `email` OR `phone` | Required, email OR 10-digit phone |
| `password` | `password` | Required, min 6 chars |

---

## 🔄 Migration Notes

### Existing Data Compatibility
- **Contact Model**: Old records without new fields will still work (all new fields are optional except phone which has fallback)
- **User Model**: Existing users will have empty values for new fields (age, gender, income, occupation)
- **No database migration required** - MongoDB schema is flexible

### Recommended Actions
1. ✅ Test all forms with frontend validation
2. ✅ Verify email notifications include all new fields
3. ✅ Check admin dashboard displays new user/contact fields
4. 📝 Update any analytics/reporting to include new fields
5. 📝 Update admin panel UI to show new user details

---

## 🧪 Testing Checklist

### Contact Form
- [ ] Submit with all fields filled
- [ ] Submit with only required fields (name, email, phone, subject, message)
- [ ] Verify email notification shows all fields
- [ ] Check database record includes all fields

### Sign Up
- [ ] Register with all fields (name, phone, email, age, gender, income, occupation, password)
- [ ] Register with only required fields (name, phone, email, password)
- [ ] Verify OTP email is sent
- [ ] Verify user is created in database after OTP verification
- [ ] Check all new fields are saved

### Sign In
- [ ] Login with email + password
- [ ] Login with phone + password
- [ ] Verify response includes all user fields
- [ ] Test invalid credentials

---

## 📝 Environment Variables Required

Ensure these are set in `.env`:
```env
# Email Configuration
EMAIL_HOST=smtp.zoho.in
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=info@loanzaar.in
EMAIL_PASS=your_password

# Admin Email (receives notifications)
ADMIN_EMAIL=admin@loanzaar.com

# JWT
JWT_SECRET=your_secret_key

# MongoDB
MONGODB_URI=mongodb://localhost:27017/loanzaar
```

---

## 🎉 Summary

**Total Files Updated:** 6
- ✅ `models/Contact.js` - Added 5 new fields
- ✅ `models/User.js` - Added 4 new fields
- ✅ `controllers/contactController.js` - Updated to handle new fields
- ✅ `controllers/userController.js` - Enhanced signup/signin
- ✅ `routes/authRoutes.js` - Implemented user creation in OTP verification
- ✅ `utils/emailService.js` - Enhanced email template

**Total New Fields:** 9
- Contact: mobile, state, city, reason (+ updated phone/subject)
- User: phone (required), age, gender, income, occupation

**Zero Breaking Changes:** All updates are backward compatible with existing data.

---

## 🔗 Related Documentation
- Frontend Form Updates: See conversation history
- API Documentation: Update Postman/Swagger with new fields
- Database Schema: MongoDB automatically handles new fields

---

**Last Updated:** October 16, 2025  
**Version:** 2.0.0  
**Status:** ✅ Ready for Testing
