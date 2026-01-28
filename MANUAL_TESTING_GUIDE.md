# ApplianceIQ Frontend Manual Testing Guide

**Date**: January 28, 2026

## Overview
This guide covers manual testing of the ApplianceIQ frontend UI. These tests verify user interactions, navigation, form validation, and role-based features.

---

## Environment Setup

### Start Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

### Start Frontend
```bash
cd frontend
npm install
npm start
# Opens http://localhost:3000
```

---

## Test Cases

### 1. Landing Page Tests

#### Test 1.1: Landing Page Loads
- **Steps**:
  1. Open http://localhost:3000
  2. Verify page displays without errors
  3. Check navigation bar is visible
  
- **Expected**: 
  - Page loads successfully
  - Login/Signup buttons visible
  - No console errors

- **Status**: [ ] PASS [ ] FAIL

#### Test 1.2: Landing Page Navigation
- **Steps**:
  1. Click "Login" button
  2. Verify redirected to login page
  3. Go back to landing page
  4. Click "Signup" button
  5. Verify redirected to signup page

- **Expected**:
  - Navigation works correctly
  - URLs change appropriately
  - Page content updates

- **Status**: [ ] PASS [ ] FAIL

---

### 2. Authentication Tests

#### Test 2.1: User Signup Flow
- **Steps**:
  1. Navigate to signup page (/signup)
  2. Fill in email: `testuser@example.com`
  3. Fill in password: `TestPassword123!`
  4. Select role: Business Owner
  5. Click "Sign Up"

- **Expected**:
  - Form validates input
  - No errors on submission
  - Redirected to login or dashboard
  - Success message displays

- **Status**: [ ] PASS [ ] FAIL

#### Test 2.2: Signup Form Validation
- **Steps**:
  1. Navigate to signup page
  2. Leave email field empty, try to submit
  3. Enter invalid email (e.g., "notanemail")
  4. Enter password with less than 6 characters
  5. Try to submit incomplete form

- **Expected**:
  - Form prevents submission with errors
  - Error messages display for invalid fields
  - User is guided to fix errors

- **Status**: [ ] PASS [ ] FAIL

#### Test 2.3: User Login Flow
- **Steps**:
  1. Navigate to login page (/login)
  2. Enter email: `testuser@example.com`
  3. Enter password: `TestPassword123!`
  4. Click "Login"

- **Expected**:
  - Login succeeds
  - Redirected to dashboard
  - Session is established
  - User info available in UI

- **Status**: [ ] PASS [ ] FAIL

#### Test 2.4: Login with Wrong Password
- **Steps**:
  1. Navigate to login page
  2. Enter existing email
  3. Enter wrong password
  4. Click "Login"

- **Expected**:
  - Login fails
  - Error message displays: "Invalid credentials" or similar
  - User stays on login page
  - Can retry login

- **Status**: [ ] PASS [ ] FAIL

#### Test 2.5: Session Persistence
- **Steps**:
  1. Login successfully
  2. Navigate to dashboard
  3. Refresh page (F5)
  4. Navigate to other pages
  5. Close and reopen browser (check cookies)

- **Expected**:
  - Session persists after refresh
  - User remains logged in
  - Protected pages are accessible without re-login
  - User info displays correctly

- **Status**: [ ] PASS [ ] FAIL

---

### 3. Business Owner Dashboard Tests

#### Test 3.1: Dashboard Loads After Login
- **Steps**:
  1. Login as business owner
  2. Verify redirected to /dashboard
  3. Check page loads without errors

- **Expected**:
  - Dashboard page displays
  - User name/email visible
  - Navigation menu present
  - No console errors

- **Status**: [ ] PASS [ ] FAIL

#### Test 3.2: Upload Manual Page
- **Steps**:
  1. From dashboard, click "Upload Manual" button
  2. Verify redirect to /upload
  3. Check form fields present (title, description, file)

- **Expected**:
  - Upload page loads
  - Form has required fields
  - File input accepts PDF/images
  - Clear instructions provided

- **Status**: [ ] PASS [ ] FAIL

#### Test 3.3: Manual Upload Form
- **Steps**:
  1. Navigate to upload page
  2. Fill title: "Microwave Manual"
  3. Fill description: "User guide for microwave model XYZ"
  4. Select a PDF or image file
  5. Click "Upload"

- **Expected**:
  - Form accepts input
  - File upload starts
  - Loading indicator shows
  - Success message after upload
  - Manual appears in manual list

- **Status**: [ ] PASS [ ] FAIL

#### Test 3.4: Manual List Display
- **Steps**:
  1. From dashboard, view "My Manuals" section
  2. Verify uploaded manuals appear in list
  3. Click on a manual to view details

- **Expected**:
  - Manuals display with title and description
  - Upload date visible
  - Click opens manual details or chat interface
  - Multiple manuals display correctly

- **Status**: [ ] PASS [ ] FAIL

#### Test 3.5: Manual Chat Interface
- **Steps**:
  1. Click on a manual to open it
  2. Verify chat interface loads
  3. Type a question: "How do I set the timer?"
  4. Submit question

- **Expected**:
  - Chat window displays
  - Question appears in chat
  - Response loads from backend
  - Chat history displays

