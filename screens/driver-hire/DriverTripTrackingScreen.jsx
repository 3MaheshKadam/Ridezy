import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StatusBar, Alert, ActivityIndicator, Dimensions, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import '../../global.css';
import { post, patch, get } from '../../lib/api';
import { endpoints } from '../../config/apiConfig';
import { calculateDistance, searchLocations } from '../../lib/locationService';

const { width, height } = Dimensions.get('window');

const DriverTripTrackingScreen = ({ navigation, route }) => {
    const { tripId, tripDetails: initialTripDetails } = route.params || {};

    // State
    const [tripDetails, setTripDetails] = useState(initialTripDetails || {});
    const [status, setStatus] = useState(initialTripDetails?.status || 'ACCEPTED');
    const [driverLocation, setDriverLocation] = useState(null);
    const [routeCoordinates, setRouteCoordinates] = useState([]);
    const [eta, setEta] = useState(null); // in minutes
    const [distance, setDistance] = useState(null); // in km
    const [destination, setDestination] = useState(null); // Current target coordinates
    const [isLoading, setIsLoading] = useState(false);
    const [navigationSteps, setNavigationSteps] = useState([]);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);

    // Debug States
    const [routeDebugStatus, setRouteDebugStatus] = useState('Idle');
    const [routeError, setRouteError] = useState(null);

    // Refs
    const mapRef = useRef(null);
    const locationSubscription = useRef(null);
    const lastRouteUpdateLoc = useRef(null); // Throttle OSRM calls
    const lastDestination = useRef(null); // Track dest changes

    useEffect(() => {
        console.log("DriverTripTrackingScreen MOUNTED - Debug Mode Active");
        console.log("Trip ID:", tripId);
        fetchLatestTripDetails();
        startLocationTracking();
        return () => stopLocationTracking();
    }, []);

    const fetchLatestTripDetails = async () => {
        try {
            // Using the status endpoint to get full trip details
            const response = await get(endpoints.trips.status(tripId));
            if (response && response.trip) {
                const t = response.trip;
                // Map DB keys (pickupCoords) to Frontend keys (pickupCoordinates)
                const mappedDetails = {
                    ...t,
                    pickupCoordinates: t.pickupCoords,
                    dropoffCoordinates: t.dropoffCoords,
                    dropoffLocation: t.dropLocation // Map DB 'dropLocation' to Frontend 'dropoffLocation'
                };
                setTripDetails(prev => ({ ...prev, ...mappedDetails }));
                setStatus(t.status);
            }
        } catch (error) {
            console.log("Error fetching trip details:", error);
        }
    };

    // Resolve Destination when status changes or on load
    useEffect(() => {
        ensureCoordinates();
    }, [tripDetails?.pickupLocation, tripDetails?.dropoffLocation]);

    // Set Navigation Target based on status
    useEffect(() => {
        if (!tripDetails) return;

        if (status === 'ACCEPTED') {
            setDestination(tripDetails.pickupCoordinates);
        } else if (status === 'IN_PROGRESS') {
            setDestination(tripDetails.dropoffCoordinates);
        }
    }, [status, tripDetails?.pickupCoordinates, tripDetails?.dropoffCoordinates]);

    // Update route when driver moves or destination changes
    useEffect(() => {
        if (driverLocation && destination) {
            updateRoute();
        }
    }, [driverLocation, destination]);

    const ensureCoordinates = async () => {
        if (!tripDetails) return;

        let updates = {};

        // 1. Check Pickup
        if (!tripDetails.pickupCoordinates && tripDetails.pickupLocation) {
            const results = await searchLocations(tripDetails.pickupLocation);
            if (results.length > 0) {
                updates.pickupCoordinates = { lat: results[0].latitude, lng: results[0].longitude };
            }
        }

        // 2. Check Dropoff (Bias search near pickup or driver location)
        if (!tripDetails.dropoffCoordinates && tripDetails.dropoffLocation) {
            const bias = tripDetails.pickupCoordinates || (driverLocation ? { lat: driverLocation.latitude, lng: driverLocation.longitude } : null);
            const results = await searchLocations(tripDetails.dropoffLocation, bias);

            if (results.length > 0) {
                updates.dropoffCoordinates = { lat: results[0].latitude, lng: results[0].longitude };
            }
        }

        // Apply updates if any
        if (Object.keys(updates).length > 0) {
            setTripDetails(prev => ({ ...prev, ...updates }));
        }
    };

    const startLocationTracking = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Location is required for navigation.');
                return;
            }

            locationSubscription.current = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.High,
                    distanceInterval: 10,
                    timeInterval: 5000,
                },
                (loc) => {
                    const { latitude, longitude, heading } = loc.coords;
                    setDriverLocation({ latitude, longitude, heading });
                    // Send update to backend
                    post(endpoints.drivers.location, { latitude, longitude, heading }).catch(err => console.log('Loc update err', err));
                }
            );

        } catch (error) {
            console.error("Location Error:", error);
        }
    };

    const stopLocationTracking = () => {
        if (locationSubscription.current) {
            locationSubscription.current.remove();
        }
    };

    const updateRoute = async () => {
        if (!driverLocation || !destination) return;

        // Check if destination changed
        const destChanged = !lastDestination.current ||
            lastDestination.current.lat !== destination.lat ||
            lastDestination.current.lng !== destination.lng;

        // Throttling: Check if moved > 50 meters since last update
        // BUT bypass throttling if destination has changed!
        if (lastRouteUpdateLoc.current && !destChanged) {
            const dist = calculateDistance(
                lastRouteUpdateLoc.current.latitude,
                lastRouteUpdateLoc.current.longitude,
                driverLocation.latitude,
                driverLocation.longitude
            );
            if (dist < 0.05) return; // Skip update if moved less than 50m AND dest is same
        }

        const startCoords = { lat: driverLocation.latitude, lng: driverLocation.longitude };
        await fetchOSRMRoute(startCoords, destination);

        lastRouteUpdateLoc.current = driverLocation;
        lastDestination.current = destination;
    };

    const fetchOSRMRoute = async (start, end) => {
        try {
            setRouteDebugStatus('Fetching...');
            setRouteError(null);

            // Request steps=true for turn-by-turn
            const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson&steps=true`;

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status}`);
            }

            const data = await response.json();

            if (data.code !== 'Ok') {
                throw new Error(`OSRM Error: ${data.code}`);
            }

            if (data.routes && data.routes.length > 0) {
                const route = data.routes[0];
                const coords = route.geometry.coordinates.map(c => ({ latitude: c[1], longitude: c[0] }));
                setRouteCoordinates(coords);

                // Parse Steps
                if (route.legs && route.legs.length > 0) {
                    setNavigationSteps(route.legs[0].steps);
                    setCurrentStepIndex(0);
                }

                // Calculate ETA and Distance
                const durationMins = Math.round(route.duration / 60);
                const distanceKm = (route.distance / 1000).toFixed(1);

                setEta(durationMins);
                setDistance(distanceKm);
                setRouteDebugStatus(`Success: ${distanceKm}km`);

                // Fit map to route
                if (mapRef.current) {
                    mapRef.current.fitToCoordinates(coords, {
                        edgePadding: { top: 50, right: 50, bottom: 200, left: 50 },
                        animated: true,
                    });
                }
            } else {
                setRouteDebugStatus('No routes found');
            }
        } catch (error) {
            console.log("OSRM Error", error);
            setRouteDebugStatus('Error');
            setRouteError(error.message);
        }
    };

    const handleStartTrip = async () => {
        Alert.alert(
            "Start Trip?",
            "Confirm that the passenger has boarded.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Start Trip",
                    onPress: async () => {
                        try {
                            setIsLoading(true);
                            await patch(endpoints.trips.status(tripId).replace('/status', ''), { status: 'IN_PROGRESS' });
                            setStatus('IN_PROGRESS');
                            Alert.alert("Trip Started", "Navigation started.");
                        } catch (error) {
                            Alert.alert("Error", "Failed to start trip.");
                            console.error("Start Trip Error:", error);
                        } finally {
                            setIsLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const handleCompleteTrip = async () => {
        Alert.alert(
            "Complete Trip?",
            "Confirm that you have reached the destination.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Complete Trip",
                    onPress: async () => {
                        try {
                            setIsLoading(true);
                            await patch(endpoints.trips.status(tripId).replace('/status', ''), { status: 'COMPLETED' });
                            setStatus('COMPLETED');
                            Alert.alert("Success", "Trip Completed!", [
                                { text: "OK", onPress: () => navigation.navigate('DriverDashboard') }
                            ]);
                        } catch (error) {
                            Alert.alert("Error", "Failed to complete trip.");
                        } finally {
                            setIsLoading(false);
                        }
                    }
                }
            ]
        );
    };

    // Render Helpers
    const getButtonText = () => {
        if (isLoading) return "Updating...";
        // Treat OPEN as ACCEPTED (Start Trip) because we are on the driver app
        if (status === 'ACCEPTED' || status === 'OPEN') return "Start Trip";
        if (status === 'IN_PROGRESS') return "Complete Trip";
        return "Trip Ended";
    };

    const getButtonAction = () => {
        if (status === 'ACCEPTED' || status === 'OPEN') return handleStartTrip;
        if (status === 'IN_PROGRESS') return handleCompleteTrip;
        return () => { };
    };

    const getManeuverIcon = (type, modifier) => {
        if (!type) return "navigate";
        if (type === 'arrive') return "flag";
        if (type === 'depart') return "car";

        // Simple mapping
        if (modifier && modifier.includes('left')) return "arrow-undo";
        if (modifier && modifier.includes('right')) return "arrow-redo";
        if (modifier && modifier.includes('straight')) return "arrow-up";
        if (modifier && modifier.includes('uturn')) return "refresh";

        return "navigate";
    };

    const getStepInstruction = (step) => {
        if (!step) return "Follow route";
        // OSRM usually provides a 'name'
        const road = step.name || "road";
        const maneuver = step.maneuver;

        if (maneuver.type === 'arrive') return "Arrive at destination";
        if (maneuver.type === 'depart') return "Head to " + road;

        const turn = maneuver.modifier ? maneuver.modifier.replace('_', ' ') : 'Turn';
        return `${turn.charAt(0).toUpperCase() + turn.slice(1)} onto ${road}`;
    };

    const getInstructionText = () => {
        if (status === 'ACCEPTED' || status === 'OPEN') return `Pickup at ${tripDetails?.pickupLocation}`;
        if (status === 'IN_PROGRESS') return `Dropoff at ${tripDetails?.dropoffLocation}`;
        return "Trip Completed";
    };

    const getInstructionToDisplay = () => {
        if (navigationSteps.length === 0) return { text: getInstructionText(), distance: 0, icon: 'navigate' };

        // If we have a next step, show THAT action (e.g., "Turn Right")
        // The distance to that action is the distance of the CURRENT step.
        const currentStep = navigationSteps[currentStepIndex];
        const nextStep = navigationSteps[currentStepIndex + 1];

        if (nextStep) {
            return {
                text: getStepInstruction(nextStep),
                distance: currentStep.distance,
                icon: getManeuverIcon(nextStep.maneuver?.type, nextStep.maneuver?.modifier)
            };
        } else if (currentStep) {
            // Final approach
            return {
                text: getStepInstruction(currentStep),
                distance: currentStep.distance,
                icon: getManeuverIcon(currentStep.maneuver?.type, currentStep.maneuver?.modifier)
            };
        }
        return { text: getInstructionText(), distance: 0, icon: 'navigate' };
    };

    const navDisplay = status === 'IN_PROGRESS' ? getInstructionToDisplay() : null;

    return (
        <View className="flex-1 bg-white">
            <StatusBar barStyle="dark-content" />
            <SafeAreaView className="absolute top-0 w-full z-10 pointer-events-none">
                {/* Can add custom header here if needed */}
            </SafeAreaView>

            {/* Map Area */}
            <MapView
                ref={mapRef}
                style={{ flex: 1 }}
                provider={PROVIDER_DEFAULT}
                showsUserLocation={true}
                initialRegion={{
                    latitude: tripDetails?.pickupCoordinates?.lat || 20.9320,
                    longitude: tripDetails?.pickupCoordinates?.lng || 77.7520,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                }}
            >
                {routeCoordinates.length > 0 && (
                    <Polyline coordinates={routeCoordinates} strokeWidth={5} strokeColor="#3B82F6" />
                )}

                {/* Pickup Marker */}
                {tripDetails?.pickupCoordinates && (
                    <Marker
                        coordinate={{ latitude: tripDetails.pickupCoordinates.lat, longitude: tripDetails.pickupCoordinates.lng }}
                        title="Pickup (Owner)"
                        description={tripDetails.pickupLocation}
                        pinColor="green"
                    />
                )}

                {/* Dropoff Marker (Show in Progress) */}
                {(status === 'IN_PROGRESS' || status === 'ACCEPTED') && tripDetails?.dropoffCoordinates && (
                    <Marker
                        coordinate={{ latitude: tripDetails.dropoffCoordinates.lat, longitude: tripDetails.dropoffCoordinates.lng }}
                        title="Dropoff"
                        pinColor="red"
                    />
                )}
            </MapView>

            {/* Back Button Overlay */}
            <SafeAreaView className="absolute top-0 left-0">
                <TouchableOpacity onPress={() => navigation.goBack()} className="m-4 w-10 h-10 bg-white rounded-full justify-center items-center shadow-md">
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
            </SafeAreaView>

            {/* Bottom Control Card */}
            <View className="bg-white rounded-t-3xl shadow-2xl p-6 pb-8 -mt-6">

                {/* ETA Row */}
                <View className="flex-row justify-between mb-4 border-b border-gray-100 pb-4">
                    <View>
                        <Text className="text-gray-500 text-xs font-bold uppercase">EST. TIME</Text>
                        <Text className="text-2xl font-bold text-gray-800">{eta ? `${eta} min` : '--'}</Text>
                    </View>
                    <View className="items-end">
                        <Text className="text-gray-500 text-xs font-bold uppercase">DISTANCE</Text>
                        <Text className="text-2xl font-bold text-gray-800">{distance ? `${distance} km` : '--'}</Text>
                    </View>
                </View>

                {/* Instruction / Navigation */}
                <View className="flex-row items-center mb-6">
                    <View className={`w-12 h-12 rounded-full justify-center items-center mr-3 ${status === 'ACCEPTED' ? 'bg-green-100' : 'bg-blue-100'}`}>
                        {status === 'IN_PROGRESS' && navDisplay ? (
                            <Ionicons
                                name={navDisplay.icon}
                                size={28}
                                color="#2563EB"
                            />
                        ) : (
                            <Ionicons name={status === 'ACCEPTED' ? "location" : "flag"} size={24} color={status === 'ACCEPTED' ? "#00C851" : "#FF4444"} />
                        )}
                    </View>
                    <View className="flex-1">
                        <Text className="text-xs text-gray-400 font-bold uppercase">
                            {status === 'ACCEPTED' ? "HEAD TO PICKUP" : "NEXT TURN"}
                        </Text>
                        <Text className="text-lg font-semibold text-gray-800" numberOfLines={2}>
                            {status === 'IN_PROGRESS' && navDisplay ? navDisplay.text : getInstructionText()}
                        </Text>
                        {status === 'IN_PROGRESS' && navDisplay && (
                            <Text className="text-gray-500 text-sm">
                                {navDisplay.distance < 1000
                                    ? `${Math.round(navDisplay.distance)}m`
                                    : `${(navDisplay.distance / 1000).toFixed(1)} km`}
                            </Text>
                        )}
                    </View>
                </View>

                {/* Action Button */}
                <TouchableOpacity
                    onPress={getButtonAction()}
                    disabled={isLoading}
                    className={`w-full py-4 rounded-xl items-center shadow-lg ${status === 'ACCEPTED' ? 'bg-blue-600' :
                        status === 'IN_PROGRESS' ? 'bg-green-600' : 'bg-gray-400'
                        }`}
                >
                    {isLoading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text className="text-white font-bold text-lg">{getButtonText()}</Text>
                    )}
                </TouchableOpacity>

            </View>
        </View>
    );
};

export default DriverTripTrackingScreen;
