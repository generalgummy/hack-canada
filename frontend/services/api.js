import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Backend API URL — set via EXPO_PUBLIC_API_URL env var, defaults to localhost
// Use ngrok for physical device, or env var for flexibility
const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'https://maile-inoculable-ares.ngrok-free.dev') + '/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'ngrok-skip-browser-warning': 'true',
  },
});

// Request interceptor — attach JWT
api.interceptors.request.use(
  async (config) => {
    // If Authorization is already set via defaults or direct header, keep it
    if (config.headers.Authorization || api.defaults.headers.common['Authorization']) {
      // Ensure the default header is applied to this request
      if (!config.headers.Authorization && api.defaults.headers.common['Authorization']) {
        config.headers.Authorization = api.defaults.headers.common['Authorization'];
      }
      return config;
    }
    // Otherwise try to load token from storage
    try {
      let token = null;
      try {
        token = await SecureStore.getItemAsync('token');
      } catch (e) {
        // SecureStore fails on web — fall back to localStorage
        if (typeof window !== 'undefined' && window.localStorage) {
          token = window.localStorage.getItem('token');
        }
      }
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      // ignore
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 401 errors are handled by screen-level error handlers
    return Promise.reject(error);
  }
);

// Set token directly (used by AuthContext)
export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

// ==========================================
// Auth API
// ==========================================
export const loginAPI = (phone, password) =>
  api.post('/auth/login', { phone, password });

export const registerAPI = (userData) =>
  api.post('/auth/register', userData);

export const verifyOtpAPI = (userId, otp) =>
  api.post('/auth/verify-otp', { userId, otp });

export const resendOtpAPI = (userId) =>
  api.post('/auth/resend-otp', { userId });

export const getMeAPI = () => api.get('/auth/me');

export const updateProfileAPI = (formData) =>
  api.put('/auth/me', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

// ==========================================
// Listings API
// ==========================================
export const getListingsAPI = (params) => api.get('/listings', { params });

export const getMyListingsAPI = () => api.get('/listings/mine');

export const getListingAPI = (id) => api.get(`/listings/${id}`);

export const createListingAPI = (formData) =>
  api.post('/listings', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const updateListingAPI = (id, formData) =>
  api.put(`/listings/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const deleteListingAPI = (id) => api.delete(`/listings/${id}`);

export const expressInterestAPI = (id) => api.post(`/listings/${id}/interest`);

// ==========================================
// Orders API
// ==========================================
export const createOrderAPI = (data) => api.post('/orders', data);

export const getMyOrdersAPI = (params) => api.get('/orders/mine', { params });

export const getOrderAPI = (id) => api.get(`/orders/${id}`);

export const updateOrderStatusAPI = (id, data) =>
  api.put(`/orders/${id}/status`, data);

export const cancelOrderAPI = (id) => api.delete(`/orders/${id}`);

// ==========================================
// Chat API
// ==========================================
export const getChatRoomsAPI = () => api.get('/chat');

export const getChatMessagesAPI = (roomId, params) =>
  api.get(`/chat/${roomId}`, { params });

// ==========================================
// Users API
// ==========================================
export const getDashboardAPI = () => api.get('/users/dashboard');

export const getNearbyUsersAPI = (location) =>
  api.get('/users/nearby', { params: { location } });

export const getUserProfileAPI = (id) => api.get(`/users/${id}`);

export default api;
