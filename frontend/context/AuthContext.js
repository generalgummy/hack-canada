import React, { createContext, useState, useEffect, useContext } from 'react';
import * as SecureStore from 'expo-secure-store';
import api, { setAuthToken } from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingOtp, setPendingOtp] = useState(null); // { userId, phone, source: 'login'|'register', documentImage? }

  // Auto-login on app reload
  useEffect(() => {
    restoreSession();
  }, []);

  const restoreSession = async () => {
    try {
      let storedToken;
      try {
        storedToken = await SecureStore.getItemAsync('token');
      } catch (e) {
        // SecureStore may be unavailable on web — try localStorage as fallback
        if (typeof window !== 'undefined' && window.localStorage) {
          storedToken = window.localStorage.getItem('token');
        }
      }
      if (storedToken) {
        setAuthToken(storedToken);
        const res = await api.get('/auth/me');
        setUser(res.data.user);
        setToken(storedToken);
        connectSocket(storedToken);
      }
    } catch (error) {
      console.log('Session restore failed:', error.message);
      try {
        await SecureStore.deleteItemAsync('token');
      } catch (e) {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem('token');
        }
      }
      setAuthToken(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (phone, password) => {
    const res = await api.post('/auth/login', { phone, password });
    const { userId, phone: userPhone } = res.data;
    setPendingOtp({ userId, phone: userPhone, source: 'login' });
    return res.data;
  };

  const register = async (userData, documentImage) => {
    const res = await api.post('/auth/register', userData);
    const { userId, phone } = res.data;
    setPendingOtp({ userId, phone, source: 'register', documentImage });
    return res.data;
  };

  const verifyOtp = async (otp) => {
    if (!pendingOtp) throw new Error('No pending OTP verification');

    const res = await api.post('/auth/verify-otp', {
      userId: pendingOtp.userId,
      otp,
    });
    const { token: newToken, user: newUser } = res.data;
    try {
      await SecureStore.setItemAsync('token', newToken);
    } catch (e) {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('token', newToken);
      }
    }
    setAuthToken(newToken);
    setToken(newToken);
    setUser(newUser);
    connectSocket(newToken);

    // Upload document image in background if this was registration
    if (pendingOtp.source === 'register' && pendingOtp.documentImage) {
      try {
        const docImage = pendingOtp.documentImage;
        const formData = new FormData();
        const uri = docImage.uri;
        const mimeType = docImage.mimeType || docImage.type || 'image/jpeg';
        const ext = mimeType.split('/').pop() || 'jpg';
        formData.append('documentImage', {
          uri,
          type: mimeType,
          name: `document.${ext}`,
        });

        const uploadRes = await api.put('/auth/upload-document', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 60000,
        });
        if (uploadRes.data?.user) {
          setUser(uploadRes.data.user);
        }
      } catch (uploadError) {
        console.log('Document upload failed (can retry later):', uploadError.message);
      }
    }

    setPendingOtp(null);
    return newUser;
  };

  const resendOtp = async () => {
    if (!pendingOtp) throw new Error('No pending OTP verification');
    await api.post('/auth/resend-otp', { userId: pendingOtp.userId });
  };

  const cancelOtp = () => {
    setPendingOtp(null);
  };

  const logout = async () => {
    try {
      await SecureStore.deleteItemAsync('token');
    } catch (e) {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem('token');
      }
    }
    setAuthToken(null);
    setToken(null);
    setUser(null);
    disconnectSocket();
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        pendingOtp,
        login,
        register,
        verifyOtp,
        resendOtp,
        cancelOtp,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
