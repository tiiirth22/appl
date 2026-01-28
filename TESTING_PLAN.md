# ApplianceIQ Testing Plan - Phase 2

**Date**: January 28, 2026  
**Status**: Testing Phase - In Progress

---

## Testing Objectives

### Phase 2A: Backend API Testing (Unit & Integration)
- [ ] **Auth System Tests**
  - [ ] User registration (signup) validation
  - [ ] User login with correct/incorrect credentials
  - [ ] Password hashing verification
  - [ ] Session token generation and validation
  - [ ] Role-based access control (RBAC) enforcement

- [ ] **Manual Management Tests**
  - [ ] Manual upload endpoint
  - [ ] Manual retrieval by ID
  - [ ] Manual listing (all, by owner, by admin)
  - [ ] Manual deletion (authorization checks)
  - [ ] Metadata validation

- [ ] **RAG & Chat Tests**
  - [ ] Vector embedding generation
  - [ ] Qdrant integration (if available)
  - [ ] Chat query processing
  - [ ] Answer generation from context
  - [ ] Source tracking

- [ ] **Admin Functionality Tests**
  - [ ] User management (list, view, delete)
  - [ ] System stats endpoint
  - [ ] All-manuals endpoint
  - [ ] Admin-only access restrictions

- [ ] **QR Code Tests**
  - [ ] QR code generation
  - [ ] QR code signature verification
  - [ ] Short URL generation

### Phase 2B: Frontend UI Testing (Manual)
- [ ] **Authentication Flow**
  - [ ] Landing page loads
  - [ ] Signup form validation
  - [ ] Login form validation
  - [ ] Redirect to dashboard after login
  - [ ] Session persistence across page reload

- [ ] **Dashboard Navigation**
  - [ ] Admin dashboard displays for admin users
  - [ ] Business owner dashboard displays for business owners
  - [ ] Navigation between pages works
  - [ ] Logout functionality

- [ ] **Manual Upload**
  - [ ] File selection works
  - [ ] Form validation (title, description)
  - [ ] Upload success/error handling
  - [ ] Manual appears in dashboard after upload

- [ ] **Chat Interface**
  - [ ] Chat loads for manual
  - [ ] Query submission works
  - [ ] Response displays correctly
  - [ ] Chat history preserved

- [ ] **Admin Panel**
  - [ ] User list displays
  - [ ] Manual list displays
  - [ ] System stats visible
  - [ ] User/manual deletion works

### Phase 2C: End-to-End Testing
- [ ] **Complete User Journey**
  - [ ] New user signup → login → manual upload → chat → logout
  - [ ] Admin user signup → admin dashboard → user management
  - [ ] Multiple users, data isolation verification

---

## Testing Environment Setup

### Prerequisites
- Python 3.9+
- Node.js 14+
- MongoDB (optional but recommended for full testing)
- Qdrant (optional but recommended for RAG testing)
- Ollama (optional for RAG testing)

### Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
pip install pytest pytest-asyncio httpx  # Add testing tools
```

### Frontend Setup
```bash
cd frontend
npm install
npm test  # Start test runner
```

---

## Test Execution Order

### Week 1: Backend API Testing
1. **Unit Tests** (individual function tests)
   - Auth functions (register, login, validate token)
   - Password hashing
   - Role checking

2. **Integration Tests** (API endpoint tests)
   - Auth endpoints (/api/auth/signup, /api/auth/login)
   - Manual endpoints (/api/manuals/upload, /api/manuals/:id)
   - Admin endpoints (/api/admin/users, /api/admin/stats)
   - Chat endpoints (/api/chat/query)

3. **Database Tests**
   - MongoDB connection and CRUD ops
   - Qdrant connection and vector operations

### Week 2: Frontend Testing
1. **Component Tests**
   - Login/Signup form validation
   - Dashboard loading

2. **Manual Testing**
   - User flows (signup → login → upload → chat)
   - Admin flows (user management)
   - Role-based UI rendering

### Week 3: E2E Testing
- Full application workflow
- Multi-user scenarios
- Edge cases and error handling

---

## Test Success Criteria

- [x] All API endpoints respond with correct status codes
- [x] Authentication flow works (signup → login → access protected routes)
- [x] Role-based access control enforced (admin/business_owner)
- [x] User data is properly isolated
- [x] Frontend pages load without errors
- [x] User can upload manuals and chat about them
- [x] Admin can view and manage users
- [x] All error messages are user-friendly

---

## Bug Tracking

Bugs found during testing will be logged below with fixes applied:

| Bug ID | Description | Status | Fix Date |
|--------|-------------|--------|----------|
| TBD | - | - | - |

---

## Notes

- MongoDB and Qdrant are **optional** for basic auth/routing testing
- Focus on core features first: auth, RBAC, manual management
- ML features (RAG, QR codes) can be tested separately with optional services
- Document all findings and issues discovered during testing

