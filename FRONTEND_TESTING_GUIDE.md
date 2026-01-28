# Frontend Testing Guide - Jest & React Testing Library

**Date**: January 28, 2026

## Setup

### Install Testing Dependencies
```bash
cd frontend
npm install
# The following are already configured in Create React App:
# - Jest (test runner)
# - React Testing Library (component testing)
# - @testing-library/jest-dom (DOM matchers)
```

### Run Tests
```bash
# Interactive test watcher
npm test

# Run tests once (CI mode)
npm test -- --watch=false

# Run specific test file
npm test Auth -- --watch=false

# Generate coverage report
npm test -- --coverage --watch=false
```

---

## Test Structure

### Component Tests Location
```
frontend/src/components/
├── __tests__/
│   ├── Auth.test.js
│   ├── Dashboard.test.js
│   ├── ManualUpload.test.js
│   └── ChatBot.test.js
```

### Page Tests Location
```
frontend/src/pages/
├── __tests__/
│   ├── Login.test.js
│   ├── Signup.test.js
│   ├── Landing.test.js
│   └── AdminDashboard.test.js
```

---

## Test Examples

### Test 1: Login Component Rendering
```javascript
import { render, screen } from '@testing-library/react';
import Login from '../pages/Login';

test('renders login form', () => {
  render(<Login />);
  const emailInput = screen.getByPlaceholderText(/email/i);
  const passwordInput = screen.getByPlaceholderText(/password/i);
  const submitButton = screen.getByRole('button', { name: /login/i });
  
  expect(emailInput).toBeInTheDocument();
  expect(passwordInput).toBeInTheDocument();
  expect(submitButton).toBeInTheDocument();
});
```

### Test 2: Form Validation
```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import Signup from '../pages/Signup';

test('shows error on invalid email', async () => {
  render(<Signup />);
  const emailInput = screen.getByPlaceholderText(/email/i);
  const submitButton = screen.getByRole('button', { name: /sign up/i });
  
  fireEvent.change(emailInput, { target: { value: 'invalid' } });
  fireEvent.click(submitButton);
  
  const errorMsg = await screen.findByText(/invalid email/i);
  expect(errorMsg).toBeInTheDocument();
});
```

### Test 3: Navigation
```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from '../App';

test('navigates to login on button click', () => {
  render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
  const loginButton = screen.getByRole('button', { name: /login/i });
  fireEvent.click(loginButton);
  
  // Verify navigation occurred
  expect(window.location.pathname).toContain('/login');
});
```

---

## Jest Configuration

### package.json Configuration
```json
{
  "jest": {
    "testEnvironment": "jsdom",
    "setupFilesAfterEnv": ["<rootDir>/src/setupTests.js"],
    "moduleNameMapper": {
      "\\.(css|less|scss|sass)$": "identity-obj-proxy",
      "\\.(jpg|jpeg|png|gif|svg)$": "<rootDir>/__mocks__/fileMock.js"
    },
    "collectCoverageFrom": [
      "src/**/*.{js,jsx}",
      "!src/index.js",
      "!src/reportWebVitals.js"
    ]
  }
}
```

### Setup File (src/setupTests.js)
```javascript
import '@testing-library/jest-dom';

// Mock window.localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock API calls
global.fetch = jest.fn();
```

---

## Coverage Goals

### Target Coverage
- **Statements**: 80%
- **Branches**: 75%
- **Functions**: 80%
- **Lines**: 80%

### Critical Components (100% target)
- Authentication pages (Login, Signup)
- Role-based routing
- Dashboard selection logic

### Optional Components (70% target)
- UI components (buttons, forms)
- Styling and presentation
- Error messages

---

## Manual Testing Checklist

Before running automated tests, verify manual functionality:

### Authentication
- [ ] Signup form displays correctly
- [ ] Email validation works
- [ ] Password strength validation (if implemented)
- [ ] Error messages display on invalid input
- [ ] Login form displays correctly
- [ ] Login with correct credentials works
- [ ] Login with wrong credentials shows error

### Navigation
- [ ] All links work
- [ ] Navigation bar displays correctly
- [ ] User menu works (if logged in)
- [ ] Logout button works

### Dashboard
- [ ] Dashboard loads after login
- [ ] User name/info displays correctly
- [ ] Navigation menu shows correct items for role
- [ ] Upload button visible and clickable
- [ ] Manual list displays (if any)

### Forms
- [ ] Upload form displays all fields
- [ ] File input accepts files
- [ ] Form validation works
- [ ] Submit button works
- [ ] Success/error messages display

---

## Running Tests Locally

### Quick Test
```bash
cd frontend
npm test -- --watch=false Auth
```

### Full Test Suite
```bash
cd frontend
npm test -- --watch=false
```

### With Coverage
```bash
cd frontend
npm test -- --coverage --watch=false
```

### Watch Mode (Continuous)
```bash
cd frontend
npm test
# Press 'a' to run all tests
# Press 'q' to quit
```

---

## Debugging Tests

### Run Single Test
```bash
npm test -- --testNamePattern="login" --watch=false
```

### Enable Debugging
```javascript
import { render, screen, debug } from '@testing-library/react';

test('debug example', () => {
  const { container } = render(<Component />);
  debug(container); // Prints DOM structure
  screen.debug(); // Prints rendered output
});
```

### React DevTools
- Chrome DevTools extension for React
- Useful for inspecting component state and props
- Can pause on state changes

---

## Common Issues & Solutions

### Issue: Tests timeout
**Solution**: Increase timeout in jest.config.js
```javascript
jest.setTimeout(10000); // 10 seconds
```

### Issue: Async test fails
**Solution**: Use async/await in test
```javascript
test('async operation', async () => {
  const result = await fetchData();
  expect(result).toBeDefined();
});
```

### Issue: Component doesn't render
**Solution**: Wrap in necessary providers
```javascript
render(
  <BrowserRouter>
    <Provider store={store}>
      <Component />
    </Provider>
  </BrowserRouter>
);
```

---

## Next Steps

1. Create basic component tests
2. Add form validation tests
3. Add navigation tests
4. Increase coverage to target levels
5. Set up CI/CD to run tests automatically
6. Document any edge cases found

