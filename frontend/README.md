# ApplianceIQ Frontend

This is the React-based frontend for the ApplianceIQ platform.

## Architecture

The frontend is built with React and styled using Tailwind CSS. It uses Radix UI for accessible components and Lucide for icons.

## Key Components

- **App.js**: Main routing and authentication state management.
- **pages/**: Contains top-level views for Landing, Login, Signup, and Dashboards.
- **components/**: Reusable UI elements built with Radix UI and Tailwind.
- **hooks/**: Custom React hooks for global functionality like notifications.

## Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment:
   Create a `.env.local` file with:
   ```
   REACT_APP_BACKEND_URL=http://localhost:8000
   ```

3. Run the development server:
   ```bash
   npm start
   ```

## Production Build

To create a production-optimized build:
```bash
npm run build
```
