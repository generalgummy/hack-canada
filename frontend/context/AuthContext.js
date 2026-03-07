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

  // Auto-login on app reload
  useEffect(() => {
    restoreSession();
  }, []);

  const restoreSession = async () => {
    try {
      const storedToken = await SecureStore.getItemAsync('token');
      if (storedToken) {
        setAuthToken(storedToken);
        const res = await api.get('/auth/me');
        setUser(res.data.user);
        setToken(storedToken);
        connectSocket(storedToken);
      }
    } catch (error) {
      console.log('Session restore failed:', error.message);
      await SecureStore.deleteItemAsync('token');
      setAuthToken(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token: newToken, user: userData } = res.data;
    await SecureStore.setItemAsync('token', newToken);
    setAuthToken(newToken);
    setToken(newToken);
    setUser(userData);
    connectSocket(newToken);
    return userData;
  };

  const register = async (formData) => {
    const res = await api.post('/auth/register', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const { token: newToken, user: userData } = res.data;
    await SecureStore.setItemAsync('token', newToken);
    setAuthToken(newToken);
    setToken(newToken);
    setUser(userData);
    connectSocket(newToken);
    return userData;
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('token');
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
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
