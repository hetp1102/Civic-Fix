import axios from 'axios';

const API_BASE_URL =
  process.env.REACT_APP_API_URL || 'https://civic-fix-3ijr.onrender.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('civicfix_token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Base URL for uploaded evidence files
export const FILE_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');

export default api;