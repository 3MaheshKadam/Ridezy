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
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import '../../global.css';
import { get } from '../../lib/api';
import { endpoints } from '../../config/apiConfig';

const { width, height } = Dimensions.get('window');

const DriverMatchingScreen = ({ navigation, route }) => {
  const { tripDetails } = route.params || {};

  const [matchingStage, setMatchingStage] = useState('searching'); // searching, drivers_found, driver_assigned
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [assigningDriver, setAssigningDriver] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60); // 60 seconds to choose

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(30)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const modalSlideAnim = useRef(new Animated.Value(height)).current;

  // Mock available drivers
  const availableDrivers = [
    {
      id: '1',
      name: 'Rajesh Kumar',
      avatar: '👨‍💼',
      rating: 4.9,
      reviews: 256,
      experience: '5 years',
      vehicleModel: 'Honda City',
      vehicleNumber: 'MH 27 AB 1234',
      vehicleColor: 'White',
      eta: '3 min',
      distance: '0.8 km',
      fare: tripDetails?.price || 450,
      surgeMultiplier: 1.0,
      features: ['AC', 'Music', 'Phone Charger'],
      languages: ['Hindi', 'English', 'Marathi'],
      completedTrips: 1248,
      acceptanceRate: 95,
    },
    {
      id: '2',
      name: 'Amit Singh',
      avatar: '👨‍🎓',
      rating: 4.8,
      reviews: 189,
      experience: '3 years',
      vehicleModel: 'Toyota Etios',
      vehicleNumber: 'MH 27 CD 5678',
      vehicleColor: 'Silver',
      eta: '5 min',
      distance: '1.2 km',
      fare: (tripDetails?.price || 450) + 20,
      surgeMultiplier: 1.0,
      features: ['AC', 'Music'],
      languages: ['Hindi', 'English'],
      completedTrips: 892,
      acceptanceRate: 92,
    },
    {
      id: '3',
      name: 'Pradeep Sharma',
      avatar: '👨‍🔧',
      rating: 4.7,
      reviews: 324,
      experience: '7 years',
      vehicleModel: 'Maruti Dzire',
      vehicleNumber: 'MH 27 EF 9012',
      vehicleColor: 'Blue',
      eta: '7 min',
      distance: '1.8 km',
      fare: (tripDetails?.price || 450) - 30,
      surgeMultiplier: 1.0,
      features: ['AC', 'Music', 'GPS'],
      languages: ['Hindi', 'Marathi'],
      completedTrips: 1567,
      acceptanceRate: 89,
    },
  ];

  useEffect(() => {
    startAnimations();

    // Start polling if we have a trip ID
    let pollInterval;
    const tripId = route.params?.tripId;

    if (tripId) {
      pollInterval = setInterval(async () => {
        try {
          const response = await get(endpoints.trips.details(tripId));
          const trip = response.trip;

          if (trip && (trip.status === 'ACCEPTED' || trip.status === 'ASSIGNED') && trip.driver) {
            clearInterval(pollInterval);
            setMatchingStage('driver_assigned');
            // Navigate to tracking after a brief delay
            setTimeout(() => {
              navigation.replace('TripTracking', {
                tripId: tripId,
                tripDetails: {
                  ...tripDetails,
                  assignedDriver: trip.driver,
                  status: trip.status
                }
              });
            }, 2000);
          } else if (trip && trip.status === 'CANCELLED') {
            clearInterval(pollInterval);
            Alert.alert('Trip Cancelled', 'This trip has been cancelled.');
            navigation.goBack();
          }
        } catch (error) {
          console.log('Error polling trip status:', error);
        }
      }, 3000); // Poll every 3 seconds
    } else {
      // specific for simple "Find Driver" demo without backend
      simulateDriverMatching();
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
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

    // Pulse animation for searching
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
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

  const simulateDriverMatching = () => {
    // Simulate finding drivers after 3 seconds
    setTimeout(() => {
      setMatchingStage('drivers_found');
    }, 3000);
  };

  const openDriverModal = (driver) => {
    setSelectedDriver(driver);
    setShowDriverModal(true);

    Animated.timing(modalSlideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeDriverModal = () => {
    Animated.timing(modalSlideAnim, {
      toValue: height,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowDriverModal(false);
      setSelectedDriver(null);
    });
  };

  const handleSelectDriver = async (driver) => {
    setAssigningDriver(true);

    try {
      // TODO: Implement driver assignment API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      setMatchingStage('driver_assigned');

      // Navigate to trip tracking after successful assignment
      setTimeout(() => {
        navigation.replace('TripTracking', {
          tripDetails: {
            ...tripDetails,
            // Only pass serializable driver data (no functions)
            assignedDriver: {
              id: driver.id,
              name: driver.name,
              avatar: driver.avatar,
              rating: driver.rating,
              reviews: driver.reviews,
              experience: driver.experience,
              vehicleModel: driver.vehicleModel,
              vehicleNumber: driver.vehicleNumber,
              vehicleColor: driver.vehicleColor,
              eta: driver.eta,
              distance: driver.distance,
              fare: driver.fare,
              features: driver.features,
              languages: driver.languages,
              completedTrips: driver.completedTrips,
              acceptanceRate: driver.acceptanceRate,
              phone: '+91 98765 43210', // Add phone number for calling
            }
          }
        });
      }, 1500);

    } catch (error) {
      Alert.alert('Assignment Failed', 'Please try selecting another driver.');
    } finally {
      setAssigningDriver(false);
      closeDriverModal();
    }
  };

  const autoAssignBestDriver = () => {
    // Auto-assign the highest rated driver
    const bestDriver = availableDrivers.reduce((best, current) =>
      current.rating > best.rating ? current : best
    );
    handleSelectDriver(bestDriver);
  };

  const handleCancelRequest = () => {
    Alert.alert(
      'Cancel Trip Request',
      'Are you sure you want to cancel your trip request?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => navigation.goBack()
        }
      ]
    );
  };

  const formatETA = (eta) => {
    return eta;
  };

  const getSurgeText = (multiplier) => {
    if (multiplier > 1) {
      return `${multiplier}x surge pricing`;
    }
    return 'Normal pricing';
  };

  const renderSearchingState = () => (
    <View className="flex-1 justify-center items-center px-8">
      <Animated.View
        style={{
          transform: [{ scale: pulseAnim }],
        }}
        className="w-32 h-32 bg-accent/10 rounded-full justify-center items-center mb-8"
      >
        <View className="w-24 h-24 bg-accent/20 rounded-full justify-center items-center">
          <Ionicons name="car" size={40} color="#00C851" />
        </View>
      </Animated.View>

      <Text className="text-primary text-2xl font-bold text-center mb-4">
        Finding Drivers Nearby
      </Text>
      <Text className="text-secondary text-base text-center mb-8">
        We have sent your request to drivers near you. Waiting for acceptance...
      </Text>

      <View className="w-full bg-gray-200 h-2 rounded-full mb-4">
        <Animated.View className="h-2 bg-accent rounded-full" style={{ width: '60%' }} />
      </View>

      <Text className="text-secondary text-sm text-center">
        This usually takes 10-30 seconds
      </Text>
    </View>
  );

  const renderDriversFoundState = () => (
    <View className="flex-1">
      {/* Header */}
      <View className="bg-white px-6 py-4 border-b border-gray-200">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-primary text-xl font-bold">
            Available Drivers
          </Text>
          <View className="bg-accent/10 px-3 py-1 rounded-full">
            <Text className="text-accent text-sm font-semibold">
              {timeLeft}s to choose
            </Text>
          </View>
        </View>

        <Text className="text-secondary text-sm">
          Choose your preferred driver or we'll assign the best match automatically
        </Text>
      </View>

      {/* Trip Summary */}
      <View className="bg-blue-50 mx-4 mt-4 rounded-2xl p-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-blue-600 text-sm font-medium">
              {tripDetails?.pickup} → {tripDetails?.dropoff}
            </Text>
            <Text className="text-blue-500 text-xs mt-1">
              {tripDetails?.date?.toLocaleDateString()} • {tripDetails?.time}
            </Text>
          </View>
          <Text className="text-blue-600 text-lg font-bold">
            ₹{tripDetails?.price}
          </Text>
        </View>
      </View>

      {/* Drivers List */}
      <ScrollView className="flex-1 px-4 mt-4" showsVerticalScrollIndicator={false}>
        {availableDrivers.map((driver, index) => (
          <TouchableOpacity
            key={driver.id}
            onPress={() => openDriverModal(driver)}
            className={`bg-white rounded-2xl p-4 mb-4 shadow-sm shadow-black/5 border-2 ${index === 0 ? 'border-accent bg-accent/5' : 'border-gray-200'
              }`}
            activeOpacity={0.8}
          >
            {index === 0 && (
              <View className="absolute -top-2 left-4 bg-accent px-3 py-1 rounded-full">
                <Text className="text-white text-xs font-semibold">
                  Recommended
                </Text>
              </View>
            )}

            <View className="flex-row items-center">
              {/* Driver Avatar */}
              <View className="w-16 h-16 bg-accent/10 rounded-2xl justify-center items-center mr-4">
                <Text className="text-3xl">{driver.avatar}</Text>
              </View>

              {/* Driver Info */}
              <View className="flex-1">
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="text-primary text-lg font-bold">
                    {driver.name}
                  </Text>
                  <Text className="text-primary text-xl font-bold">
                    ₹{driver.fare}
                  </Text>
                </View>

                <View className="flex-row items-center mb-2">
                  <View className="bg-yellow-50 px-2 py-1 rounded-full mr-2">
                    <View className="flex-row items-center">
                      <Ionicons name="star" size={12} color="#F59E0B" />
                      <Text className="text-yellow-600 text-xs font-semibold ml-1">
                        {driver.rating}
                      </Text>
                    </View>
                  </View>
                  <Text className="text-secondary text-sm">
                    {driver.reviews} trips • {driver.experience}
                  </Text>
                </View>

                <View className="flex-row items-center justify-between">
                  <Text className="text-secondary text-sm">
                    {driver.vehicleModel} • {driver.vehicleColor}
                  </Text>
                  <View className="flex-row items-center">
                    <Ionicons name="time" size={14} color="#00C851" />
                    <Text className="text-accent text-sm font-medium ml-1">
                      {formatETA(driver.eta)} away
                    </Text>
                  </View>
                </View>

                {/* Features */}
                <View className="flex-row mt-2">
                  {driver.features.slice(0, 3).map((feature, idx) => (
                    <View key={idx} className="bg-gray-100 px-2 py-1 rounded-full mr-2">
                      <Text className="text-secondary text-xs">
                        {feature}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderDriverAssignedState = () => (
    <View className="flex-1 justify-center items-center px-8">
      <View className="w-32 h-32 bg-green-100 rounded-full justify-center items-center mb-8">
        <Ionicons name="checkmark-circle" size={64} color="#00C851" />
      </View>

      <Text className="text-primary text-2xl font-bold text-center mb-4">
        Driver Assigned!
      </Text>
      <Text className="text-secondary text-base text-center mb-8">
        Your driver is getting ready and will be with you shortly
      </Text>

      <View className="w-full bg-gray-200 h-2 rounded-full">
        <View className="w-full h-2 bg-accent rounded-full" />
      </View>
    </View>
  );

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
            onPress={handleCancelRequest}
            className="w-10 h-10 bg-gray-100 rounded-2xl justify-center items-center"
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={20} color="#1A1B23" />
          </TouchableOpacity>

          <View className="flex-1 items-center">
            <Text className="text-primary text-lg font-semibold">
              {matchingStage === 'searching' ? 'Finding Driver' :
                matchingStage === 'drivers_found' ? 'Choose Driver' :
                  'Driver Assigned'}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => Alert.alert('Help', 'Need assistance with driver matching?')}
            className="w-10 h-10 bg-gray-100 rounded-2xl justify-center items-center"
            activeOpacity={0.7}
          >
            <Ionicons name="help-circle" size={20} color="#1A1B23" />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Content based on matching stage */}
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideUpAnim }],
        }}
        className="flex-1"
      >
        {matchingStage === 'searching' && renderSearchingState()}
        {matchingStage === 'drivers_found' && renderDriversFoundState()}
        {matchingStage === 'driver_assigned' && renderDriverAssignedState()}
      </Animated.View>

      {/* Driver Details Modal */}
      <Modal
        visible={showDriverModal}
        transparent={true}
        animationType="none"
        onRequestClose={closeDriverModal}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <Animated.View
            style={{
              transform: [{ translateY: modalSlideAnim }],
            }}
            className="bg-white rounded-t-3xl p-6 max-h-[90%]"
          >
            {selectedDriver && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View className="items-center mb-6">
                  <View className="w-12 h-1 bg-gray-300 rounded-full mb-4" />
                  <Text className="text-primary text-xl font-bold">
                    Driver Details
                  </Text>
                </View>

                {/* Driver Profile */}
                <View className="items-center mb-6">
                  <View className="w-24 h-24 bg-accent/10 rounded-3xl justify-center items-center mb-4">
                    <Text className="text-5xl">{selectedDriver.avatar}</Text>
                  </View>
                  <Text className="text-primary text-2xl font-bold mb-2">
                    {selectedDriver.name}
                  </Text>
                  <View className="flex-row items-center mb-2">
                    <View className="bg-yellow-50 px-3 py-1 rounded-full mr-2">
                      <View className="flex-row items-center">
                        <Ionicons name="star" size={16} color="#F59E0B" />
                        <Text className="text-yellow-600 text-base font-semibold ml-1">
                          {selectedDriver.rating}
                        </Text>
                      </View>
                    </View>
                    <Text className="text-secondary text-base">
                      {selectedDriver.reviews} trips • {selectedDriver.experience}
                    </Text>
                  </View>
                </View>

                {/* Trip Details */}
                <View className="bg-gray-50 rounded-2xl p-4 mb-6">
                  <Text className="text-primary text-base font-semibold mb-3">
                    Trip Summary
                  </Text>
                  <View className="space-y-2">
                    <View className="flex-row justify-between">
                      <Text className="text-secondary text-sm">Pickup</Text>
                      <Text className="text-primary text-sm font-medium flex-1 text-right">
                        {tripDetails?.pickup}
                      </Text>
                    </View>
                    <View className="flex-row justify-between">
                      <Text className="text-secondary text-sm">Drop-off</Text>
                      <Text className="text-primary text-sm font-medium flex-1 text-right">
                        {tripDetails?.dropoff}
                      </Text>
                    </View>
                    <View className="flex-row justify-between">
                      <Text className="text-secondary text-sm">ETA</Text>
                      <Text className="text-primary text-sm font-medium">
                        {selectedDriver.eta}
                      </Text>
                    </View>
                    <View className="flex-row justify-between">
                      <Text className="text-secondary text-sm">Fare</Text>
                      <Text className="text-primary text-lg font-bold">
                        ₹{selectedDriver.fare}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Vehicle Details */}
                <View className="bg-gray-50 rounded-2xl p-4 mb-6">
                  <Text className="text-primary text-base font-semibold mb-3">
                    Vehicle Details
                  </Text>
                  <View className="space-y-2">
                    <View className="flex-row justify-between">
                      <Text className="text-secondary text-sm">Model</Text>
                      <Text className="text-primary text-sm font-medium">
                        {selectedDriver.vehicleModel}
                      </Text>
                    </View>
                    <View className="flex-row justify-between">
                      <Text className="text-secondary text-sm">Number</Text>
                      <Text className="text-primary text-sm font-medium">
                        {selectedDriver.vehicleNumber}
                      </Text>
                    </View>
                    <View className="flex-row justify-between">
                      <Text className="text-secondary text-sm">Color</Text>
                      <Text className="text-primary text-sm font-medium">
                        {selectedDriver.vehicleColor}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Driver Stats */}
                <View className="bg-gray-50 rounded-2xl p-4 mb-6">
                  <Text className="text-primary text-base font-semibold mb-3">
                    Driver Performance
                  </Text>
                  <View className="flex-row justify-around">
                    <View className="items-center">
                      <Text className="text-primary text-xl font-bold">
                        {selectedDriver.completedTrips}
                      </Text>
                      <Text className="text-secondary text-sm">
                        Total Trips
                      </Text>
                    </View>
                    <View className="items-center">
                      <Text className="text-primary text-xl font-bold">
                        {selectedDriver.acceptanceRate}%
                      </Text>
                      <Text className="text-secondary text-sm">
                        Acceptance
                      </Text>
                    </View>
                    <View className="items-center">
                      <Text className="text-primary text-xl font-bold">
                        {selectedDriver.languages.length}
                      </Text>
                      <Text className="text-secondary text-sm">
                        Languages
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Features */}
                <View className="mb-6">
                  <Text className="text-primary text-base font-semibold mb-3">
                    Vehicle Features
                  </Text>
                  <View className="flex-row flex-wrap">
                    {selectedDriver.features.map((feature, index) => (
                      <View key={index} className="bg-accent/10 px-3 py-2 rounded-full mr-2 mb-2">
                        <Text className="text-accent text-sm font-medium">
                          {feature}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Action Buttons */}
                <View className="flex-row space-x-4">
                  <TouchableOpacity
                    onPress={closeDriverModal}
                    className="flex-1 bg-gray-200 rounded-2xl py-4 justify-center items-center"
                    activeOpacity={0.8}
                  >
                    <Text className="text-primary text-base font-semibold">
                      Cancel
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleSelectDriver(selectedDriver)}
                    disabled={assigningDriver}
                    activeOpacity={0.8}
                    className="flex-1 rounded-2xl overflow-hidden"
                  >
                    <LinearGradient
                      colors={assigningDriver ? ['#cccccc', '#999999'] : ['#00C851', '#00A843']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{
                        borderRadius: 16,
                        paddingVertical: 16,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <View className="flex-row items-center">
                        {assigningDriver ? (
                          <>
                            <View className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            <Text className="text-white text-base font-semibold">
                              Assigning...
                            </Text>
                          </>
                        ) : (
                          <>
                            <Text className="text-white text-base font-semibold mr-2">
                              Select Driver
                            </Text>
                            <Ionicons name="checkmark" size={20} color="#ffffff" />
                          </>
                        )}
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

export default DriverMatchingScreen;