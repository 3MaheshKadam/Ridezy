"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import * as SecureStore from 'expo-secure-store';
import { get } from '../lib/api';
import { endpoints } from '../config/apiConfig';

const UserContext = createContext()

export const useUser = () => {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentBooking, setCurrentBooking] = useState(null)

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      if (token) {
        const userData = await get(endpoints.auth.me);
        if (userData) {
          setUser(userData);
          setIsAuthenticated(true);
        }
      }
    } catch (error) {
      console.log('User restoration failed:', error);
    }
  };

  const login = (userData, token) => {
    setUser(userData)
    setIsAuthenticated(true)
    if (token) SecureStore.setItemAsync('userToken', token);
  }

  const logout = async () => {
    await SecureStore.deleteItemAsync('userToken');
    setUser(null)
    setIsAuthenticated(false)
    setCurrentBooking(null)
  }

  const updateProfile = (profileData) => {
    setUser((prev) => ({ ...prev, ...profileData }))
  }

  // useMemo to prevent unnecessary re-renders of consumers
  const value = React.useMemo(() => ({
    user,
    isAuthenticated,
    currentBooking,
    login,
    logout,
    updateProfile,
    setCurrentBooking,
  }), [user, isAuthenticated, currentBooking]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}
