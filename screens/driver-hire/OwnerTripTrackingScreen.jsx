import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StatusBar, ActivityIndicator, Alert, Dimensions, Animated, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import '../../global.css';
import { get } from '../../lib/api';
import { endpoints } from '../../config/apiConfig';

const { width, height } = Dimensions.get('window');

const OwnerTripTrackingScreen = ({ navigation, route }) => {
    const { tripId, tripDetails } = route.params || {};
    const [status, setStatus] = useState('OPEN');
    const [driver, setDriver] = useState(null);
    const [location, setLocation] = useState(null);
    const [routeCoordinates, setRouteCoordinates] = useState([]);
    const [eta, setEta] = useState(null); // mins
    const [tripDistance, setTripDistance] = useState(null); // km
    const [errorMsg, setErrorMsg] = useState(null);

    // Refs
    const pollInterval = useRef(null);
    const mapRef = useRef(null);
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const slideUpAnim = useRef(new Animated.Value(300)).current;

    // Initial polling and location setup
    useEffect(() => {
        if (!tripId) {
            navigation.goBack();
            return;
        }

        startPolling();
        startPulse();
        getLocation();

        // Slide up animation on mount
        Animated.spring(slideUpAnim, {
            toValue: 0,
            useNativeDriver: true,
            tension: 20,
            friction: 7
        }).start();

        const unsubscribeFocus = navigation.addListener('focus', () => {
            startPolling();
        });

        const unsubscribeBlur = navigation.addListener('blur', () => {
            stopPolling();
        });

        return () => {
            stopPolling();
            unsubscribeFocus();
            unsubscribeBlur();
        };
    }, [navigation, tripId]);

    const getLocation = async () => {
        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setErrorMsg('Permission to access location was denied');
                Alert.alert('Permission Denied', 'Please enable location services to track your ride.');
                return;
            }

            let currentLocation = await Location.getCurrentPositionAsync({});
            setLocation(currentLocation.coords);

            // Initial map fitting if we have coords
            if (tripDetails?.pickupCoordinates && tripDetails?.dropoffCoordinates) {
                fitMapToCoordinates(currentLocation.coords);
                fetchRoute(tripDetails.pickupCoordinates, tripDetails.dropoffCoordinates);
            }

        } catch (error) {
            console.log("Location Error:", error);
            setErrorMsg('Could not fetch location');
        }
    };

    const fetchRoute = async (pickup, dropoff) => {
        if (!pickup || !dropoff) return;

        try {
            // OSRM Public API (Free)
            const response = await fetch(
                `http://router.project-osrm.org/route/v1/driving/${pickup.lng},${pickup.lat};${dropoff.lng},${dropoff.lat}?overview=full&geometries=geojson`
            );
            const data = await response.json();

            if (data.routes && data.routes.length > 0) {
                const route = data.routes[0];
                const coordinates = route.geometry.coordinates.map(coord => ({
                    latitude: coord[1],
                    longitude: coord[0],
                }));
                setRouteCoordinates(coordinates);

                // ETA & Distance
                const durationMins = Math.round(route.duration / 60);
                const distKm = (route.distance / 1000).toFixed(1);
                setEta(durationMins);
                setTripDistance(distKm);
            }
        } catch (error) {
            console.error("Error fetching OSRM route:", error);
        }
    };

    const fitMapToCoordinates = (userCoords) => {
        if (!mapRef.current) return;

        const markers = [];

        if (userCoords) markers.push({ latitude: userCoords.latitude, longitude: userCoords.longitude });
        if (tripDetails?.pickupCoordinates) markers.push({ latitude: tripDetails.pickupCoordinates.lat, longitude: tripDetails.pickupCoordinates.lng });
        if (tripDetails?.dropoffCoordinates) markers.push({ latitude: tripDetails.dropoffCoordinates.lat, longitude: tripDetails.dropoffCoordinates.lng });

        // Include route points to ensure whole route is visible
        if (routeCoordinates.length > 0) {
            markers.push(routeCoordinates[0]);
            markers.push(routeCoordinates[Math.floor(routeCoordinates.length / 2)]);
            markers.push(routeCoordinates[routeCoordinates.length - 1]);
        }

        if (markers.length > 0) {
            mapRef.current.fitToCoordinates(markers, {
                edgePadding: { top: 100, right: 50, bottom: height / 2, left: 50 },
                animated: true,
            });
        }
    };

    const startPulse = () => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.2,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    };

    const startPolling = () => {
        checkStatus();
        if (pollInterval.current) clearInterval(pollInterval.current);
        pollInterval.current = setInterval(checkStatus, 4000); // Check every 4 seconds
    };

    const stopPolling = () => {
        if (pollInterval.current) {
            clearInterval(pollInterval.current);
            pollInterval.current = null;
        }
    };

    const checkStatus = async () => {
        try {
            const response = await get(endpoints.trips.status(tripId));
            if (response && response.trip) {
                const { status: newStatus, driverId, vehicle, driverLocation } = response.trip;
                setStatus(newStatus);
                if (driverId) {
                    const vehicleData = vehicle || driverId.vehicle || {};
                    setDriver({ ...driverId, vehicle: vehicleData, location: driverLocation });
                }
            }
        } catch (error) {
            console.log('Polling Error:', error);
        }
    };

    const handleCall = () => {
        if (driver?.phone) {
            Alert.alert('Call Driver', `Dialing ${driver.phone}...`);
        } else {
            Alert.alert('Info', 'Number not available');
        }
    };

    // Helper to render map content
    const renderMap = () => {
        const pickupCoords = tripDetails?.pickupCoordinates ? {
            latitude: tripDetails.pickupCoordinates.lat,
            longitude: tripDetails.pickupCoordinates.lng
        } : null;

        const dropoffCoords = tripDetails?.dropoffCoordinates ? {
            latitude: tripDetails.dropoffCoordinates.lat,
            longitude: tripDetails.dropoffCoordinates.lng
        } : null;


        return (
            <View className="absolute top-0 left-0 right-0 bottom-0 bg-gray-100">
                <MapView
                    ref={mapRef}
                    style={{ flex: 1 }}
                    provider={PROVIDER_DEFAULT}
                    showsUserLocation={true}
                    showsMyLocationButton={false}
                    initialRegion={{
                        latitude: pickupCoords?.latitude || location?.latitude || 20.9320,
                        longitude: pickupCoords?.longitude || location?.longitude || 77.7520,
                        latitudeDelta: 0.05,
                        longitudeDelta: 0.05,
                    }}
                >
                    {pickupCoords && (
                        <Marker coordinate={pickupCoords} title="Pickup" description={tripDetails.pickupLocation}>
                            <View className="w-8 h-8 bg-blue-500 rounded-full border-2 border-white justify-center items-center shadow-sm">
                                <Ionicons name="location" size={16} color="white" />
                            </View>
                        </Marker>
                    )}

                    {dropoffCoords && (
                        <Marker coordinate={dropoffCoords} title="Dropoff" description={tripDetails.dropoffLocation}>
                            <View className="w-8 h-8 bg-red-500 rounded-full border-2 border-white justify-center items-center shadow-sm">
                                <Ionicons name="flag" size={16} color="white" />
                            </View>
                        </Marker>
                    )}
                    {/* Route Polyline - OSRM */}
                    {routeCoordinates.length > 0 && (
                        <Polyline
                            coordinates={routeCoordinates}
                            strokeWidth={4}
                            strokeColor="#3B82F6" // blue-500
                        />
                    )}

                    {/* Driver Marker */}
                    {driver?.location?.lat && driver?.location?.lng && (
                        <Marker
                            coordinate={{ latitude: driver.location.lat, longitude: driver.location.lng }}
                            title={driver.full_name || 'Driver'}
                            anchor={{ x: 0.5, y: 0.5 }}
                        >
                            <View
                                className="bg-white p-1 rounded-full shadow-sm border border-green-500"
                                style={{ transform: [{ rotate: `${driver.location.heading || 0}deg` }] }}
                            >
                                <Ionicons name="car-sport" size={20} color="#00C851" />
                            </View>
                        </Marker>
                    )}

                </MapView>
            </View>
        );
    };

    const renderFindingDriver = () => (
        <View className="flex-1">
            {renderMap()}

            <SafeAreaView className="flex-1 justify-between pointer-events-none">
                {/* Pointer events none usually blocks touches, but we want map to be touchable? 
                   Actually SafeAreaView covers specific areas. We wrap controls separately.
                */}

                <View className="px-6 pt-4 pointer-events-auto">
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        className="w-10 h-10 bg-white shadow-md rounded-full justify-center items-center"
                    >
                        <Ionicons name="arrow-back" size={24} color="#000" />
                    </TouchableOpacity>
                </View>

                <Animated.View
                    style={{ transform: [{ translateY: slideUpAnim }] }}
                    className="bg-white rounded-t-3xl shadow-2xl p-6 pb-12"
                >
                    <View className="items-center -mt-16 mb-6">
                        <Animated.View style={{ transform: [{ scale: pulseAnim }] }} className="w-24 h-24 bg-white rounded-full items-center justify-center shadow-lg">
                            <View className="w-20 h-20 bg-blue-500 rounded-full items-center justify-center">
                                <Ionicons name="search" size={40} color="white" />
                            </View>
                        </Animated.View>
                    </View>

                    <Text className="text-2xl font-bold text-center text-gray-800 mb-2">Finding your ride</Text>
                    <Text className="text-gray-500 text-center mb-8 px-8">
                        Connecting you with nearby drivers for a {tripDetails?.vehicleType || 'standard'} ride.
                    </Text>

                    <View className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-100">
                        <View className="flex-row items-center mb-4">
                            <View className="w-8 h-8 bg-blue-100 rounded-full items-center justify-center mr-3">
                                <Ionicons name="location" size={16} color="#3B82F6" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-xs text-gray-500 font-bold uppercase">Pickup</Text>
                                <Text className="font-semibold text-gray-800" numberOfLines={1}>{tripDetails?.pickupLocation}</Text>
                            </View>
                        </View>
                        <View className="flex-row items-center">
                            <View className="w-8 h-8 bg-red-100 rounded-full items-center justify-center mr-3">
                                <Ionicons name="navigate" size={16} color="#EF4444" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-xs text-gray-500 font-bold uppercase">Dropoff</Text>
                                <Text className="font-semibold text-gray-800" numberOfLines={1}>{tripDetails?.dropoffLocation}</Text>
                            </View>
                        </View>
                    </View>

                    <TouchableOpacity className="w-full bg-gray-100 py-4 rounded-xl items-center" onPress={() => navigation.goBack()}>
                        <Text className="font-bold text-gray-500">Cancel Request</Text>
                    </TouchableOpacity>
                </Animated.View>
            </SafeAreaView>
        </View>
    );

    const renderDriverFound = () => {
        const driverName = driver?.full_name || driver?.name || 'Driver';
        const vehicleModel = driver?.vehicle?.model || 'Vehicle';
        const plateNumber = driver?.vehicle?.plateNumber || 'Details pending';

        return (
            <View className="flex-1 bg-gray-100">
                {renderMap()}

                {/* Floating Header */}
                <SafeAreaView className="absolute top-0 w-full z-10">
                    <View className="px-6 pt-4 flex-row justify-between items-center">
                        <TouchableOpacity
                            onPress={() => navigation.goBack()}
                            className="w-10 h-10 bg-white shadow-md rounded-full justify-center items-center"
                        >
                            <Ionicons name="arrow-back" size={24} color="#000" />
                        </TouchableOpacity>
                        <View className="bg-white px-4 py-2 rounded-full shadow-md">
                            <Text className="font-bold text-green-600">
                                {status === 'IN_PROGRESS' ? 'On Trip' : 'Driver Arriving'}
                            </Text>
                        </View>
                    </View>
                </SafeAreaView>

                {/* Floating ETA Badge */}
                {eta && (
                    <SafeAreaView className="absolute top-24 w-full items-center z-10 pointer-events-none">
                        <View className="bg-black/70 px-4 py-2 rounded-full backdrop-blur-md">
                            <Text className="text-white font-bold text-sm">
                                Arriving in {eta} min ({tripDistance} km)
                            </Text>
                        </View>
                    </SafeAreaView>
                )}

                {/* Bottom Sheet */}
                <View className="flex-1 justify-end">
                    <Animated.View
                        style={{ transform: [{ translateY: slideUpAnim }] }}
                        className="bg-white rounded-t-3xl shadow-2xl p-6 pb-10"
                    >
                        {/* Driver Info Header */}
                        <View className="flex-row justify-between items-center mb-6">
                            <View>
                                <Text className="text-gray-500 text-sm font-semibold mb-1">YOUR DRIVER</Text>
                                <Text className="text-2xl font-bold text-gray-800">{driverName}</Text>
                                <View className="flex-row items-center mt-1">
                                    <View className="bg-yellow-100 px-2 py-0.5 rounded flex-row items-center mr-2">
                                        <Ionicons name="star" size={12} color="#D97706" />
                                        <Text className="text-yellow-700 text-xs font-bold ml-1">4.9</Text>
                                    </View>
                                    <Text className="text-gray-400 text-xs">Verified</Text>
                                </View>
                            </View>
                            <View className="w-16 h-16 bg-gray-200 rounded-full overflow-hidden border-2 border-white shadow-md">
                                {/* Avatar Placeholder */}
                                <View className="flex-1 bg-gray-300 justify-center items-center">
                                    <Ionicons name="person" size={32} color="#9CA3AF" />
                                </View>
                            </View>
                        </View>

                        {/* Vehicle Card */}
                        <View className="flex-row items-center bg-gray-50 p-4 rounded-xl border border-gray-100 mb-6">
                            <View className="w-12 h-12 bg-white rounded-lg justify-center items-center shadow-sm mr-4">
                                <Ionicons name="car-sport" size={24} color="#374151" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-lg font-bold text-gray-800">{vehicleModel}</Text>
                                <Text className="text-gray-500 font-medium">{plateNumber}</Text>
                            </View>
                            <View className="bg-gray-200 px-3 py-1 rounded">
                                <Text className="text-xs font-bold text-gray-600">Standard</Text>
                            </View>
                        </View>

                        {/* Actions */}
                        <View className="flex-row space-x-4">
                            <TouchableOpacity
                                onPress={handleCall}
                                className="flex-1 bg-green-500 py-4 rounded-xl flex-row justify-center items-center shadow-green-200 shadow-lg"
                            >
                                <Ionicons name="call" size={20} color="white" />
                                <Text className="font-bold text-white ml-2">Call Driver</Text>
                            </TouchableOpacity>

                            <TouchableOpacity className="w-14 h-14 bg-gray-100 rounded-xl justify-center items-center border border-gray-200">
                                <Ionicons name="shield-checkmark" size={24} color="#4B5563" />
                            </TouchableOpacity>
                        </View>

                    </Animated.View>
                </View>
            </View>
        );
    };

    return (
        <>
            <StatusBar barStyle="dark-content" />
            {(status === 'OPEN') ? renderFindingDriver() : renderDriverFound()}
        </>
    );
};

export default OwnerTripTrackingScreen;
