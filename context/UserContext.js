"use client"

import { createContext, useContext, useState, useEffect } from "react"
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
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "Booking Confirmed",
      message: "Your car service has been confirmed for tomorrow at 10:00 AM",
      time: "2 hours ago",
      read: false,
      type: "booking",
    },
    {
      id: 2,
      title: "Partner Assigned",
      message: "John Doe has been assigned as your service partner",
      time: "1 day ago",
      read: false,
      type: "partner",
    },
    {
      id: 3,
      title: "Payment Successful",
      message: "Payment of ₹2,500 has been processed successfully",
      time: "2 days ago",
      read: true,
      type: "payment",
    },
  ])

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      if (token) {
        // Fetch user profile
        const userData = await get(endpoints.auth.me);
        if (userData) {
          setUser(userData);
          setIsAuthenticated(true);
        }
      }
    } catch (error) {
      console.log('User restoration failed:', error);
      // Optional: Clear invalid token
      // await SecureStore.deleteItemAsync('userToken');
    }
  };

  const login = (userData, token) => {
    console.log('UserContext Login:', JSON.stringify(userData, null, 2));
    if (userData?.vehicleStatus) console.log('User Vehicle Status:', userData.vehicleStatus);
    setUser(userData)
    setIsAuthenticated(true)
    if (token) {
      SecureStore.setItemAsync('userToken', token);
    }
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

  const addNotification = (notification) => {
    setNotifications((prev) => [{ ...notification, id: Date.now(), time: "Just now", read: false }, ...prev])
  }

  const markNotificationAsRead = (id) => {
    setNotifications((prev) => prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif)))
  }

  const value = {
    user,
    isAuthenticated,
    currentBooking,
    notifications,
    login,
    logout,
    updateProfile,
    setCurrentBooking,
    addNotification,
    markNotificationAsRead,
  }

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}
