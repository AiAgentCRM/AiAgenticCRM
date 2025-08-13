# Admin Authentication System Setup Guide

This guide will help you set up the secure admin authentication system for AiAgenticCRM.

## Features Implemented

✅ **Secure Admin Authentication**
- Email/username and password authentication
- Secure password hashing using bcryptjs
- JWT token-based session management
- Account lockout protection (5 failed attempts = 2-hour lockout)

✅ **Route Protection**
- All admin routes are protected with authentication middleware
- Permission-based access control
- Automatic redirect to login for unauthenticated users

✅ **Session Management**
- 8-hour JWT token expiration
- Secure logout functionality
- Session persistence until logout or timeout

✅ **Security Features**
- SQL injection prevention through input validation
- Brute force attack protection
- Role-based permissions system
- Secure password storage

## Setup Instructions

### 1. Backend Setup

The backend already includes all necessary dependencies:
- `bcryptjs` for password hashing
- `jsonwebtoken` for JWT tokens
- `mongoose` for database management

### 2. Create Initial Admin Account

Run the setup script to create your first admin account:

```bash
# Navigate to backend directory
cd backend

# Run setup with default credentials
npm run setup-admin

# Or specify custom credentials
node setup-admin.js <username> <email> <password>
```

**Default credentials:**
- Username: `admin`
- Email: `admin@aiagenticcrm.com`
- Password: `admin123456`

**Example with custom credentials:**
```bash
node setup-admin.js superadmin admin@company.com MySecurePassword123
```

### 3. Frontend Setup

The frontend components are already implemented:
- Admin login page at `/admin/login`
- Protected admin routes
- Admin authentication middleware

### 4. Access the Admin Panel

1. Start the backend server:
   ```bash
   cd backend
   npm start
   ```

2. Start the frontend:
   ```bash
   cd frontend
   npm start
   ```

3. Navigate to the admin login:
   ```
   http://localhost:3000/admin/login
   ```

4. Log in with your admin credentials

5. Access the admin panel at:
   ```
   http://localhost:3000/admin
   ```

## Admin Routes and Permissions

### Available Permissions
- `manage_tenants` - Manage tenant accounts
- `manage_plans` - Manage subscription plans
- `view_analytics` - View system analytics
- `manage_payments` - Manage payment gateways
- `system_settings` - Access system settings
- `user_management` - Manage user accounts

### Protected Admin Endpoints
All admin endpoints now require authentication:

- `GET /api/admin/tenants` - List all tenants
- `POST /api/admin/tenants/:id/approve` - Approve tenant
- `POST /api/admin/tenants/:id/block` - Block tenant
- `POST /api/admin/tenants/:id/unblock` - Unblock tenant
- `DELETE /api/admin/tenants/:id` - Delete tenant
- `GET /api/admin/plans` - List subscription plans
- `POST /api/admin/plans` - Create plan
- `PUT /api/admin/plans/:id` - Update plan
- `DELETE /api/admin/plans/:id` - Delete plan
- `GET /api/admin/plan-requests` - List plan requests
- `POST /api/admin/tenants/:id/plan-request` - Approve/reject plan request
- `POST /api/admin/tenants/:id/reset-usage` - Reset tenant usage
- `POST /api/admin/deduplicate-leads/:tenantId` - Deduplicate leads

## Security Features

### Password Security
- Passwords are hashed using bcryptjs with salt rounds of 12
- Minimum password length of 8 characters
- Passwords are never stored in plain text

### Account Protection
- Accounts are locked after 5 failed login attempts
- Lockout duration: 2 hours
- Failed attempts are tracked and reset on successful login

### Session Security
- JWT tokens expire after 8 hours
- Tokens are validated on every admin request
- Secure logout clears all session data

### Input Validation
- All inputs are validated server-side
- SQL injection prevention through parameterized queries
- XSS protection through proper input sanitization

## Admin Roles

### Super Admin
- Has access to all permissions
- Can manage other admin accounts
- Full system access

### Admin
- Standard admin permissions
- Can manage tenants and plans
- Limited system access

### Moderator
- Basic admin permissions
- Can view analytics and manage basic settings
- Restricted access

## Troubleshooting

### Common Issues

1. **"Admin setup already completed"**
   - This means an admin account already exists
   - You can either use existing credentials or reset the database

2. **"Invalid credentials"**
   - Check username/email and password
   - Ensure account is not locked
   - Verify account is active

3. **"Access token required"**
   - You're not logged in as admin
   - Navigate to `/admin/login` first

4. **"Insufficient permissions"**
   - Your admin account doesn't have the required permission
   - Contact super admin to grant permissions

### Reset Admin Account

If you need to reset the admin system:

1. Clear the admin collection in MongoDB:
   ```javascript
   db.admins.deleteMany({})
   ```

2. Run the setup script again:
   ```bash
   npm run setup-admin
   ```

## API Documentation

### Admin Authentication Endpoints

#### POST /api/admin/auth/login
Login as admin
```json
{
  "username": "admin",
  "password": "password123"
}
```

#### POST /api/admin/auth/logout
Logout (requires authentication)

#### GET /api/admin/auth/profile
Get current admin profile (requires authentication)

#### POST /api/admin/auth/setup
Create initial admin account (only works if no admin exists)

## Environment Variables

Ensure these environment variables are set:

```env
JWT_SECRET=your-secret-key-here
MONGODB_URI=your-mongodb-connection-string
```

## Support

For issues or questions about the admin authentication system, please refer to the main project documentation or contact the development team.
