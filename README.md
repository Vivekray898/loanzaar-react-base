# LoanZaar Backend API

Complete Node.js + Express backend for the LoanZaar multi-loan portal.

## Features

- 🏦 **Multi-Loan Support**: Personal, Home, Business, Education, Gold, Machinery, Solar, Property, Insurance
- 📧 **Email Notifications**: Automated emails to admin on form submissions
- 🔐 **User Authentication**: JWT-based auth with bcrypt password hashing
- 🎫 **Ticket System**: Support ticket management for loan applications
- 📊 **Admin Dashboard**: Comprehensive CRUD operations for all entities
- 🔍 **Filtering & Pagination**: Query loans by type, status, with pagination support

## Tech Stack

- **Runtime**: Node.js with ES6 Modules
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT + bcryptjs
- **Email**: Nodemailer
- **Security**: CORS enabled

## Project Structure

```
backend/
├── server.js                    # Main server file
├── package.json                 # Dependencies
├── .env.example                 # Environment variables template
├── models/
│   ├── Loan.js                  # Loan schema (all loan types)
│   ├── Contact.js               # Contact form schema
│   ├── User.js                  # User/Admin schema
│   └── Ticket.js                # Support ticket schema
├── controllers/
│   ├── loanController.js        # Loan CRUD operations
│   ├── contactController.js     # Contact form handlers
│   ├── userController.js        # Auth & user management
│   └── ticketController.js      # Ticket management
├── routes/
│   ├── loanRoutes.js            # /api/loans endpoints
│   ├── contactRoutes.js         # /api/contact endpoints
│   ├── userRoutes.js            # /api/users endpoints
│   └── ticketRoutes.js          # /api/admin/tickets endpoints
├── middleware/
│   └── authMiddleware.js        # JWT verification & admin check
└── utils/
    └── emailService.js          # Email sending utilities
```

## Installation

1. **Install Dependencies**:
```bash
cd backend
npm install
```

2. **Environment Setup**:
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your actual values
```

3. **Configure Environment Variables**:
```
MONGO_URI=mongodb://localhost:27017/loanzaar
PORT=5000
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
ADMIN_EMAIL=admin@loanzaar.com
JWT_SECRET=your-super-secret-key
FRONTEND_URL=http://localhost:5173
```

4. **Start MongoDB**:
```bash
# Make sure MongoDB is running
mongod
```

5. **Run the Server**:
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

## API Endpoints

### Loan Routes (`/api/loans`)

- **POST** `/api/loans` - Submit a new loan application
- **GET** `/api/loans` - Get all loans (with filters)
- **GET** `/api/loans/:id` - Get a specific loan
- **PATCH** `/api/loans/:id` - Update loan status
- **DELETE** `/api/loans/:id` - Delete a loan

**Query Parameters**:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `loanType` - Filter by type (Personal, Home, Business, etc.)
- `status` - Filter by status (Pending, Approved, Rejected, etc.)

### Contact Routes (`/api/contact`)

- **POST** `/api/contact` - Submit contact form
- **GET** `/api/contact` - Get all contact submissions
- **PATCH** `/api/contact/:id` - Update contact status
- **DELETE** `/api/contact/:id` - Delete a contact

### User Routes (`/api/users`)

- **POST** `/api/users/signup` - Register new user
- **POST** `/api/users/signin` - User login
- **GET** `/api/users/profile` - Get user profile (protected)
- **PUT** `/api/users/profile` - Update user profile (protected)
- **GET** `/api/users` - Get all users (admin only)

### Ticket Routes (`/api/admin/tickets`)

- **POST** `/api/admin/tickets` - Create a ticket
- **GET** `/api/admin/tickets` - Get all tickets
- **GET** `/api/admin/tickets/:id` - Get specific ticket
- **PATCH** `/api/admin/tickets/:id/status` - Update ticket status
- **PATCH** `/api/admin/tickets/:id/assign` - Assign ticket to user
- **POST** `/api/admin/tickets/:id/notes` - Add note to ticket
- **DELETE** `/api/admin/tickets/:id` - Delete ticket

## Example API Calls

### Submit Personal Loan
```bash
curl -X POST https://loanzaar-react-base.onrender.com/api/loans \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "email": "john@example.com",
    "phone": "9876543210",
    "cityState": "Mumbai, Maharashtra",
    "loanType": "Personal",
    "loanAmount": 500000,
    "tenure": "36 months",
    "purpose": "Wedding",
    "monthlyIncome": "75000",
    "employmentType": "Salaried",
    "companyName": "ABC Corp",
    "existingLoans": "No",
    "consent": true
  }'
