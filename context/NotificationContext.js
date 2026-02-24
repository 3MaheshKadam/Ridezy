import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { get, patch } from '../lib/api';
import { endpoints } from '../config/apiConfig';
import { useUser } from './UserContext';
import { Ionicons } from '@expo/vector-icons';
const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const { user } = useUser();
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);

    // Fetch Count only (Lightweight)
    const fetchUnreadCount = useCallback(async () => {
        if (!user) return;
        try {
            const data = await get(endpoints.notifications.unreadCount);
            if (data && typeof data.count === 'number') {
                // If count changed and is greater than before, it means we have new notifications
                // effectively fetch the list to update popup
                if (data.count !== unreadCount) {
                    setUnreadCount(data.count);
                    fetchNotifications();
                }
            }
        } catch (error) {
            console.log('Error fetching notification count:', error);
        }
    }, [user, unreadCount, fetchNotifications]);

    // Fetch Full List
    const fetchNotifications = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const data = await get(endpoints.notifications.list);
            if (data && data.notifications) {
                setNotifications(data.notifications);
                // Update count based on list to be in sync
                const unread = data.notifications.filter(n => !n.isRead).length;
                setUnreadCount(unread);
            }
        } catch (error) {
            console.log('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    // Mark as Read
    const markAsRead = async (id) => {
        try {
            // Optimistic update
            if (id === 'all') {
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                setUnreadCount(0);
            } else {
                setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
                setUnreadCount(prev => Math.max(0, prev - 1));
            }

            await patch(endpoints.notifications.markRead(id));

            // Re-fetch to ensure sync
            await fetchUnreadCount();
        } catch (error) {
            console.log('Error marking as read:', error);
            // Revert changes if needed (omitted for simplicity)
        }
    };

    // Polling for count
    useEffect(() => {
        if (user?._id) {
            fetchUnreadCount();
            const interval = setInterval(fetchUnreadCount, 30000); // Poll every 30s
            return () => clearInterval(interval);
        }
    }, [user?._id]); // Only re-run if the actual user changes, not just the object reference

    // Popup State
    const [popupNotification, setPopupNotification] = useState(null);

    // Initial check for high priority notifications on every fetch
    useEffect(() => {
        if (notifications.length > 0) {
            // Find the most recent unread high-priority notification
            const highPriority = notifications.find(n => !n.isRead && n.priority === 'high');
            // Simple logic: if we have one and we haven't seen it in this session (or just show it)
            // Ideally should track "shown" state separately, but for now showing the top unread high priority one
            // filtering out if already in popup status
            if (highPriority && (!popupNotification || popupNotification._id !== highPriority._id)) {
                // Check if it was created recently (e.g., last 2 minutes) to avoid showing old ones on reload
                const now = new Date();
                const notifTime = new Date(highPriority.createdAt);
                const diffMins = (now - notifTime) / 60000;

                if (diffMins < 5) { // Show if within last 5 mins
                    setPopupNotification(highPriority);
                }
            }
        }
    }, [notifications]);

    return (
        <NotificationContext.Provider value={{
            unreadCount,
            notifications,
            loading,
            fetchNotifications,
            fetchUnreadCount,
            markAsRead,
            popupNotification,
            setPopupNotification
        }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => useContext(NotificationContext);
