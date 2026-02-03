import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  StatusBar,
  Alert,
  Modal,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import '../../global.css';
import { post } from '../../lib/api';
import { endpoints } from '../../config/apiConfig';
import { searchLocations, calculateDistance } from '../../lib/locationService';
import * as Location from 'expo-location';

const { width, height } = Dimensions.get('window');


const TripRequestScreen = ({ navigation }) => {
  const [pickupLocation, setPickupLocation] = useState(null); // Changed to object
  const [dropoffLocation, setDropoffLocation] = useState(null); // Changed to object
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('sedan');
  const [tripType, setTripType] = useState('oneway');
  const [passengerCount, setPassengerCount] = useState(1);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationInputType, setLocationInputType] = useState('pickup');
  const [estimatedPrice, setEstimatedPrice] = useState(0);
  const [searchingDrivers, setSearchingDrivers] = useState(false);

  // New state for search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(30)).current;
  const modalSlideAnim = useRef(new Animated.Value(height)).current;
  const searchTimeout = useRef(null);

  // Vehicle options
  const vehicleOptions = [
    {
      id: 'hatchback',
      name: 'Hatchback',
      icon: '🚗',
      capacity: '4 seats',
      pricePerKm: 12,
      features: ['AC', 'Music System'],
    },
    {
      id: 'sedan',
      name: 'Sedan',
      icon: '🚙',
      capacity: '4 seats',
      pricePerKm: 15,
      features: ['AC', 'Music System', 'Premium Interior'],
      popular: true,
    },
    {
      id: 'suv',
      name: 'SUV',
      icon: '🚐',
      capacity: '7 seats',
      pricePerKm: 20,
      features: ['AC', 'Music System', 'Spacious', 'Luggage Space'],
    },
    {
      id: 'luxury',
      name: 'Luxury',
      icon: '🏎️',
      capacity: '4 seats',
      pricePerKm: 35,
      features: ['Premium AC', 'Leather Seats', 'Wi-Fi', 'Chauffeur'],
    },
  ];

  // Popular locations (Static fallback)
  const popularLocations = [
    { id: '1', name: 'Amravati Airport', address: 'Belora, Amravati', latitude: 20.8320, longitude: 77.7380, icon: 'airplane' },
    { id: '2', name: 'Amravati Railway Station', address: 'Station Road, Amravati', latitude: 20.9330, longitude: 77.7554, icon: 'train' },
    { id: '3', name: 'Rajkamal Square', address: 'Rajkamal Chowk, Amravati', latitude: 20.9320, longitude: 77.7520, icon: 'business' },
  ];

  // Time slots for scheduled rides
  const timeSlots = [
    'Now', '30 min', '1 hour', '2 hours',
    '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'
  ];

  useEffect(() => {
    startAnimations();
  }, []);

  useEffect(() => {
    calculateEstimatedPrice();
  }, [pickupLocation, dropoffLocation, selectedVehicle, tripType]);

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

  const calculateEstimatedPrice = () => {
    if (!pickupLocation || !dropoffLocation) {
      setEstimatedPrice(0);
      return;
    }

    // Real distance calculation
    const distance = calculateDistance(
      pickupLocation.latitude,
      pickupLocation.longitude,
      dropoffLocation.latitude,
      dropoffLocation.longitude
    );

    // Minimum 2km charge
    const chargeableDistance = Math.max(distance, 2);

    const vehicle = vehicleOptions.find(v => v.id === selectedVehicle);
    const basePrice = chargeableDistance * vehicle.pricePerKm;
    const multiplier = tripType === 'roundtrip' ? 1.8 : 1;

    // Minimum fare logic (e.g., base fare ₹50)
    const total = Math.max(50, Math.round(basePrice * multiplier));

    setEstimatedPrice(total);
  };

  const openLocationModal = (type) => {
    setLocationInputType(type);
    setSearchQuery('');
    setSearchResults([]);
    setShowLocationModal(true);

    Animated.timing(modalSlideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeLocationModal = () => {
    Animated.timing(modalSlideAnim, {
      toValue: height,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowLocationModal(false);
    });
  };

  const handleSearch = (text) => {
    setSearchQuery(text);

    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (text.length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        // Use Pickup Location as bias if available, otherwise undefined
        const bias = pickupLocation ? { lat: pickupLocation.latitude, lng: pickupLocation.longitude } : null;
        const results = await searchLocations(text, bias);
        setSearchResults(results);
      } catch (error) {
        console.error("Search failed", error);
      } finally {
        setIsSearching(false);
      }
    }, 500); // 500ms debounce
  };

  const selectLocation = (location) => {
    const locationData = {
      name: location.name,
      address: location.address,
      latitude: location.latitude,
      longitude: location.longitude
    };

    if (locationInputType === 'pickup') {
      setPickupLocation(locationData);
    } else {
      setDropoffLocation(locationData);
    }
    closeLocationModal();
  };

  const swapLocations = () => {
    const temp = pickupLocation;
    setPickupLocation(dropoffLocation);
    setDropoffLocation(temp);
  };

  const getCurrentLocation = async () => {
    try {
      setIsSearching(true);

      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Allow location access to use this feature.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() }
          ]
        );
        setIsSearching(false);
        return;
      }

      // High accuracy for better results
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = location.coords;

      // Reverse Geocode
      const addressResponse = await Location.reverseGeocodeAsync({ latitude, longitude });

      if (addressResponse.length > 0) {
        const addr = addressResponse[0];
        const formattedAddress = `${addr.name || ''} ${addr.street || ''}, ${addr.city || ''}`.trim();

        // Fallback name if nothing specific found
        const name = addr.name || addr.street || addr.district || "Current Location";

        const locationData = {
          name: name,
          address: formattedAddress || `Lat: ${latitude.toFixed(4)}, Long: ${longitude.toFixed(4)}`, // Fallback address
          latitude,
          longitude
        };

        selectLocation(locationData);
      } else {
        // Fallback if reverse geocoding returns empty
        const locationData = {
          name: "Current Location",
          address: `Lat: ${latitude.toFixed(4)}, Long: ${longitude.toFixed(4)}`,
          latitude,
          longitude
        };
        selectLocation(locationData);
      }
    } catch (error) {
      console.log("Error getting location", error);
      Alert.alert("Location Error", "Could not fetch your current location. Please ensure GPS is enabled.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleFindDriver = async () => {
    if (!pickupLocation || !dropoffLocation) {
      Alert.alert('Missing Information', 'Please select both pickup and drop-off locations.');
      return;
    }

    if (!selectedTime) {
      Alert.alert('Missing Information', 'Please select a time for your trip.');
      return;
    }

    setSearchingDrivers(true);

    try {
      const tripData = {
        pickupLocation: pickupLocation.name, // Sending string for compatibility
        pickupAddress: pickupLocation.address, // Adding detailed address
        pickupCoordinates: {
          lat: pickupLocation.latitude,
          lng: pickupLocation.longitude
        },
        dropoffLocation: dropoffLocation.name,
        dropoffAddress: dropoffLocation.address,
        dropoffCoordinates: {
          lat: dropoffLocation.latitude,
          lng: dropoffLocation.longitude
        },
        date: selectedDate.toISOString(),
        time: selectedTime,
        vehicleType: selectedVehicle,
        tripType,
        passengers: passengerCount,
        specialInstructions,
        estimatedPrice
      };

      console.log('Sending Trip Request (POST):', tripData);
      const response = await post(endpoints.trips.create, tripData);
      console.log('Trip Request Response:', response);

      if (response && response.trip) {
        // Navigate to tracking screen
        navigation.navigate('OwnerTripTracking', {
          tripId: response.trip._id,
          tripDetails: tripData
        });
      } else {
        throw new Error('Invalid server response');
      }

    } catch (error) {
      console.error('Find Driver Error:', error);
      Alert.alert('Error', 'Failed to request trip. Please try again.');
    } finally {
      setSearchingDrivers(false);
    }
  };

  const formatDate = (date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const getNext7Days = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      days.push(date);
    }
    return days;
  };

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />

      {/* Custom Header */}
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
            <Text className="text-primary text-lg font-semibold">Hire Driver</Text>
          </View>

          <TouchableOpacity
            className="w-10 h-10 bg-gray-100 rounded-2xl justify-center items-center"
            activeOpacity={0.7}
          >
            <Ionicons name="bookmark-outline" size={20} color="#1A1B23" />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Location Selection */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideUpAnim }],
          }}
          className="bg-white mx-4 mt-4 rounded-2xl p-4 shadow-sm shadow-black/5 border border-gray-100"
        >
          <Text className="text-primary text-lg font-bold mb-4">
            Where to?
          </Text>

          {/* Pickup Location */}
          <TouchableOpacity
            onPress={() => openLocationModal('pickup')}
            className="bg-gray-50 rounded-2xl p-4 mb-3 border-2 border-gray-100"
            activeOpacity={0.7}
          >
            <View className="flex-row items-center">
              <View className="w-3 h-3 bg-accent rounded-full mr-3" />
              <View className="flex-1">
                <Text className="text-secondary text-xs font-medium mb-1">
                  PICKUP LOCATION
                </Text>
                <Text className="text-primary text-base font-medium" numberOfLines={1}>
                  {pickupLocation ? pickupLocation.name : 'Select pickup location'}
                </Text>
                {pickupLocation && (
                  <Text className="text-secondary text-xs mt-1" numberOfLines={1}>
                    {pickupLocation.address}
                  </Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={20} color="#6C757D" />
            </View>
          </TouchableOpacity>

          {/* Swap Button */}
          <View className="items-center mb-3">
            <TouchableOpacity
              onPress={swapLocations}
              className="w-10 h-10 bg-accent/10 rounded-full justify-center items-center"
              activeOpacity={0.7}
            >
              <Ionicons name="swap-vertical" size={20} color="#00C851" />
            </TouchableOpacity>
          </View>

          {/* Dropoff Location */}
          <TouchableOpacity
            onPress={() => openLocationModal('dropoff')}
            className="bg-gray-50 rounded-2xl p-4 border-2 border-gray-100"
            activeOpacity={0.7}
          >
            <View className="flex-row items-center">
              <View className="w-3 h-3 bg-red-500 rounded-full mr-3" />
              <View className="flex-1">
                <Text className="text-secondary text-xs font-medium mb-1">
                  DROP-OFF LOCATION
                </Text>
                <Text className="text-primary text-base font-medium" numberOfLines={1}>
                  {dropoffLocation ? dropoffLocation.name : 'Select drop-off location'}
                </Text>
                {dropoffLocation && (
                  <Text className="text-secondary text-xs mt-1" numberOfLines={1}>
                    {dropoffLocation.address}
                  </Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={20} color="#6C757D" />
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Trip Type */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideUpAnim }],
          }}
          className="mx-4 mt-6"
        >
          <Text className="text-primary text-lg font-bold mb-4">
            Trip Type
          </Text>

          <View className="flex-row space-x-4">
            <TouchableOpacity
              onPress={() => setTripType('oneway')}
              className={`flex-1 bg-white rounded-2xl p-4 border-2 ${tripType === 'oneway' ? 'border-accent bg-accent/5' : 'border-gray-200'
                } shadow-sm shadow-black/5`}
              activeOpacity={0.8}
            >
              <View className="items-center">
                <Ionicons
                  name="arrow-forward"
                  size={24}
                  color={tripType === 'oneway' ? '#00C851' : '#6C757D'}
                />
                <Text className={`text-sm font-semibold mt-2 ${tripType === 'oneway' ? 'text-accent' : 'text-secondary'
                  }`}>
                  One Way
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setTripType('roundtrip')}
              className={`flex-1 bg-white rounded-2xl p-4 border-2 ${tripType === 'roundtrip' ? 'border-accent bg-accent/5' : 'border-gray-200'
                } shadow-sm shadow-black/5`}
              activeOpacity={0.8}
            >
              <View className="items-center">
                <MaterialIcons
                  name="compare-arrows"
                  size={24}
                  color={tripType === 'roundtrip' ? '#00C851' : '#6C757D'}
                />
                <Text className={`text-sm font-semibold mt-2 ${tripType === 'roundtrip' ? 'text-accent' : 'text-secondary'
                  }`}>
                  Round Trip
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Vehicle Selection */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideUpAnim }],
          }}
          className="mx-4 mt-6"
        >
          <Text className="text-primary text-lg font-bold mb-4">
            Choose Vehicle
          </Text>

          <View className="space-y-3">
            {vehicleOptions.map((vehicle) => (
              <TouchableOpacity
                key={vehicle.id}
                onPress={() => setSelectedVehicle(vehicle.id)}
                className={`bg-white rounded-2xl p-4 border-2 ${selectedVehicle === vehicle.id
                  ? 'border-accent bg-accent/5'
                  : 'border-gray-200'
                  } shadow-sm shadow-black/5 relative`}
                activeOpacity={0.8}
              >
                {vehicle.popular && (
                  <View className="absolute -top-2 left-4 bg-accent px-3 py-1 rounded-full">
                    <Text className="text-white text-xs font-semibold">
                      Popular
                    </Text>
                  </View>
                )}

                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    <Text className="text-3xl mr-4">{vehicle.icon}</Text>
                    <View className="flex-1">
                      <Text className="text-primary text-lg font-bold mb-1">
                        {vehicle.name}
                      </Text>
                      <Text className="text-secondary text-sm mb-2">
                        {vehicle.capacity} • ₹{vehicle.pricePerKm}/km
                      </Text>
                      <View className="flex-row flex-wrap">
                        {vehicle.features.map((feature, index) => (
                          <View key={index} className="bg-gray-100 px-2 py-1 rounded-full mr-2 mb-1">
                            <Text className="text-secondary text-xs">
                              {feature}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>

                  <View className={`w-6 h-6 rounded-full border-2 ${selectedVehicle === vehicle.id
                    ? 'border-accent bg-accent'
                    : 'border-gray-300'
                    } justify-center items-center`}>
                    {selectedVehicle === vehicle.id && (
                      <Ionicons name="checkmark" size={12} color="#ffffff" />
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Date Selection */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideUpAnim }],
          }}
          className="mx-4 mt-6"
        >
          <Text className="text-primary text-lg font-bold mb-4">
            Select Date
          </Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row space-x-3">
              {getNext7Days().map((date, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => setSelectedDate(date)}
                  className={`bg-white rounded-2xl p-4 border-2 ${selectedDate.toDateString() === date.toDateString()
                    ? 'border-accent bg-accent/5'
                    : 'border-gray-200'
                    } shadow-sm shadow-black/5 items-center min-w-[100px]`}
                  activeOpacity={0.8}
                >
                  <Text className="text-primary text-sm font-semibold mb-1">
                    {formatDate(date)}
                  </Text>
                  <Text className="text-secondary text-xs">
                    {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </Animated.View>

        {/* Time Selection */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideUpAnim }],
          }}
          className="mx-4 mt-6"
        >
          <Text className="text-primary text-lg font-bold mb-4">
            Select Time
          </Text>

          <View className="flex-row flex-wrap gap-3">
            {timeSlots.map((time) => (
              <TouchableOpacity
                key={time}
                onPress={() => setSelectedTime(time)}
                className={`bg-white rounded-xl px-4 py-3 border-2 ${selectedTime === time
                  ? 'border-accent bg-accent/5'
                  : 'border-gray-200'
                  } shadow-sm shadow-black/5`}
                activeOpacity={0.8}
              >
                <Text className={`text-sm font-medium ${selectedTime === time ? 'text-accent' : 'text-secondary'
                  }`}>
                  {time}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Passenger Count */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideUpAnim }],
          }}
          className="mx-4 mt-6"
        >
          <Text className="text-primary text-lg font-bold mb-4">
            Number of Passengers
          </Text>

          <View className="bg-white rounded-2xl p-4 shadow-sm shadow-black/5 border border-gray-100">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Ionicons name="person" size={20} color="#00C851" />
                <Text className="text-primary text-base font-medium ml-2">
                  Passengers
                </Text>
              </View>

              <View className="flex-row items-center">
                <TouchableOpacity
                  onPress={() => setPassengerCount(Math.max(1, passengerCount - 1))}
                  className="w-8 h-8 bg-gray-100 rounded-full justify-center items-center"
                  activeOpacity={0.7}
                >
                  <Ionicons name="remove" size={16} color="#1A1B23" />
                </TouchableOpacity>

                <Text className="text-primary text-lg font-semibold mx-4">
                  {passengerCount}
                </Text>

                <TouchableOpacity
                  onPress={() => setPassengerCount(Math.min(7, passengerCount + 1))}
                  className="w-8 h-8 bg-accent/10 rounded-full justify-center items-center"
                  activeOpacity={0.7}
                >
                  <Ionicons name="add" size={16} color="#00C851" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Special Instructions */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideUpAnim }],
          }}
          className="mx-4 mt-6 mb-6"
        >
          <Text className="text-primary text-lg font-bold mb-4">
            Special Instructions (Optional)
          </Text>

          <View className="bg-white rounded-2xl p-4 shadow-sm shadow-black/5 border border-gray-100">
            <TextInput
              value={specialInstructions}
              onChangeText={setSpecialInstructions}
              placeholder="Any special requirements or notes..."
              placeholderTextColor="#6C757D"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              className="text-primary text-base"
            />
          </View>
        </Animated.View>
      </ScrollView>

      {/* Bottom Booking Bar */}
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideUpAnim }],
        }}
        className="bg-white border-t border-gray-200 px-6 py-4"
      >
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-secondary text-sm">
              Estimated Price
            </Text>
            <View className="flex-row items-center">
              <Text className="text-primary text-2xl font-bold">
                ₹{estimatedPrice}
              </Text>
              {tripType === 'roundtrip' && (
                <View className="bg-accent/10 px-2 py-1 rounded-full ml-2">
                  <Text className="text-accent text-xs font-semibold">
                    Round Trip
                  </Text>
                </View>
              )}
            </View>
          </View>

          <TouchableOpacity
            onPress={handleFindDriver}
            disabled={searchingDrivers}
            activeOpacity={0.8}
            className="rounded-2xl overflow-hidden"
          >
            <LinearGradient
              colors={searchingDrivers ? ['#cccccc', '#999999'] : ['#00C851', '#00A843']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                borderRadius: 16,
                paddingVertical: 12,
                paddingHorizontal: 24,
              }}
            >
              <View className="flex-row items-center">
                {searchingDrivers ? (
                  <>
                    <View className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    <Text className="text-white text-lg font-semibold">
                      Finding...
                    </Text>
                  </>
                ) : (
                  <>
                    <Text className="text-white text-lg font-semibold mr-2">
                      Find Driver
                    </Text>
                    <Ionicons name="search" size={20} color="#ffffff" />
                  </>
                )}
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Location Selection Modal */}
      <Modal
        visible={showLocationModal}
        transparent={true}
        animationType="none"
        onRequestClose={closeLocationModal}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <Animated.View
            style={{
              transform: [{ translateY: modalSlideAnim }],
            }}
            className="bg-white rounded-t-3xl p-6 h-[85%]" // Increased height
          >
            <View className="items-center mb-6">
              <View className="w-12 h-1 bg-gray-300 rounded-full mb-4" />
              <Text className="text-primary text-xl font-bold">
                {locationInputType === 'pickup' ? 'Select Pickup Location' : 'Select Drop-off Location'}
              </Text>
            </View>

            {/* Search Input */}
            <View className="bg-gray-50 rounded-2xl p-4 mb-4 flex-row items-center border border-gray-100">
              <Ionicons name="search" size={20} color="#6C757D" />
              <TextInput
                placeholder="Search city, area or street..."
                placeholderTextColor="#6C757D"
                className="flex-1 ml-3 text-primary text-base"
                value={searchQuery}
                onChangeText={handleSearch}
                autoFocus
              />
              {isSearching && <View className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />}
            </View>

            {/* Current Location Button */}
            <TouchableOpacity
              onPress={getCurrentLocation}
              className="flex-row items-center p-4 bg-blue-50 rounded-xl mb-4 border border-blue-100"
            >
              <View className="w-10 h-10 bg-blue-100 rounded-full justify-center items-center mr-3">
                <Ionicons name="navigate" size={20} color="#3B82F6" />
              </View>
              <View>
                <Text className="text-blue-600 font-bold text-base">Use Current Location</Text>
                <Text className="text-blue-400 text-xs">Tap to set precise location</Text>
              </View>
            </TouchableOpacity>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Search Results */}
              {searchResults.length > 0 ? (
                <View className="mb-6">
                  <Text className="text-secondary text-sm font-semibold mb-2 uppercase tracking-wider">
                    Search Results
                  </Text>
                  {searchResults.map((location) => (
                    <TouchableOpacity
                      key={location.id}
                      onPress={() => selectLocation(location)}
                      className="flex-row items-center p-4 border-b border-gray-100"
                      activeOpacity={0.7}
                    >
                      <View className="w-10 h-10 bg-accent/10 rounded-full justify-center items-center mr-3">
                        <Ionicons name="location" size={18} color="#00C851" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-primary text-base font-medium mb-1">
                          {location.name}
                        </Text>
                        <Text className="text-secondary text-sm">
                          {location.address}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#6C757D" />
                    </TouchableOpacity>
                  ))}
                </View>
              ) : searchQuery.length > 0 && !isSearching ? (
                <View className="p-8 items-center">
                  <Text className="text-secondary">No locations found</Text>
                </View>
              ) : null}

              {/* Popular Locations (Only show if no search query) */}
              {searchQuery.length === 0 && (
                <View>
                  <Text className="text-primary text-base font-semibold mb-4">
                    Popular Destinations
                  </Text>

                  {popularLocations.map((location) => (
                    <TouchableOpacity
                      key={location.id}
                      onPress={() => selectLocation(location)}
                      className="flex-row items-center p-4 border-b border-gray-100"
                      activeOpacity={0.7}
                    >
                      <View className="w-10 h-10 bg-accent/10 rounded-full justify-center items-center mr-3">
                        <Ionicons name={location.icon} size={18} color="#00C851" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-primary text-base font-medium mb-1">
                          {location.name}
                        </Text>
                        <Text className="text-secondary text-sm">
                          {location.address}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#6C757D" />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

export default TripRequestScreen;