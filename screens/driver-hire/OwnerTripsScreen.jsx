import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Animated,
    Dimensions,
    StatusBar,
    Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { get } from '../../lib/api';
import { endpoints } from '../../config/apiConfig';

const { width } = Dimensions.get('window');

const OwnerTripsScreen = ({ navigation }) => {
    const [selectedTab, setSelectedTab] = useState('ongoing');
    const [refreshing, setRefreshing] = useState(false);

    // Animation values
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideUpAnim = useRef(new Animated.Value(30)).current;
    const spinValue = useRef(new Animated.Value(0)).current;

    // Tripe state data
    const [tripsData, setTripsData] = useState({
        ongoing: [],
        completed: [],
        cancelled: []
    });

    const fetchTrips = async () => {
        setRefreshing(true);
        try {
            let historyTrips = [];
            const historyRes = await get(endpoints.trips.history);

            if (historyRes?.trips) {
                historyTrips = historyRes.trips.map(t => ({
                    ...t,
                    id: t._id,
                    driverName: t.driverId?.name || 'Waiting for Driver',
                    driverAvatar: t.driverId?.avatar || '👤',
                    fare: t.price,
                    completedTime: new Date(t.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    cancelledTime: new Date(t.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    startTime: new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                }));
            }

            const ongoing = historyTrips.filter(t => ['OPEN', 'ACCEPTED', 'IN_PROGRESS'].includes(t.status));
            const completed = historyTrips.filter(t => t.status === 'COMPLETED');
            const cancelled = historyTrips.filter(t => t.status === 'CANCELLED');

            setTripsData({
                ongoing,
                completed,
                cancelled
            });

        } catch (error) {
            console.error("Error fetching trips:", error);
            Alert.alert("Error", "Failed to load trips");
        } finally {
            setRefreshing(false);
        }
    };

    const tabs = [
        { id: 'ongoing', label: 'Ongoing', count: tripsData.ongoing.length, color: '#3B82F6' },
        { id: 'completed', label: 'Completed', count: tripsData.completed.length, color: '#00C851' },
        { id: 'cancelled', label: 'Cancelled', count: tripsData.cancelled.length, color: '#dc2626' },
    ];

    useFocusEffect(
        React.useCallback(() => {
            fetchTrips();
        }, [])
    );

    useEffect(() => {
        startAnimations();
    }, []);

    useEffect(() => {
        if (refreshing) {
            Animated.loop(
                Animated.timing(spinValue, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                })
            ).start();
        } else {
            spinValue.setValue(0);
            spinValue.stopAnimation();
        }
    }, [refreshing]);

    const startAnimations = () => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(slideUpAnim, {
                toValue: 0,
                duration: 600,
                delay: 200,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const onRefresh = async () => {
        await fetchTrips();
    };

    const spin = spinValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg']
    });

    const renderOngoingTripCard = ({ item }) => (
        <View key={item.id} className="bg-white rounded-2xl mx-4 mb-4 shadow-sm shadow-black/5 border border-gray-100 overflow-hidden">
            <View className="p-4">
                {/* Header */}
                <View className="flex-row items-center justify-between mb-4">
                    <View className="flex-row items-center">
                        <View className="w-12 h-12 bg-accent/10 rounded-2xl justify-center items-center mr-3">
                            <Text className="text-2xl">{item.driverAvatar}</Text>
                        </View>
                        <View>
                            <Text className="text-primary text-lg font-bold">
                                {item.driverName}
                            </Text>
                            <Text className="text-secondary text-sm">
                                Requested at {item.startTime}
                            </Text>
                        </View>
                    </View>
                    <Text className="text-primary text-2xl font-bold">
                        ₹{item.fare}
                    </Text>
                </View>

                {/* Status indicator */}
                <View className="bg-blue-50 rounded-xl p-3 mb-4">
                    <View className="flex-row items-center">
                        <Ionicons name="information-circle" size={16} color="#3B82F6" />
                        <Text className="text-blue-600 text-sm ml-2 font-semibold">
                            Status: {item.status.replace('_', ' ')}
                        </Text>
                    </View>
                </View>

                {/* Route Info */}
                <View className="space-y-3">
                    <View className="flex-row items-center">
                        <View className="w-3 h-3 bg-accent rounded-full mr-3" />
                        <Text className="text-primary text-sm font-medium flex-1">
                            {item.pickupLocation}
                        </Text>
                    </View>
                    <View className="ml-1 w-0.5 h-4 bg-gray-300" />
                    <View className="flex-row items-center">
                        <View className="w-3 h-3 bg-red-500 rounded-full mr-3" />
                        <Text className="text-primary text-sm font-medium flex-1">
                            {item.dropLocation}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Action Buttons */}
            <View className="bg-gray-50 px-4 py-3 flex-row space-x-3">
                {item.status !== 'OPEN' && (
                    <TouchableOpacity
                        onPress={() => Alert.alert('Call', `Calling driver...`)}
                        className="flex-1 bg-blue-100 rounded-xl py-3 justify-center items-center mr-2"
                        activeOpacity={0.8}
                    >
                        <Text className="text-blue-600 text-base font-semibold">
                            Contact Driver
                        </Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity
                    onPress={() => navigation.navigate('OwnerTripTracking', { tripDetails: item })}
                    className="flex-1 rounded-xl overflow-hidden ml-2"
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={['#00C851', '#00A843']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={{
                            paddingVertical: 12,
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}
                    >
                        <Text className="text-white text-base font-semibold">
                            Track Trip
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderCompletedTripCard = ({ item }) => (
        <View key={item.id} className="bg-white rounded-2xl mx-4 mb-4 shadow-sm shadow-black/5 border border-gray-100 overflow-hidden">
            <View className="p-4">
                <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center">
                        <View className="w-12 h-12 bg-accent/10 rounded-2xl justify-center items-center mr-3">
                            <Text className="text-2xl">{item.driverAvatar}</Text>
                        </View>
                        <View>
                            <Text className="text-primary text-lg font-bold">
                                {item.driverName}
                            </Text>
                            <Text className="text-secondary text-sm">
                                Completed at {item.completedTime}
                            </Text>
                        </View>
                    </View>

                    <View className="items-end">
                        <Text className="text-primary text-xl font-bold">
                            ₹{item.fare}
                        </Text>
                    </View>
                </View>

                {/* Route */}
                <View className="border-t border-gray-100 pt-3 mt-2">
                    <Text className="text-secondary text-sm mb-1">
                        From: {item.pickupLocation}
                    </Text>
                    <Text className="text-secondary text-sm">
                        To: {item.dropLocation}
                    </Text>
                </View>
            </View>
        </View>
    );

    const renderCancelledTripCard = ({ item }) => (
        <View key={item.id} className="bg-white rounded-2xl mx-4 mb-4 shadow-sm shadow-black/5 border border-gray-100 overflow-hidden">
            <View className="p-4">
                <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center">
                        <View className="w-12 h-12 bg-red-100 rounded-2xl justify-center items-center mr-3">
                            <Text className="text-2xl">{item.driverAvatar}</Text>
                        </View>
                        <View>
                            <Text className="text-primary text-lg font-bold">
                                {item.driverName}
                            </Text>
                            <Text className="text-secondary text-sm">
                                Cancelled at {item.cancelledTime}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Route */}
                <Text className="text-secondary text-sm">
                    From {item.pickupLocation} to {item.dropLocation}
                </Text>
            </View>
        </View>
    );

    const renderContent = () => {
        let currentData = [];
        switch (selectedTab) {
            case 'ongoing': currentData = tripsData.ongoing; break;
            case 'completed': currentData = tripsData.completed; break;
            case 'cancelled': currentData = tripsData.cancelled; break;
        }

        if (currentData.length === 0) {
            return (
                <View className="items-center justify-center p-8 mt-10">
                    <Ionicons name="car-outline" size={64} color="#d1d5db" />
                    <Text className="text-secondary mt-4 text-center">
                        No {selectedTab} trips found.
                    </Text>
                </View>
            );
        }

        return currentData.map(item => {
            switch (selectedTab) {
                case 'ongoing': return renderOngoingTripCard({ item });
                case 'completed': return renderCompletedTripCard({ item });
                case 'cancelled': return renderCancelledTripCard({ item });
                default: return null;
            }
        });
    };

    return (
        <View className="flex-1 bg-gray-50">
            <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />

            {/* Header */}
            <Animated.View
                style={{
                    opacity: fadeAnim,
                    transform: [{ translateY: slideUpAnim }],
                }}
                className="bg-white pt-12 pb-4 px-6 shadow-sm shadow-black/5"
            >
                <View className="flex-row items-center justify-between">
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        className="w-10 h-10 bg-gray-100 rounded-2xl justify-center items-center"
                        activeOpacity={0.7}
                    >
                        <Ionicons name="chevron-back" size={20} color="#1A1B23" />
                    </TouchableOpacity>

                    <View className="flex-1 items-center">
                        <Text className="text-primary text-lg font-semibold">My Trips</Text>
                    </View>

                    <TouchableOpacity
                        onPress={onRefresh}
                        className="w-10 h-10 bg-gray-100 rounded-2xl justify-center items-center"
                        activeOpacity={0.7}
                        disabled={refreshing}
                    >
                        <Animated.View style={{ transform: [{ rotate: spin }] }}>
                            <Ionicons name="refresh" size={20} color="#1A1B23" />
                        </Animated.View>
                    </TouchableOpacity>
                </View>
            </Animated.View>

            {/* Tab Navigation */}
            <Animated.View
                style={{
                    opacity: fadeAnim,
                    transform: [{ translateY: slideUpAnim }],
                }}
                className="bg-white mx-4 mt-6 mb-4 rounded-2xl shadow-sm shadow-black/5 border border-gray-100 overflow-hidden"
            >
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View className="flex-row p-2">
                        {tabs.map((tab) => (
                            <TouchableOpacity
                                key={tab.id}
                                onPress={() => setSelectedTab(tab.id)}
                                className={`flex-row items-center px-4 py-3 rounded-xl mr-2 ${selectedTab === tab.id ? 'bg-accent/10' : 'bg-transparent'
                                    }`}
                                activeOpacity={0.7}
                            >
                                <View
                                    className="w-3 h-3 rounded-full mr-2"
                                    style={{ backgroundColor: tab.color }}
                                />
                                <Text className={`text-sm font-medium ${selectedTab === tab.id ? 'text-accent' : 'text-secondary'
                                    }`}>
                                    {tab.label}
                                </Text>
                                {tab.count > 0 && (
                                    <View className="bg-gray-200 px-2 py-1 rounded-full ml-2">
                                        <Text className="text-xs font-semibold text-secondary">
                                            {tab.count}
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>
            </Animated.View>

            {/* Trips List */}
            <Animated.View
                style={{
                    flex: 1,
                    opacity: fadeAnim,
                    transform: [{ translateY: slideUpAnim }],
                }}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 24 }}
                >
                    {renderContent()}
                </ScrollView>
            </Animated.View>
        </View>
    );
};

export default OwnerTripsScreen;