- **Status**: [ ] PASS [ ] FAIL

---

### 4. Admin Dashboard Tests

#### Test 4.1: Admin Dashboard Access
- **Steps**:
  1. Create admin user during signup
  2. Login as admin
  3. Verify redirected to admin dashboard

- **Expected**:
  - Admin dashboard loads (different from business owner)
  - Admin-specific features visible
  - User management section present
  - System stats visible

- **Status**: [ ] PASS [ ] FAIL

#### Test 4.2: User Management Page
- **Steps**:
  1. From admin dashboard, click "User Management"
  2. Verify list of users displays
  3. Check user details (email, role, created_at)

- **Expected**:
  - User list displays with correct information
  - Pagination works (if many users)
  - Can search/filter users
  - User actions available (view, delete, etc.)

- **Status**: [ ] PASS [ ] FAIL

#### Test 4.3: Manual Management (Admin View)
- **Steps**:
  1. From admin dashboard, click "All Manuals"
  2. Verify list shows manuals from all users
  3. Check owner information displays

- **Expected**:
  - All manuals visible (not just admin's)
  - Owner/user information shown
  - Can delete manuals
  - Can view manual details

- **Status**: [ ] PASS [ ] FAIL

#### Test 4.4: System Statistics
- **Steps**:
  1. From admin dashboard, view stats section
  2. Check displayed metrics (total users, manuals, queries, etc.)

- **Expected**:
  - Stats display meaningful data
  - Numbers are accurate
  - Dashboard updates periodically
  - Charts or graphs display correctly (if present)

- **Status**: [ ] PASS [ ] FAIL

---

### 5. Navigation and Routing Tests

#### Test 5.1: Protected Routes
- **Steps**:
  1. Try to access /dashboard while logged out
  2. Try to access /admin while logged out as non-admin
  3. Verify redirect to login

- **Expected**:
  - Redirected to login page
  - Cannot access protected routes without auth
  - Proper error messages

- **Status**: [ ] PASS [ ] FAIL

#### Test 5.2: Role-Based Route Access
- **Steps**:
  1. Login as business owner
  2. Try to access admin routes (/admin)
  3. Verify access denied or not visible

- **Expected**:
  - Business owners cannot access admin routes
  - Admin links not visible in navigation
  - Appropriate error message if attempting direct access

- **Status**: [ ] PASS [ ] FAIL

#### Test 5.3: Navigation Menu
- **Steps**:
  1. Login and view navigation menu
  2. Click each menu item
  3. Verify all links work

- **Expected**:
  - Menu displays appropriate items for user role
  - All navigation links functional
  - Current page highlighted
  - Mobile navigation works (if responsive)

- **Status**: [ ] PASS [ ] FAIL

---

### 6. Logout and Session Tests

#### Test 6.1: Logout Functionality
- **Steps**:
  1. Login successfully
  2. Click "Logout" button
  3. Verify redirected to landing page

- **Expected**:
  - Session terminated
  - Redirected to landing page
  - Protected routes now inaccessible
  - Login page appears when accessing /dashboard

- **Status**: [ ] PASS [ ] FAIL

#### Test 6.2: Session Timeout
- **Steps**:
  1. Login successfully
  2. Wait for session to potentially expire (check backend settings)
  3. Try to perform an action (view manual, upload, etc.)

- **Expected**:
  - If token expired, redirect to login
  - Error message explains session expired
  - Can login again

- **Status**: [ ] PASS [ ] FAIL

---

### 7. Error Handling and Edge Cases

#### Test 7.1: Network Error Handling
- **Steps**:
  1. Stop backend server
  2. Try to perform API call from frontend (submit form, query chat)
  3. Check error handling

- **Expected**:
  - User-friendly error message displays
  - App doesn't crash
  - Retry option available
  - Console shows actual error for debugging

- **Status**: [ ] PASS [ ] FAIL

#### Test 7.2: Form Validation with Special Characters
- **Steps**:
  1. Fill forms with special characters: `<>\'"`
  2. Try to submit forms

- **Expected**:
  - Special characters handled correctly
  - No XSS vulnerabilities
  - Data displays correctly

- **Status**: [ ] PASS [ ] FAIL

#### Test 7.3: Large File Upload
- **Steps**:
  1. Try to upload a large file (>50MB)
  2. Check error handling

- **Expected**:
  - File size validation works
  - Clear error message if file too large
  - Prevents broken uploads

- **Status**: [ ] PASS [ ] FAIL

---

## Test Summary

### Results
- **Total Tests**: 27
- **Passed**: [ ]
- **Failed**: [ ]
- **Blocked**: [ ]

### Critical Issues Found
(List any blocking issues found during testing)

### Minor Issues Found
(List any non-blocking issues found)

### Recommendations
- [ ] All core flows working
- [ ] Security: role-based access enforced
- [ ] UX: error messages are helpful
- [ ] Performance: pages load quickly
- [ ] Ready for production deployment

---

## Notes
- Document any bugs with screenshots/steps to reproduce
- Test across different browsers if possible
- Test on mobile (responsive design)
- Check console for JavaScript errors
- Verify network requests in DevTools

