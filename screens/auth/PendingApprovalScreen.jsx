import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, StatusBar, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useUser } from '../../context/UserContext';
import { get } from '../../lib/api';
import { endpoints } from '../../config/apiConfig';
const PendingApprovalScreen = ({ navigation }) => {
    const { user, logout, updateUser } = useUser();
    const [isChecking, setIsChecking] = useState(false);

    const checkStatus = async () => {
        setIsChecking(true);
        try {
            // We need an endpoint to get the current user's profile/status
            // Assuming we can use a profile endpoint or refreshing the token logic
            // For now, let's assume we have an endpoint 'auth/me' or similar, 
            // OR we can just hit the driver stats endpoint if it returns 403 for unapproved? 
            // Actually, let's reuse valid endpoints. 'drivers/stats' might work if it returns the user object.
            // Or better, 'auth/profile' if it exists. 

            // Let's rely on the user object in context first? No, we need to fetch fresh data.
            // If UserContext doesn't have a refresh method that hits the API, we need one.
            // Let's assume we can fetch '/api/auth/me' or similar. 
            // Checking existing endpoints... `endpoints` might have something.
            // If not, we might need to add a simple 'get current user status' endpoint or use an existing one.

            // Temporary strategy: Try to login again silently? No, that requires password.
            // Let's try fetching the profile.

            // WORKAROUND: If we don't have a specific "get my status" endpoint, 
            // we can try to fetch a protected resource. If it works and returns specific data...
            // Actually, let's look at `DriverProfileScreen`. It fetches `endpoints.drivers.stats`.

            const response = await get(endpoints.drivers.stats);

            if (response && response.driverProfile) {
                // Determine status from the response if possible?
                // The stats endpoint usually returns the driver profile.
                // We also need the USER status (ACTIVE vs PENDING_APPROVAL).
                // The `drivers/stats` endpoint might need to return the User status too.

                // Let's try to infer or if we can't get it, we might need a better endpoint.
                // BUT, if the admin approved, the User.status would be ACTIVE.
                // Does `drivers/stats` return `user.status`? 

                // If we can't easily check, list ask the user to logout and login again.
                // But a 'Refresh' button is nicer.

                // Simple approach for now:
                Alert.alert(
                    "Status Update",
                    "Please log out and log back in to see if your account has been approved.",
                    [{ text: "OK" }]
                );
            }

        } catch (error) {
            console.log("Check status error", error);
            Alert.alert(
                "Status Check",
                "Account is still pending approval or an error occurred."
            );
        } finally {
            setIsChecking(false);
        }
    };

    return (
        <View className="flex-1 bg-white items-center justify-center p-6">
            <StatusBar barStyle="dark-content" />

            <View className="w-24 h-24 bg-yellow-50 rounded-full items-center justify-center mb-6">
                <Ionicons name="time" size={48} color="#F59E0B" />
            </View>

            <Text className="text-2xl font-bold text-gray-900 text-center mb-2">
                Approval Pending
            </Text>

            <Text className="text-gray-500 text-center mb-8 px-4 leading-6">
                Your driver application is currently under review by our admin team. This process usually takes 24-48 hours.
            </Text>

            <View className="w-full bg-gray-50 rounded-xl p-4 mb-8">
                <Text className="text-sm font-semibold text-gray-700 mb-2">What happens next?</Text>
                <View className="flex-row items-start mb-2">
                    <Ionicons name="checkmark-circle" size={16} color="#10B981" style={{ marginTop: 2, marginRight: 8 }} />
                    <Text className="text-gray-600 text-sm flex-1">Admin verifies your documents</Text>
                </View>
                <View className="flex-row items-start mb-2">
                    <Ionicons name="checkmark-circle" size={16} color="#10B981" style={{ marginTop: 2, marginRight: 8 }} />
                    <Text className="text-gray-600 text-sm flex-1">Background check completion</Text>
                </View>
                <View className="flex-row items-start">
                    <Ionicons name="checkmark-circle" size={16} color="#10B981" style={{ marginTop: 2, marginRight: 8 }} />
                    <Text className="text-gray-600 text-sm flex-1">Account activation & notification</Text>
                </View>
            </View>

            <TouchableOpacity
                onPress={checkStatus}
                className="w-full mb-4"
                activeOpacity={0.8}
            >
                <LinearGradient
                    colors={['#F59E0B', '#D97706']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    className="py-4 rounded-xl items-center flex-row justify-center"
                >
                    {isChecking ? (
                        <ActivityIndicator color="white" size="small" />
                    ) : (
                        <>
                            <Ionicons name="refresh" size={20} color="white" style={{ marginRight: 8 }} />
                            <Text className="text-white font-bold text-lg">Check Status</Text>
                        </>
                    )}
                </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
                onPress={logout}
                className="py-4"
            >
                <Text className="text-gray-500 font-semibold">Log Out</Text>
            </TouchableOpacity>
        </View>
    );
};

export default PendingApprovalScreen;
