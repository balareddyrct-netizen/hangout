import React, { createContext, useState, useEffect, useContext } from 'react';
import apiClient from '../api/client';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await apiClient.get('/users/me');
          setUser(response.data);
        } catch (error) {
          console.error("Auth check failed:", error);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (username, password) => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);
    
    const response = await apiClient.post('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    
    const token = response.data.access_token;
    localStorage.setItem('token', token);
    
    // Fetch user profile
    const userRes = await apiClient.get('/users/me');
    setUser(userRes.data);
    return userRes.data;
  };

  const register = async (username, email, password) => {
    const res = await apiClient.post('/auth/register', { username, email, password });
    // After registration, log them in to get a token
    await login(username, password);
    return res.data;
  };

  const refreshUser = async () => {
    try {
      const userRes = await apiClient.get('/users/me');
      setUser(userRes.data);
    } catch (e) {
      console.error("Refresh user failed:", e);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, refreshUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
