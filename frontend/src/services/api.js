import axios from 'axios';

// Read API URL from environment variable, fallback to relative /api
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Response interceptor to format errors into user-friendly messages
api.interceptors.response.use(
  (response) => response,
  (error) => {
    let message = 'An unexpected error occurred. Please try again.';
    
    if (error.response) {
      const data = error.response.data;
      if (data && data.message) {
        message = data.message;
      } else if (data && data.errors) {
        message = Object.values(data.errors).join(', ');
      } else if (error.response.status === 404) {
        message = 'The requested resource was not found.';
      } else if (error.response.status === 409) {
        message = 'Conflict: Operation could not be completed.';
      } else if (error.response.status === 400) {
        message = 'Please check the entered information.';
      } else if (error.response.status >= 500) {
        message = 'Server error. Please verify backend service.';
      }
    } else if (error.request) {
      message = 'Cannot connect to backend server. Make sure Spring Boot is running on port 8080.';
    }

    const customError = new Error(message);
    customError.status = error.response ? error.response.status : 0;
    customError.data = error.response ? error.response.data : null;
    return Promise.reject(customError);
  }
);

export default api;
