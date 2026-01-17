import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { get, patch } from '../lib/api';
import { endpoints } from '../config/apiConfig';
import { useUser } from './UserContext';

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
                setUnreadCount(data.count);
            }
        } catch (error) {
            console.log('Error fetching notification count:', error);
        }
    }, [user]);

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

    return (
        <NotificationContext.Provider value={{
            unreadCount,
            notifications,
            loading,
            fetchNotifications,
            fetchUnreadCount,
            markAsRead
        }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => useContext(NotificationContext);