```

### Submit Contact Form
```bash
curl -X POST https://loanzaar-react-base.onrender.com/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Smith",
    "email": "jane@example.com",
    "phone": "9876543210",
    "subject": "Query about home loan",
    "message": "I need information about home loan eligibility"
  }'
```

### User Signup
```bash
curl -X POST https://loanzaar-react-base.onrender.com/api/users/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@loanzaar.com",
    "password": "admin123",
    "phone": "9876543210"
  }'
```

### User Signin
```bash
curl -X POST https://loanzaar-react-base.onrender.com/api/users/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@loanzaar.com",
    "password": "admin123"
  }'
```

## Email Setup (Gmail)

1. **Enable 2-Factor Authentication** in your Gmail account
2. **Generate App Password**:
   - Go to Google Account Settings
   - Security → App Passwords
   - Select "Mail" and generate password
3. **Use in .env**:
```
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=generated-app-password
```

## Loan Types & Fields

The backend supports the following loan types with specific fields:

### Personal Loan
- Basic fields + purpose, monthlyIncome, employmentType, companyName, existingLoans, creditScore

### Home Loan
- Basic fields + age, propertyType, propertyValue, loanPurpose, employmentType, companyName, monthlyIncome, workExperience, existingLoans

### Business Loan
- Basic fields + ageDob, businessName, businessType, industryType, yearsInBusiness, businessAddress, gstNo, turnover, profit, bankStatement, itrFiled, existingLoans

### Education Loan
- Basic fields + dobAge, qualification, courseName, courseType, institutionName, institutionCountry, courseDuration, admissionStatus, courseCost, loanPurpose, coApplicantName, relation, occupation, monthlyIncome, existingLoans

### Gold Loan
- Basic fields + goldWeight, goldPurity, goldType

### Machinery Loan
- Basic fields + machineryType, machineryValue, machineryAge, vendorName, usageType, businessName, turnover

### Solar Loan
- Basic fields + roofType, systemCapacity, ownershipType, electricityBill, location, propertyType

### Property Loan
- Basic fields + propertyLocation, propertyType, marketValue, constructionYear, propertyDocuments, ownershipType

### Insurance (Life, Health, General)
- Basic fields + insuranceType, coverageAmount, ageDOB, assetType (for general)

## Security Features

- **Password Hashing**: All passwords hashed with bcrypt (10 salt rounds)
- **JWT Authentication**: Token-based authentication with 30-day expiry
- **CORS Protection**: Configured for specific frontend origin
- **Input Validation**: Required field validation on all submissions
- **Error Handling**: Comprehensive try-catch blocks with meaningful messages

## Database Indexes

Optimized queries with indexes on:
- `email` - User and contact lookups
- `loanType` - Filter loans by type
- `status` - Filter by status
- `createdAt` - Sort by date
- `ticketNumber` - Unique ticket identification

## Development Tips

1. **Testing API**: Use Postman or Thunder Client VSCode extension
2. **MongoDB GUI**: Use MongoDB Compass for database visualization
3. **Email Testing**: Use Mailtrap for development email testing
4. **Logs**: Check console for request logs and errors
5. **Hot Reload**: Use `npm run dev` with nodemon for auto-restart

## Production Deployment

1. Set `NODE_ENV=production` in .env
2. Use strong JWT_SECRET
3. Configure production MongoDB URI (MongoDB Atlas recommended)
4. Set up proper email service (SendGrid, AWS SES, etc.)
5. Enable rate limiting and helmet for security
6. Set up proper logging (Winston, Morgan)
7. Use PM2 for process management

## Support

For issues or questions, contact: admin@loanzaar.com

## License

ISC License - LoanZaar 2025
