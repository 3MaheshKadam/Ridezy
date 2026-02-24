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
            const response = await get(endpoints.auth.me);

            if (response && response.user) {
                const refreshedUser = response.user;
                updateUser(refreshedUser); // Update context with fresh data

                if (refreshedUser.status === 'ACTIVE') {
                    Alert.alert(
                        "Congratulations!",
                        "Your account has been approved. Welcome to Ridezy!",
                        [{ text: "Get Started", onPress: () => navigation.replace('DriverTabs') }]
                    );
                } else if (refreshedUser.status === 'REJECTED') {
                    Alert.alert(
                        "Application Update",
                        "Your application has been rejected. Please contact support for more information."
                    );
                } else {
                    Alert.alert(
                        "Status Check",
                        "Your application is still under review. We'll notify you once it's approved!"
                    );
                }
            }
        } catch (error) {
            console.log("Check status error", error);
            Alert.alert(
                "Status Check",
                "We couldn't reach the server. Please try again later."
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
