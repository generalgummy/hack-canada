import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// ⚠️ Change this to your backend URL
// For physical device: use your computer's local IP (e.g., http://192.168.1.100:5000)
// For Expo Go on same machine: http://localhost:5000
const API_URL = 'http://10.200.8.149:5001/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

// Request interceptor — attach JWT
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      // SecureStore might fail on web
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired — could trigger logout
      console.log('Unauthorized — token may be expired');
    }
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
export const loginAPI = (email, password) =>
  api.post('/auth/login', { email, password });

export const registerAPI = (formData) =>
  api.post('/auth/register', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

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
