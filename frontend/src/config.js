// Support both REACT_APP_API_URL (new) and REACT_APP_BACKEND_URL (legacy)
const BACKEND_URL = process.env.REACT_APP_API_URL || process.env.REACT_APP_BACKEND_URL || "http://127.0.0.1:8000";
const ML_SERVICE_URL = process.env.REACT_APP_ML_SERVICE_URL || "http://127.0.0.1:8001";

// Ensure no trailing slashes for consistency
const cleanBackendUrl = BACKEND_URL.replace(/\/$/, "");
const cleanMlUrl = ML_SERVICE_URL.replace(/\/$/, "");

// Only append /api if it's not already included in the URL
export const API_BASE_URL = cleanBackendUrl.endsWith('/api') ? cleanBackendUrl : `${cleanBackendUrl}/api`;
export const ML_BASE_URL = cleanMlUrl;

const config = {
  BACKEND_URL: cleanBackendUrl,
  ML_SERVICE_URL: cleanMlUrl,
  API_BASE_URL,
  ML_BASE_URL
};

export default config;
