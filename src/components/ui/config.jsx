// API Configuration
export const API_URL = "https://stockmonitoring-api-gateway.onrender.com/api";

// Local environment check
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// Timeout settings (in milliseconds)
export const API_TIMEOUT = {
  DEFAULT: 10000,  // 10 seconds
  LONG: 30000,     // 30 seconds
  SHORT: 5000      // 5 seconds
};

// Default headers for API requests
export const API_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};

// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    VERIFY: '/auth/verify',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    SEND_OTP: '/auth/send-otp',
    VERIFY_OTP: '/auth/verify-otp'
  },
  USERS: {
    GET_USER: (userId) => `/users/${userId}`,
    UPDATE_USER: (userId) => `/users/${userId}`
  }
}; 