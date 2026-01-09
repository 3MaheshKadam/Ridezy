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
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import '../../global.css';
import { get, post } from '../../lib/api';
import { endpoints } from '../../config/apiConfig';

const { width, height } = Dimensions.get('window');

const DriverRequestFeedScreen = ({ navigation }) => {
    const [requests, setRequests] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [acceptingId, setAcceptingId] = useState(null);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideUpAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        startAnimations();
        fetchRequests();
    }, []);

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

    const fetchRequests = async () => {
        try {
            const response = await get(`${endpoints.trips.feed}`);
            const rawTrips = response.trips || [];

            // Map backend fields to frontend expectations
            const trips = rawTrips.map(t => ({
                id: t._id,
                pickupLocation: t.pickupLocation,
                dropoffLocation: t.dropLocation, // Backend uses dropLocation
                estimatedPrice: t.price,
                date: t.startTime,
                time: new Date(t.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                vehicleType: t.vehicleTypeRequested,
                passengers: t.passengers,
                distance: '5 km' // TODO: Calculate or fetch distance
            }));

            setRequests(trips);
        } catch (error) {
            console.log('Error fetching requests:', error);
            // Mock data removed/commented out for prod
            setRequests([]);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchRequests();
    };

    const handleAccept = async (trip) => {
        Alert.alert(
            'Accept Trip',
            'Are you sure you want to accept this trip request?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Accept',
                    onPress: async () => {
                        setAcceptingId(trip.id);
                        try {
                            // Call API to accept trip
                            // endpoints.trips.accept(id) returns string URL
                            await post(endpoints.trips.accept(trip.id));

                            Alert.alert('Success', 'Trip accepted successfully!', [
                                {
                                    text: 'Go to Trip',
                                    onPress: () => navigation.navigate('TripTracking', { tripId: trip.id, tripDetails: trip })
                                }
                            ]);
                        } catch (error) {
                            Alert.alert('Error', 'Failed to accept trip. It might have been taken by another driver.');
                            fetchRequests(); // Refresh list
                        } finally {
                            setAcceptingId(null);
                        }
                    }
                }
            ]
        );
    };

    const renderRequestCard = (item) => (
        <Animated.View
            key={item.id}
            style={{
                opacity: fadeAnim,
                transform: [{ translateY: slideUpAnim }],
            }}
            className="bg-white rounded-2xl p-5 mb-4 shadow-sm shadow-black/5 mx-4 border border-gray-100"
        >
            {/* Header: Price and Time */}
            <View className="flex-row justify-between items-start mb-4">
                <View>
                    <Text className="text-secondary text-xs font-semibold mb-1">EARNINGS</Text>
                    <Text className="text-primary text-2xl font-bold">₹{item.estimatedPrice}</Text>
                </View>
                <View className="bg-gray-100 px-3 py-1.5 rounded-full">
                    <Text className="text-secondary text-xs font-semibold">
                        {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {item.vehicleType.toUpperCase()}
                    </Text>
                </View>
            </View>

            {/* Locations */}
            <View className="mb-6 relative">
                {/* Connecting Line */}
                <View className="absolute left-[11px] top-6 bottom-6 w-0.5 bg-gray-200 border-l border-dashed border-gray-300" />

                {/* Pickup */}
                <View className="flex-row items-center mb-4">
                    <View className="w-6 h-6 bg-green-100 rounded-full justify-center items-center mr-3 z-10">
                        <View className="w-2.5 h-2.5 bg-green-500 rounded-full" />
                    </View>
                    <View className="flex-1">
                        <Text className="text-secondary text-xs font-medium mb-0.5">PICKUP</Text>
                        <Text className="text-primary text-base font-semibold">{item.pickupLocation}</Text>
                    </View>
                </View>

                {/* Dropoff */}
                <View className="flex-row items-center">
                    <View className="w-6 h-6 bg-red-100 rounded-full justify-center items-center mr-3 z-10">
                        <View className="w-2.5 h-2.5 bg-red-500 rounded-square" />
                    </View>
                    <View className="flex-1">
                        <Text className="text-secondary text-xs font-medium mb-0.5">DROP-OFF</Text>
                        <Text className="text-primary text-base font-semibold">{item.dropoffLocation}</Text>
                    </View>
                </View>
            </View>

            {/* Footer: Stats & Action */}
            <View className="flex-row items-center justify-between pt-4 border-t border-gray-100">
                <View className="flex-row space-x-4">
                    {item.distance && (
                        <View className="flex-row items-center">
                            <Ionicons name="navigate-outline" size={16} color="#6C757D" />
                            <Text className="text-secondary text-xs ml-1 font-medium">{item.distance}</Text>
                        </View>
                    )}
                    <View className="flex-row items-center">
                        <Ionicons name="people-outline" size={16} color="#6C757D" />
                        <Text className="text-secondary text-xs ml-1 font-medium">{item.passengers} pax</Text>
                    </View>
                </View>

                <TouchableOpacity
                    onPress={() => handleAccept(item)}
                    disabled={acceptingId === item.id}
                    className="bg-primary px-6 py-2.5 rounded-xl shadow-sm shadow-primary/30"
                >
                    {acceptingId === item.id ? (
                        <ActivityIndicator color="white" size="small" />
                    ) : (
                        <Text className="text-white font-bold">Accept Request</Text>
                    )}
                </TouchableOpacity>
            </View>
        </Animated.View>
    );

    return (
        <View className="flex-1 bg-gray-50">
            <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />

            {/* Header */}
            <View className="bg-white pt-12 pb-4 px-6 shadow-sm shadow-black/5 z-10">
                <View className="flex-row items-center justify-between">
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        className="w-10 h-10 bg-gray-100 rounded-2xl justify-center items-center"
                    >
                        <Ionicons name="chevron-back" size={20} color="#1A1B23" />
                    </TouchableOpacity>
                    <Text className="text-primary text-lg font-bold">Trip Requests</Text>
                    <View className="w-10" />
                </View>
            </View>

            {/* Content */}
            <ScrollView
                className="flex-1 pt-4"
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {isLoading && !refreshing ? (
                    <View className="mt-20 items-center">
                        <ActivityIndicator size="large" color="#1A1B23" />
                        <Text className="text-secondary mt-4">Finding nearby requests...</Text>
                    </View>
                ) : requests.length === 0 ? (
                    <View className="mt-20 items-center px-6">
                        <View className="w-20 h-20 bg-gray-100 rounded-full justify-center items-center mb-4">
                            <Ionicons name="car-sport-outline" size={40} color="#9CA3AF" />
                        </View>
                        <Text className="text-primary text-lg font-bold mb-2">No Requests Found</Text>
                        <Text className="text-secondary text-center">
                            There are no active trip requests in your area right now. Please check back later.
                        </Text>
                    </View>
                ) : (
                    requests.map(renderRequestCard)
                )}
                <View className="h-20" />
            </ScrollView>
        </View>
    );
};

export default DriverRequestFeedScreen;
