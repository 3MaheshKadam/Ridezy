import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StatusBar,
    TouchableOpacity,
    ScrollView,
    Animated,
    RefreshControl,
    Linking,
    Platform,
    ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import '../../global.css';
import { get } from '../../lib/api';
import { endpoints } from '../../config/apiConfig';

const BookingStatusScreen = ({ navigation, route }) => {
    const { bookingId } = route.params || {};
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        fetchBookingDetails();
        startAnimations();
    }, []);

    const fetchBookingDetails = async () => {
        if (!bookingId) return;
        try {
            const data = await get(endpoints.bookings.status(bookingId));
            if (data) {
                setBooking(data);
            }
        } catch (error) {
            console.error("Failed to fetch booking", error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchBookingDetails();
        setRefreshing(false);
    };

    const startAnimations = () => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
        }).start();
    };

    const handleCallCenter = () => {
        if (booking?.center?.phone) {
            Linking.openURL(`tel:${booking.center.phone}`);
        }
    };

    const handleGetDirections = () => {
        if (booking?.center?.location?.lat && booking?.center?.location?.lng) {
            const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
            const latLng = `${booking.center.location.lat},${booking.center.location.lng}`;
            const label = booking.center.name;
            const url = Platform.select({
                ios: `${scheme}${label}@${latLng}`,
                android: `${scheme}${latLng}(${label})`
            });
            Linking.openURL(url);
        }
    };

    const steps = [
        { id: 'PENDING', title: 'Booking Received', icon: 'document-text' },
        { id: 'CONFIRMED', title: 'Confirmed', icon: 'checkmark-circle' },
        { id: 'IN_PROGRESS', title: 'Washing in Progress', icon: 'water' },
        { id: 'COMPLETED', title: 'Ready for Pickup', icon: 'flag' },
    ];

    const getStepStatus = (stepId, currentStatus) => {
        const statusOrder = ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED'];
        const currentIndex = statusOrder.indexOf(currentStatus);
        const stepIndex = statusOrder.indexOf(stepId);

        if (currentStatus === 'CANCELLED') return 'cancelled';
        if (stepIndex < currentIndex) return 'completed';
        if (stepIndex === currentIndex) return 'current';
        return 'pending';
    };

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-gray-50">
                <ActivityIndicator size="large" color="#3B82F6" />
            </View>
        );
    }

    if (!booking) {
        return (
            <View className="flex-1 justify-center items-center bg-gray-50">
                <Text className="text-gray-500">Booking not found</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} className="mt-4 p-3 bg-blue-100 rounded-lg">
                    <Text className="text-blue-600">Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-gray-50">
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View className="pt-12 px-6 pb-4 bg-white shadow-sm z-10">
                <View className="flex-row items-center justify-between">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 bg-gray-100 rounded-full">
                        <Ionicons name="arrow-back" size={24} color="#1F2937" />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold text-gray-900">Track Booking</Text>
                    <View className="w-10" />
                </View>
            </View>

            <ScrollView
                className="flex-1"
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                <Animated.View style={{ opacity: fadeAnim }} className="p-6">
                    {/* Center Info Card */}
                    <View className="bg-white p-5 rounded-2xl shadow-sm mb-6 border border-gray-100">
                        <Text className="text-gray-500 text-xs font-bold uppercase mb-1">Service Center</Text>
                        <Text className="text-xl font-bold text-gray-900 mb-1">{booking.center.name}</Text>
                        <Text className="text-gray-500 text-sm mb-4">{booking.center.address}</Text>

                        <View className="flex-row space-x-3">
                            <TouchableOpacity onPress={handleCallCenter} className="flex-1 bg-blue-50 py-3 rounded-xl flex-row justify-center items-center">
                                <Ionicons name="call" size={18} color="#3B82F6" />
                                <Text className="ml-2 text-blue-600 font-bold">Call</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleGetDirections} className="flex-1 bg-gray-100 py-3 rounded-xl flex-row justify-center items-center">
                                <Ionicons name="navigate" size={18} color="#4B5563" />
                                <Text className="ml-2 text-gray-700 font-bold">Direction</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Status Timeline */}
                    <View className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
                        <Text className="text-lg font-bold mb-6">Booking Status</Text>

                        {booking.status === 'CANCELLED' ? (
                            <View className="items-center py-4">
                                <Ionicons name="close-circle" size={48} color="#EF4444" />
                                <Text className="text-red-600 font-bold text-lg mt-2">Booking Cancelled</Text>
                            </View>
                        ) : (
                            <View className="pl-2">
                                {steps.map((step, index) => {
                                    const status = getStepStatus(step.id, booking.status);
                                    const isLast = index === steps.length - 1;

                                    let iconColor = '#D1D5DB'; // gray-300
                                    let lineColor = '#E5E7EB'; // gray-200
                                    let textColor = 'text-gray-400';

                                    if (status === 'completed') {
                                        iconColor = '#10B981'; // green-500
                                        lineColor = '#10B981';
                                        textColor = 'text-gray-900';
                                    } else if (status === 'current') {
                                        iconColor = '#3B82F6'; // blue-500
                                        lineColor = '#E5E7EB';
                                        textColor = 'text-blue-600';
                                    }

                                    return (
                                        <View key={step.id} className="flex-row mb-1">
                                            <View className="items-center mr-4">
                                                <View className={`w-8 h-8 rounded-full justify-center items-center border-2 ${status === 'current' ? 'border-blue-500 bg-blue-50' : (status === 'completed' ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-white')}`}>
                                                    <Ionicons name={step.icon} size={16} color={iconColor} />
                                                </View>
                                                {!isLast && (
                                                    <View className="w-0.5 flex-1 my-1" style={{ backgroundColor: lineColor }} />
                                                )}
                                            </View>
                                            <View className="flex-1 pb-8">
                                                <Text className={`font-bold text-base ${textColor}`}>{step.title}</Text>
                                                {status === 'current' && (
                                                    <Text className="text-gray-500 text-sm mt-1">We are currently working on this stage.</Text>
                                                )}
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>
                        )}
                    </View>

                    {/* Booking Details */}
                    <View className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                        <Text className="text-lg font-bold mb-4">Booking Details</Text>

                        <View className="flex-row justify-between mb-3">
                            <Text className="text-gray-500">Vehicle</Text>
                            <Text className="font-semibold">{booking.vehicle?.name} ({booking.vehicle?.number})</Text>
                        </View>
                        <View className="flex-row justify-between mb-3">
                            <Text className="text-gray-500">Service</Text>
                            <Text className="font-semibold">{booking.serviceName || 'Car Wash'}</Text>
                        </View>
                        <View className="flex-row justify-between mb-3">
                            <Text className="text-gray-500">Date & Time</Text>
                            <Text className="font-semibold">{new Date(booking.date || booking.createdAt).toLocaleDateString()} • {booking.time || '10:00 AM'}</Text>
                        </View>
                        <View className="border-t border-gray-100 my-2 pt-2 flex-row justify-between">
                            <Text className="text-gray-900 font-bold">Total Amount</Text>
                            <Text className="text-blue-600 font-bold">₹{booking.price || 0}</Text>
                        </View>
                    </View>
                </Animated.View>
            </ScrollView>
        </View>
    );
};

export default BookingStatusScreen;
