import React, { createContext, useState, useEffect, useContext } from 'react';
import * as SecureStore from 'expo-secure-store';
import api, { setAuthToken } from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';
import {
  loginWithAuth0Social,
  loginWithAuth0Passwordless,
  verifyAuth0Passwordless,
  clearAuth0Token,
} from '../services/auth0';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingOtp, setPendingOtp] = useState(null); // { userId, phone, source: 'login'|'register', documentImage? }
  const [needsProfileCompletion, setNeedsProfileCompletion] = useState(false);

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

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });

    // Admin users get token directly (no OTP)
    if (res.data.token && res.data.user) {
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
      return newUser;
    }

    // Normal users go through OTP flow
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

  // ==========================================
  // Auth0 Methods
  // ==========================================

  const loginWithSocial = async (connection = 'google-oauth2') => {
    try {
      console.log('🔐 [AuthContext] loginWithSocial called with connection:', connection);
      const result = await loginWithAuth0Social(connection);
      console.log('🔐 [AuthContext] loginWithAuth0Social returned:', {
        success: result.success,
        hasToken: !!result.token,
        hasUser: !!result.user,
        error: result.error,
      });
      
      if (result.success && result.token && result.user) {
        console.log('🔐 [AuthContext] Setting auth state...');
        setAuthToken(result.token);
        setToken(result.token);
        setUser(result.user);
        connectSocket(result.token);

        // Check if user needs to complete their profile (no userType set yet)
        if (!result.user.userType) {
          console.log('🔐 [AuthContext] User needs to complete profile');
          setNeedsProfileCompletion(true);
        } else {
          console.log('✅ [AuthContext] Auth0 social login successful');
        }
        return result.user;
      } else {
        throw new Error(result.error || 'Auth0 login failed');
      }
    } catch (error) {
      console.error('❌ [AuthContext] Social login error:', error.message);
      throw error;
    }
  };

  const loginPasswordless = async (email) => {
    try {
      const result = await loginWithAuth0Passwordless(email);
      if (result.success) {
        console.log('✅ Passwordless challenge sent to email');
        setPendingOtp({ email, source: 'auth0_passwordless' });
        return result.data;
      } else {
        throw new Error(result.error || 'Passwordless login failed');
      }
    } catch (error) {
      console.error('Passwordless login error:', error.message);
      throw error;
    }
  };

  const verifyPasswordlessOtp = async (otp) => {
    if (!pendingOtp || pendingOtp.source !== 'auth0_passwordless') {
      throw new Error('No pending passwordless OTP verification');
    }

    try {
      const result = await verifyAuth0Passwordless(pendingOtp.email, otp);
      if (result.success && result.token && result.user) {
        setAuthToken(result.token);
        setToken(result.token);
        setUser(result.user);
        connectSocket(result.token);
        setPendingOtp(null);
        console.log('✅ Auth0 passwordless verification successful');
        return result.user;
      } else {
        throw new Error(result.error || 'OTP verification failed');
      }
    } catch (error) {
      console.error('Passwordless OTP verification error:', error.message);
      throw error;
    }
  };

  const completeAuth0Profile = async (profileData, documentImage) => {
    try {
      console.log('🔐 [AuthContext] Completing Auth0 profile...');
      
      // Create FormData for multipart upload if there's a document image
      let formData;
      if (documentImage) {
        formData = new FormData();
        formData.append('userType', profileData.userType);
        formData.append('location', profileData.location);
        formData.append('phone', profileData.phone);
        
        if (profileData.hunterLicenseNumber)
          formData.append('hunterLicenseNumber', profileData.hunterLicenseNumber);
        if (profileData.organizationType)
          formData.append('organizationType', profileData.organizationType);
        if (profileData.communitySize)
          formData.append('communitySize', profileData.communitySize);
        if (profileData.address)
          formData.append('address', profileData.address);
        if (profileData.businessName)
          formData.append('businessName', profileData.businessName);
        if (profileData.businessRegistrationNumber)
          formData.append('businessRegistrationNumber', profileData.businessRegistrationNumber);
        
        // Add document image
        const uri = documentImage.uri;
        const mimeType = documentImage.mimeType || documentImage.type || 'image/jpeg';
        const ext = mimeType.split('/').pop() || 'jpg';
        formData.append('documentImage', {
          uri,
          type: mimeType,
          name: `document.${ext}`,
        });

        const res = await api.put('/auth/complete-profile', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 60000,
        });

        if (res.data?.user) {
          setUser(res.data.user);
          setNeedsProfileCompletion(false);
          console.log('✅ [AuthContext] Profile completed successfully');
          return res.data.user;
        }
      } else {
        // No document image, send as JSON
        const res = await api.put('/auth/complete-profile', profileData);
        if (res.data?.user) {
          setUser(res.data.user);
          setNeedsProfileCompletion(false);
          console.log('✅ [AuthContext] Profile completed successfully');
          return res.data.user;
        }
      }

      throw new Error('Failed to complete profile');
    } catch (error) {
      console.error('❌ [AuthContext] Profile completion error:', error.message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await SecureStore.deleteItemAsync('token');
    } catch (e) {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem('token');
      }
    }
    try {
      await clearAuth0Token();
    } catch (e) {
      console.log('Error clearing Auth0 token:', e.message);
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
        needsProfileCompletion,
        login,
        register,
        verifyOtp,
        resendOtp,
        cancelOtp,
        loginWithSocial,
        loginPasswordless,
        verifyPasswordlessOtp,
        completeAuth0Profile,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
