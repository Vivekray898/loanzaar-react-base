# Quick API Testing Guide

## 🚀 Test Your Updated APIs

### 1️⃣ Contact Form API

**Endpoint:** `POST https://loanzaar-react-base.onrender.com/api/contact`

**Test Case 1: Full Contact Form**
```json
{
  "name": "Rajesh Kumar",
  "email": "rajesh@example.com",
  "phone": "9876543210",
  "mobile": "9876543210",
  "state": "Maharashtra",
  "city": "Mumbai",
  "reason": "Loan Assistance",
  "subject": "Home Loan Inquiry",
  "message": "I am interested in applying for a home loan for a property in Mumbai. My budget is around 50 lakhs. Please contact me.",
  "captchaToken": "test_token"
}
```

**Test Case 2: Minimum Required Fields**
```json
{
  "name": "Priya Singh",
  "email": "priya@example.com",
  "phone": "9123456789",
  "subject": "General Inquiry",
  "message": "I would like to know more about your loan products and services."
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Contact form submitted successfully",
  "data": {
    "contactId": "6729abc123def456..."
  }
}
```

---

### 2️⃣ Sign Up Flow (with OTP)

#### Step 1: Send OTP
**Endpoint:** `POST https://loanzaar-react-base.onrender.com/api/auth/send-otp`

```json
{
  "name": "Amit Sharma",
  "email": "amit@example.com",
  "captchaToken": "test_token"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully"
}
```

**Check Console:** You'll see the OTP printed (e.g., "123456")

---

#### Step 2: Verify OTP & Create Account
**Endpoint:** `POST https://loanzaar-react-base.onrender.com/api/auth/verify-otp`

```json
{
  "email": "amit@example.com",
  "otp": "123456",
  "userData": {
    "name": "Amit Sharma",
    "email": "amit@example.com",
    "password": "SecurePass123",
    "phone": "9876543210",
    "age": 30,
    "gender": "Male",
    "income": "₹5-10L",
    "occupation": "Salaried"
  }
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Account created successfully",
  "user": {
    "email": "amit@example.com",
    "name": "Amit Sharma",
    "phone": "9876543210",
    "age": 30,
    "gender": "Male",
    "income": "₹5-10L",
    "occupation": "Salaried"
  }
}
```

---

### 3️⃣ Sign In API

**Endpoint:** `POST https://loanzaar-react-base.onrender.com/api/users/signin`

**Test Case 1: Login with Email**
```json
{
  "identifier": "amit@example.com",
  "password": "SecurePass123"
}
```

**Test Case 2: Login with Phone**
```json
{
  "identifier": "9876543210",
  "password": "SecurePass123"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Sign in successful",
  "data": {
    "userId": "6729abc123def456...",
    "name": "Amit Sharma",
    "email": "amit@example.com",
    "phone": "9876543210",
    "age": 30,
    "gender": "Male",
    "income": "₹5-10L",
    "occupation": "Salaried",
    "role": "user",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

## 🧪 Using cURL Commands

### Contact Form
```bash
curl -X POST https://loanzaar-react-base.onrender.com/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "phone": "9876543210",
    "state": "Delhi",
    "city": "New Delhi",
    "reason": "General Inquiry",
    "subject": "Test Subject",
    "message": "This is a test message from the updated contact form"
  }'
```

### Send OTP
```bash
curl -X POST https://loanzaar-react-base.onrender.com/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "captchaToken": "test_token"
  }'
```

### Sign In with Email
```bash
curl -X POST https://loanzaar-react-base.onrender.com/api/users/signin \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "amit@example.com",
    "password": "SecurePass123"
  }'
```

### Sign In with Phone
```bash
curl -X POST https://loanzaar-react-base.onrender.com/api/users/signin \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "9876543210",
    "password": "SecurePass123"
  }'
