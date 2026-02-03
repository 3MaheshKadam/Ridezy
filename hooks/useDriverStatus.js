import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { get, patch } from '../lib/api';
import { endpoints } from '../config/apiConfig';

export const useDriverStatus = () => {
    const [isOnline, setIsOnline] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchStatus = useCallback(async () => {
        try {
            setLoading(true);
            const data = await get(endpoints.drivers.stats);
            if (data?.driverProfile?.isAvailable !== undefined) {
                setIsOnline(data.driverProfile.isAvailable);
            }
        } catch (error) {
            console.error("Failed to fetch driver status:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    const toggleStatus = async () => {
        const newStatus = !isOnline;

        // Optimistic Update
        setIsOnline(newStatus);

        return new Promise((resolve) => {
            Alert.alert(
                newStatus ? 'Going Online' : 'Going Offline',
                newStatus ?
                    'You will start receiving trip requests and location tracking will be enabled.' :
                    'You will stop receiving trip requests and location tracking will be disabled.',
                [
                    {
                        text: 'Cancel',
                        style: 'cancel',
                        onPress: () => {
                            setIsOnline(!newStatus); // Revert
                            resolve(false);
                        }
                    },
                    {
                        text: newStatus ? 'Go Online' : 'Go Offline',
                        onPress: async () => {
                            try {
                                const res = await patch(endpoints.drivers.status, { isAvailable: newStatus });
                                setIsOnline(res.isAvailable);
                                Alert.alert('Status Updated', `You are now ${res.isAvailable ? 'online' : 'offline'}`);
                                resolve(true);
                            } catch (error) {
                                console.error("Status toggle error", error);
                                setIsOnline(!newStatus); // Revert
                                Alert.alert('Error', 'Failed to update status');
                                resolve(false);
                            }
                        }
                    }
                ]
            );
        });
    };

    return {
        isOnline,
        setIsOnline, // Exposed for manual updates if needed
        loading,
        fetchStatus,
        toggleStatus
    };
};
