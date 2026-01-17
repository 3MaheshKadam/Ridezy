import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  StatusBar,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import '../../global.css';
import { get } from '../../lib/api';
import { endpoints } from '../../config/apiConfig';
import { useUser } from '../../context/UserContext';

const { width } = Dimensions.get('window');

const TripTrackingScreen = ({ navigation, route }) => {
  const { user } = useUser();
  const { tripId, tripDetails } = route.params || {};

  // If parameters are missing, handle gracefully (e.g., show loading or go back)
  useEffect(() => {
    if (!tripId || !tripDetails) {
      // Optional: Log error or handle it
      console.log("TripTrackingScreen: Missing tripId or tripDetails");
    }
  }, [tripId, tripDetails]);
  const [status, setStatus] = useState('OPEN'); // OPEN, ACCEPTED, IN_PROGRESS, COMPLETED
  const [driver, setDriver] = useState(null);
  const [owner, setOwner] = useState(null);
  const pollInterval = useRef(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(30)).current;

  // Determine role for View logic
  const isDriver = user?.role === 'DRIVER';

  useEffect(() => {
    startAnimations();

    // Start polling when component mounts
    startPolling();

    // Add navigation listeners for focus/blur integration
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
  }, [navigation]);

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

  const startPolling = () => {
    checkStatus();
    // Clear existing to be safe
    if (pollInterval.current) clearInterval(pollInterval.current);
    pollInterval.current = setInterval(checkStatus, 8000); // Poll every 8 seconds
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
        const { status: newStatus, driverId, ownerId, vehicle } = response.trip;
        setStatus(newStatus);

        if (newStatus !== 'OPEN') {
          if (driverId && !isDriver) setDriver({ ...driverId, vehicle });
          if (ownerId && isDriver) setOwner(ownerId);
        }

        if (newStatus === 'COMPLETED' || newStatus === 'CANCELLED') {
          stopPolling();
        }
      }
    } catch (error) {
      console.error('Polling Error:', error);
    }
  };

  const handleCall = () => {
    const phone = isDriver ? owner?.phone : driver?.phone;
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    } else {
      Alert.alert('Info', 'Contact number not available.');
    }
  };

  const handleNavigate = () => {
    // Open Google Maps with pickup coordinates or address
    // Prefer coordinates if available, else address
    const query = tripDetails.pickupCoords ? `${tripDetails.pickupCoords.lat},${tripDetails.pickupCoords.lng}` : tripDetails.pickupLocation || tripDetails.pickup;
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
    Linking.openURL(url);
  };

  const handleCancelTrip = () => {
    Alert.alert('Cancel Trip', 'Are you sure you want to cancel?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel', style: 'destructive', onPress: () => {
          navigation.goBack();
        }
      }
    ]);
  };

  const renderOwnerView = () => {
    if (status === 'OPEN') {
      return (
        <View className="items-center py-8">
          <View className="w-20 h-20 bg-accent/10 rounded-full justify-center items-center mb-4 animate-pulse">
            <Ionicons name="search" size={40} color="#00C851" />
          </View>
          <Text className="text-primary text-xl font-bold mb-2">Finding nearby drivers...</Text>
          <Text className="text-secondary text-base text-center px-8">
            We've sent your request to nearby drivers. This usually takes a few minutes.
          </Text>
        </View>
      );
    }

    if (status === 'ACCEPTED' || status === 'IN_PROGRESS') {
      // Driver data from state (populated from backend)
      const driverName = driver?.full_name || driver?.name || 'Driver';
      const driverPhone = driver?.phone || 'Contact not available';
      const driverRating = driver?.rating || 4.8; // Default if not in populate
      const vehicleName = driver?.vehicle ? `${driver.vehicle.make} ${driver.vehicle.model}` : 'Vehicle details pending';
      const vehicleNumber = driver?.vehicle?.plateNumber || 'MH XX XX XXXX';

      return (
        <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <Text className="text-accent text-lg font-bold mb-4 text-center">
            {status === 'ACCEPTED' ? 'Driver On The Way!' : 'Trip In Progress'}
          </Text>

          <View className="flex-row items-center mb-6">
            <View className="w-16 h-16 bg-gray-200 rounded-full overflow-hidden mr-4">
              <View className="flex-1 justify-center items-center bg-gray-300">
                <Ionicons name="person" size={30} color="#666" />
              </View>
            </View>
            <View className="flex-1">
              <Text className="text-primary text-xl font-bold">{driverName}</Text>
              <View className="flex-row items-center mt-1">
                <Ionicons name="star" size={16} color="#FFD700" />
                <Text className="text-primary text-sm font-semibold ml-1">{driverRating}</Text>
                <Text className="text-secondary text-xs ml-1">• Verified Driver</Text>
              </View>
              <View className="mt-2 bg-gray-50 p-2 rounded-lg">
                <Text className="text-primary font-semibold">{vehicleName}</Text>
                <Text className="text-secondary text-xs">{vehicleNumber}</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={handleCall}
              className="w-12 h-12 bg-accent/10 rounded-full justify-center items-center"
            >
              <Ionicons name="call" size={24} color="#00C851" />
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    return <Text className="text-center text-lg text-secondary">Status: {status}</Text>;
  };

  const renderDriverView = () => {
    return (
      <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
        <Text className="text-primary text-lg font-bold mb-4 text-center">
          {status === 'ACCEPTED' ? 'Navigate to Pickup' : 'Trip In Progress'}
        </Text>

        <View className="flex-row items-center mb-6">
          <View className="w-16 h-16 bg-gray-200 rounded-full overflow-hidden mr-4">
            <View className="flex-1 justify-center items-center bg-gray-300">
              <Ionicons name="person" size={30} color="#666" />
            </View>
          </View>
          <View className="flex-1">
            <Text className="text-primary text-xl font-bold">{owner?.full_name || 'Passenger'}</Text>
            <Text className="text-secondary text-sm mt-1">{owner?.phone || 'Contact Passenger'}</Text>
          </View>
          <TouchableOpacity
            onPress={handleCall}
            className="w-12 h-12 bg-accent/10 rounded-full justify-center items-center"
          >
            <Ionicons name="call" size={24} color="#00C851" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={handleNavigate} className="bg-blue-500 py-3 rounded-xl items-center mb-3">
          <View className="flex-row items-center">
            <Ionicons name="navigate" size={20} color="white" />
            <Text className="text-white font-bold ml-2">Navigate to Pickup</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity className="bg-accent py-3 rounded-xl items-center">
          <Text className="text-white font-bold">Start Trip</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />

      <View className="bg-white pt-12 pb-4 px-6 shadow-sm z-10">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
            <Ionicons name="chevron-back" size={24} color="#1A1B23" />
          </TouchableOpacity>
          <Text className="text-primary text-xl font-bold">
            {isDriver ? 'Current Trip' : 'Trip Status'}
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1 p-6">
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideUpAnim }] }}>

          {isDriver ? renderDriverView() : renderOwnerView()}

          <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mt-4">
            <Text className="text-primary text-lg font-bold mb-4">Trip Details</Text>

            <View className="flex-row items-start mb-4">
              <View className="items-center mr-3 mt-1">
                <View className="w-3 h-3 bg-accent rounded-full" />
                <View className="w-0.5 h-8 bg-gray-200 my-1" />
                <View className="w-3 h-3 bg-red-500 rounded-full" />
              </View>
              <View className="flex-1">
                <View className="mb-4">
                  <Text className="text-secondary text-xs uppercase font-bold mb-1">Pickup</Text>
                  <Text className="text-primary text-base font-medium">{tripDetails.pickupLocation || tripDetails.pickup}</Text>
                </View>
                <View>
                  <Text className="text-secondary text-xs uppercase font-bold mb-1">Drop-off</Text>
                  <Text className="text-primary text-base font-medium">{tripDetails.dropoffLocation || tripDetails.dropoff}</Text>
                </View>
              </View>
            </View>

            <View className="flex-row justify-between border-t border-gray-100 pt-4">
              <View>
                <Text className="text-secondary text-xs">Date & Time</Text>
                <Text className="text-primary font-medium">{new Date(tripDetails.date).toLocaleDateString()} {tripDetails.time}</Text>
              </View>
              <View>
                <Text className="text-secondary text-xs text-right">Estimated Price</Text>
                <Text className="text-primary font-bold text-right text-lg">₹{tripDetails.estimatedPrice || tripDetails.price}</Text>
              </View>
            </View>
          </View>

          {status === 'OPEN' && !isDriver && (
            <TouchableOpacity
              onPress={handleCancelTrip}
              className="mt-8 bg-white border border-red-500 py-4 rounded-xl items-center"
            >
              <Text className="text-red-500 font-bold text-base">Cancel Request</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
};

export default TripTrackingScreen;