```

---

## 📊 Database Queries (MongoDB Shell)

### Check Contact Submissions
```javascript
db.contacts.find().sort({ createdAt: -1 }).limit(5).pretty()
```

### Check User Registrations
```javascript
db.users.find().sort({ createdAt: -1 }).limit(5).pretty()
```

### Find User by Email
```javascript
db.users.findOne({ email: "amit@example.com" })
```

### Find User by Phone
```javascript
db.users.findOne({ phone: "9876543210" })
```

---

## ✅ Validation Testing

### Test Invalid Data

**1. Contact Form - Missing Required Field**
```json
{
  "name": "Test",
  "email": "test@example.com"
  // Missing: phone, subject, message
}
```
**Expected:** 400 Bad Request - "Please provide name, email, phone, subject, and message"

---

**2. Sign Up - Invalid Phone**
```json
{
  "email": "test@example.com",
  "otp": "123456",
  "userData": {
    "name": "Test",
    "email": "test@example.com",
    "password": "pass",
    "phone": "1234567890"  // Invalid: doesn't start with 6-9
  }
}
```
**Expected:** Validation error from frontend, won't reach backend

---

**3. Sign In - Wrong Credentials**
```json
{
  "identifier": "wrong@email.com",
  "password": "wrongpass"
}
```
**Expected:** 401 Unauthorized - "Invalid credentials"

---

## 🎯 Expected Email Notifications

### Contact Form Email
**Subject:** `New Contact Form Submission - Test User`

**Body includes:**
- Name, Email, Phone
- State, City (if provided)
- Reason (with badge styling)
- Subject
- Message (with line breaks)
- Timestamp (IST)

### OTP Email
**Subject:** `Verify Your Email - Loanzaar Account`

**Body includes:**
- Name greeting
- 6-digit OTP in boxes
- 5-minute expiry notice
- Security warning

---

## 🔧 Troubleshooting

### Issue: Email not sending
**Check:**
1. `.env` has correct EMAIL_USER and EMAIL_PASS
2. Zoho credentials are valid
3. Check backend console for error messages

### Issue: OTP not working
**Check:**
1. OTP is copied correctly from console
2. OTP hasn't expired (5 minutes)
3. Not exceeding 3 failed attempts

### Issue: Sign in not working
**Check:**
1. User was created successfully (check database)
2. Password is correct
3. Using correct identifier (email or phone)

---

## 📱 Postman Collection

Import this into Postman for quick testing:

```json
{
  "info": {
    "name": "Loanzaar Updated APIs",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Contact Form",
      "request": {
        "method": "POST",
        "url": "{{base_url}}/api/contact",
        "body": {
          "mode": "raw",
          "raw": "{\n  \"name\": \"{{$randomFullName}}\",\n  \"email\": \"{{$randomEmail}}\",\n  \"phone\": \"9876543210\",\n  \"state\": \"Maharashtra\",\n  \"city\": \"Mumbai\",\n  \"reason\": \"Loan Assistance\",\n  \"subject\": \"Test Subject\",\n  \"message\": \"Test message\"\n}"
        }
      }
    },
    {
      "name": "Send OTP",
      "request": {
        "method": "POST",
        "url": "{{base_url}}/api/auth/send-otp",
        "body": {
          "mode": "raw",
          "raw": "{\n  \"name\": \"Test User\",\n  \"email\": \"test@example.com\",\n  \"captchaToken\": \"test\"\n}"
        }
      }
    },
    {
      "name": "Verify OTP",
      "request": {
        "method": "POST",
        "url": "{{base_url}}/api/auth/verify-otp",
        "body": {
          "mode": "raw",
          "raw": "{\n  \"email\": \"test@example.com\",\n  \"otp\": \"123456\",\n  \"userData\": {\n    \"name\": \"Test User\",\n    \"email\": \"test@example.com\",\n    \"password\": \"Test@1234\",\n    \"phone\": \"9876543210\",\n    \"age\": 30,\n    \"gender\": \"Male\",\n    \"income\": \"₹5-10L\",\n    \"occupation\": \"Salaried\"\n  }\n}"
        }
      }
    },
    {
      "name": "Sign In (Email)",
      "request": {
        "method": "POST",
        "url": "{{base_url}}/api/users/signin",
        "body": {
          "mode": "raw",
          "raw": "{\n  \"identifier\": \"test@example.com\",\n  \"password\": \"Test@1234\"\n}"
        }
      }
    },
    {
      "name": "Sign In (Phone)",
      "request": {
        "method": "POST",
        "url": "{{base_url}}/api/users/signin",
        "body": {
          "mode": "raw",
          "raw": "{\n  \"identifier\": \"9876543210\",\n  \"password\": \"Test@1234\"\n}"
        }
      }
    }
  ],
  "variable": [
    {
      "key": "base_url",
      "value": "https://loanzaar-react-base.onrender.com"
    }
  ]
}
```

---

**Happy Testing! 🎉**

All APIs are now updated and ready to work with your modernized frontend forms.
