const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "https://applianceiq-production.up.railway.app";
const ML_SERVICE_URL = process.env.REACT_APP_ML_SERVICE_URL || "https://upbeat-contentment-production-ed5c.up.railway.app";

// Ensure no trailing slashes for consistency
const cleanBackendUrl = BACKEND_URL.replace(/\/$/, "");
const cleanMlUrl = ML_SERVICE_URL.replace(/\/$/, "");

export const API_BASE_URL = `${cleanBackendUrl}/api`;
export const ML_BASE_URL = cleanMlUrl;

const config = {
  BACKEND_URL: cleanBackendUrl,
  ML_SERVICE_URL: cleanMlUrl,
  API_BASE_URL,
  ML_BASE_URL
};

export default config;
