import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL=https:'//civic-fix-3ijr.onrender.com/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('civicfix_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Base URL for statically-served evidence photos/videos (strip the trailing /api)
export const FILE_BASE_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

export default api;
