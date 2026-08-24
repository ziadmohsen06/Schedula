import React, { createContext, useState, useContext } from 'react';
import { logoutUser } from '../services/api';

const AuthContext = createContext();

// "Remember me" decides where the session lives: localStorage survives
// closing the browser/tab (persistent login), sessionStorage is cleared
// when the tab/browser closes (asks for login again next time).
const readStoredUser = () => {
  const fromLocal = localStorage.getItem('user');
  if (fromLocal) return JSON.parse(fromLocal);
  const fromSession = sessionStorage.getItem('user');
  return fromSession ? JSON.parse(fromSession) : null;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(readStoredUser());

  const login = (userData, remember = false) => {
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
    (remember ? localStorage : sessionStorage).setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const updateUser = (newData) => {
    const persistedInLocal = !!localStorage.getItem('user');
    const store = persistedInLocal ? localStorage : sessionStorage;
    const current = JSON.parse(store.getItem('user')) || {};
    const merged = { ...current, ...newData };
    store.setItem('user', JSON.stringify(merged));
    setUser(merged);
  };

  const logout = async () => {
    try {
      await logoutUser();
    } catch (error) {
      // Ignore logout API failures and still clear local auth state
    } finally {
      localStorage.removeItem('user');
      sessionStorage.removeItem('user');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);