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
import { get, post } from '../../lib/api';
import { endpoints } from '../../config/apiConfig';
import '../../global.css';

const { width, height } = Dimensions.get('window');

const BookWashScreen = ({ navigation, route }) => {
  const { center } = route.params || {};

  const [selectedService, setSelectedService] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [vehicleType, setVehicleType] = useState('sedan');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [selectedAddOns, setSelectedAddOns] = useState([]);
  const [userVehicles, setUserVehicles] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(30)).current;
  const modalSlideAnim = useRef(new Animated.Value(height)).current;

  const [services, setServices] = useState([]);
  const [isLoadingServices, setIsLoadingServices] = useState(true);

  // Vehicle types
  const vehicleTypes = [
    { id: 'hatchback', name: 'Hatchback', icon: '🚗', priceMultiplier: 1 },
    { id: 'sedan', name: 'Sedan', icon: '🚙', priceMultiplier: 1.2 },
    { id: 'suv', name: 'SUV', icon: '🚐', priceMultiplier: 1.5 },
    { id: 'luxury', name: 'Luxury Car', icon: '🏎️', priceMultiplier: 2 },
  ];

  // Time slots
  const timeSlots = [
    '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'
  ];

  // Generate next 7 days
  const getNext7Days = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      days.push(date);
    }
    return days;
  };

  useEffect(() => {
    startAnimations();
    fetchUserVehicles();
    if (center?.id || center?._id) {
      fetchCenterServices();
    }
  }, []);

  const fetchCenterServices = async () => {
    try {
      const id = center.id || center._id;
      const data = await get(`${endpoints.centers.services}?centerId=${id}`);
      if (data && Array.isArray(data)) {
        // Map backend service structure to frontend expected structure
        const mappedServices = data.map(s => ({
          id: s._id,
          name: s.name,
          price: s.price,
          duration: `${s.duration} min`,
          // Split description by newlines or commas for bullet points, or use default
          includes: s.description ? s.description.split('\n').filter(i => i.trim()) : ['Exterior Wash', 'Interior Clean'],
          popular: s.category === 'PREMIUM',
          category: s.category
        }));
        setServices(mappedServices);

        // Pre-select first service if available
        if (mappedServices.length > 0) {
          setSelectedService(mappedServices[0].id);
        }
      }
    } catch (error) {
      console.error("Failed to fetch center services", error);
      Alert.alert("Error", "Could not load services for this center.");
    } finally {
      setIsLoadingServices(false);
    }
  };

  const fetchUserVehicles = async () => {
    try {
      const data = await get(endpoints.vehicles.list);
      if (data && data.vehicles) {
        setUserVehicles(data.vehicles);
        // Pre-select first vehicle if available
        if (data.vehicles.length > 0) {
          handleVehicleSelect(data.vehicles[0]);
        }
      }
    } catch (error) {
      console.error("Failed to fetch vehicles", error);
    }
  };

  const handleVehicleSelect = (vehicle) => {
    setSelectedVehicleId(vehicle._id);

    // Auto-select vehicle type if it matches known types
    if (vehicle.type && vehicleTypes.some(v => v.id === vehicle.type.toLowerCase())) {
      setVehicleType(vehicle.type.toLowerCase());
    } else {
      // Default mapping logic or fallback
      // If unknown, maybe don't change type or default to sedan?
      // Let's rely on user to correct it if it's wrong, or basic mapping
    }
  };

  // Placeholder for Add-ons (can be made dynamic later)
  const addOnServices = [
    { id: 'ceramic', name: 'Ceramic Coating', price: 199, duration: '15 min' },
    { id: 'perfume', name: 'Car Perfume', price: 49, duration: '2 min' },
  ];

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

  const calculateTotal = () => {
    if (!selectedService) return 0;

    const service = services.find(s => s.id === selectedService);
    if (!service) return 0;

    const vehicle = vehicleTypes.find(v => v.id === vehicleType);
    const multiplier = vehicle ? vehicle.priceMultiplier : 1;

    const addOnsTotal = selectedAddOns.reduce((total, addonId) => {
      const addon = addOnServices.find(a => a.id === addonId);
      return total + (addon?.price || 0);
    }, 0);

    return Math.round(service.price * multiplier) + addOnsTotal;
  };

  const getTotalDuration = () => {
    if (!selectedService) return 0;

    const service = services.find(s => s.id === selectedService);
    if (!service) return 0;

    const addOnsDuration = selectedAddOns.reduce((total, addonId) => {
      const addon = addOnServices.find(a => a.id === addonId);
      return total + parseInt(addon?.duration || 0);
    }, 0);

    return parseInt(service.duration) + addOnsDuration;
  };

  const handleAddOnToggle = (addonId) => {
    setSelectedAddOns(prev =>
      prev.includes(addonId)
        ? prev.filter(id => id !== addonId)
        : [...prev, addonId]
    );
  };

  const handleBookNow = () => {
    if (!selectedService || !selectedTimeSlot || !selectedVehicleId) {
      Alert.alert('Incomplete Selection', 'Please select a vehicle, service package, and time slot.');
      return;
    }
    setShowPaymentModal(true);

    // Animate modal
    Animated.timing(modalSlideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closePaymentModal = () => {
    Animated.timing(modalSlideAnim, {
      toValue: height,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowPaymentModal(false);
    });
  };

  const handleConfirmBooking = async () => {
    setIsBooking(true);

    try {
      const bookingData = {
        centerId: center.id,
        vehicleId: selectedVehicleId,
        scheduledTime: selectedDate.toISOString(),
        packageType: selectedService,
        price: calculateTotal(),
      };

      const response = await post(endpoints.bookings.create, bookingData);

      closePaymentModal();

      Alert.alert(
        'Booking Confirmed! 🎉',
        `Your car wash is scheduled for ${selectedDate.toLocaleDateString()} at ${selectedTimeSlot}`,
        [
          {
            text: 'Track Status',
            onPress: () => navigation.replace('BookingStatus', { bookingId: response._id || response.id }),
          },
          {
            text: 'Home',
            onPress: () => navigation.navigate('Home'),
            style: 'cancel'
          }
        ]
      );

    } catch (error) {
      console.error('Booking error:', error);
      Alert.alert('Booking Failed', error.message || 'Something went wrong. Please try again.');
    } finally {
      setIsBooking(false);
    }
  };

  const formatDate = (date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
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
            <Text className="text-primary text-lg font-semibold">Book Service</Text>
          </View>

          <TouchableOpacity
            className="w-10 h-10 bg-gray-100 rounded-2xl justify-center items-center"
            activeOpacity={0.7}
          >
            <Ionicons name="heart-outline" size={20} color="#1A1B23" />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Center Info */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideUpAnim }],
          }}
          className="bg-white mx-4 mt-4 rounded-2xl p-4 shadow-sm shadow-black/5 border border-gray-100"
        >
          <View className="flex-row items-center">
            <Text className="text-3xl mr-4">{center?.image || '🚗'}</Text>
            <View className="flex-1">
              <Text className="text-primary text-xl font-bold mb-1">
                {center?.name || 'Premium Auto Spa'}
              </Text>
              <View className="flex-row items-center mb-2">
                <Ionicons name="location-outline" size={14} color="#6C757D" />
                <Text className="text-secondary text-sm ml-1">
                  {center?.address || 'Rajkamal Square, Amravati'}
                </Text>
              </View>
              <View className="flex-row items-center">
                <View className="bg-yellow-50 px-2 py-1 rounded-full mr-2">
                  <View className="flex-row items-center">
                    <Ionicons name="star" size={12} color="#F59E0B" />
                    <Text className="text-yellow-600 text-xs font-semibold ml-1">
                      {center?.rating || '4.8'}
                    </Text>
                  </View>
                </View>
                <Text className="text-secondary text-sm">
                  ({center?.reviews || '156'} reviews)
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* User Vehicles Selection */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideUpAnim }],
          }}
          className="mx-4 mt-6"
        >
          <Text className="text-primary text-lg font-bold mb-4">
            Select Your Vehicle
          </Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row space-x-3">
              <TouchableOpacity
                onPress={() => navigation.navigate('RegisterVehicle')} // Assuming this exists or will exist
                className="bg-white rounded-2xl p-4 border-2 border-dashed border-gray-300 shadow-sm shadow-black/5 items-center justify-center min-w-[120px]"
                activeOpacity={0.8}
              >
                <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mb-2">
                  <Ionicons name="add" size={24} color="#6C757D" />
                </View>
                <Text className="text-primary text-sm font-semibold">
                  Add New
                </Text>
              </TouchableOpacity>

              {userVehicles.map((vehicle) => (
                <TouchableOpacity
                  key={vehicle._id}
                  onPress={() => handleVehicleSelect(vehicle)}
                  className={`bg-white rounded-2xl p-4 border-2 ${selectedVehicleId === vehicle._id
                    ? 'border-accent bg-accent/5'
                    : 'border-gray-200'
                    } shadow-sm shadow-black/5 min-w-[140px]`}
                  activeOpacity={0.8}
                >
                  <Text className="text-2xl mb-2">🚗</Text>
                  <Text className="text-primary text-base font-bold mb-1">
                    {vehicle.plateNumber}
                  </Text>
                  <Text className="text-secondary text-xs">
                    {vehicle.make} {vehicle.model}
                  </Text>
                  {selectedVehicleId === vehicle._id && (
                    <View className="absolute top-2 right-2 w-5 h-5 bg-accent rounded-full items-center justify-center">
                      <Ionicons name="checkmark" size={12} color="white" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </Animated.View>

        {/* Service Packages */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideUpAnim }],
          }}
          className="mx-4 mt-6"
        >
          <Text className="text-primary text-lg font-bold mb-4">
            Choose Service Package
          </Text>

          {isLoadingServices ? (
            <Text className="text-center text-gray-400 py-4">Loading services...</Text>
          ) : services.length === 0 ? (
            <Text className="text-center text-gray-400 py-4">No services available for this center.</Text>
          ) : (
            <View className="space-y-3">
              {services.map((service) => (
                <TouchableOpacity
                  key={service.id}
                  onPress={() => setSelectedService(service.id)}
                  className={`bg-white rounded-2xl p-4 border-2 ${selectedService === service.id
                    ? 'border-accent bg-accent/5'
                    : 'border-gray-200'
                    } shadow-sm shadow-black/5 relative`}
                  activeOpacity={0.8}
                >
                  {service.popular && (
                    <View className="absolute -top-2 left-4 bg-accent px-3 py-1 rounded-full">
                      <Text className="text-white text-xs font-semibold">
                        Most Popular
                      </Text>
                    </View>
                  )}

                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-1">
                      <Text className="text-primary text-lg font-bold mb-1">
                        {service.name}
                      </Text>
                      <Text className="text-secondary text-sm">
                        Duration: {service.duration}
                      </Text>
                    </View>

                    <View className="items-end">
                      <View className="flex-row items-center">
                        <Text className="text-primary text-xl font-bold">
                          ₹{Math.round(service.price * (vehicleTypes.find(v => v.id === vehicleType)?.priceMultiplier || 1))}
                        </Text>
                      </View>

                      <View className={`w-6 h-6 rounded-full border-2 mt-2 ${selectedService === service.id
                        ? 'border-accent bg-accent'
                        : 'border-gray-300'
                        } justify-center items-center`}>
                        {selectedService === service.id && (
                          <Ionicons name="checkmark" size={12} color="#ffffff" />
                        )}
                      </View>
                    </View>
                  </View>

                  {service.includes && service.includes.length > 0 && (
                    <View className="border-t border-gray-100 pt-3">
                      <Text className="text-secondary text-sm font-medium mb-2">
                        What's included:
                      </Text>
                      <View className="flex-row flex-wrap">
                        {service.includes.map((item, index) => (
                          <View key={index} className="flex-row items-center mr-4 mb-1">
                            <Ionicons name="checkmark-circle" size={14} color="#00C851" />
                            <Text className="text-secondary text-xs ml-1">
                              {item}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </Animated.View>

        {/* Vehicle Type Selection */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideUpAnim }],
          }}
          className="mx-4 mt-6"
        >
          <Text className="text-primary text-lg font-bold mb-4">
            Select Vehicle Type
          </Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row space-x-3">
              {vehicleTypes.map((vehicle) => (
                <TouchableOpacity
                  key={vehicle.id}
                  onPress={() => setVehicleType(vehicle.id)}
                  className={`bg-white rounded-2xl p-4 border-2 ${vehicleType === vehicle.id
                    ? 'border-accent bg-accent/5'
                    : 'border-gray-200'
                    } shadow-sm shadow-black/5 items-center min-w-[100px]`}
                  activeOpacity={0.8}
                >
                  <Text className="text-2xl mb-2">{vehicle.icon}</Text>
                  <Text className="text-primary text-sm font-semibold text-center">
                    {vehicle.name}
                  </Text>
                  <Text className="text-secondary text-xs mt-1">
                    +{Math.round((vehicle.priceMultiplier - 1) * 100)}%
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </Animated.View>

        {/* Add-on Services */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideUpAnim }],
          }}
          className="mx-4 mt-6"
        >
          <Text className="text-primary text-lg font-bold mb-4">
            Add-on Services
          </Text>

          <View className="space-y-3">
            {addOnServices.map((addon) => (
              <TouchableOpacity
                key={addon.id}
                onPress={() => handleAddOnToggle(addon.id)}
                className={`bg-white rounded-2xl p-4 border-2 ${selectedAddOns.includes(addon.id)
                  ? 'border-accent bg-accent/5'
                  : 'border-gray-200'
                  } shadow-sm shadow-black/5`}
                activeOpacity={0.8}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-primary text-base font-semibold mb-1">
                      {addon.name}
                    </Text>
                    <Text className="text-secondary text-sm">
                      +{addon.duration} • ₹{addon.price}
                    </Text>
                  </View>

                  <View className={`w-6 h-6 rounded-full border-2 ${selectedAddOns.includes(addon.id)
                    ? 'border-accent bg-accent'
                    : 'border-gray-300'
                    } justify-center items-center`}>
                    {selectedAddOns.includes(addon.id) && (
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
                    } shadow-sm shadow-black/5 items-center min-w-[80px]`}
                  activeOpacity={0.8}
                >
                  <Text className="text-primary text-sm font-semibold mb-1">
                    {formatDate(date)}
                  </Text>
                  <Text className="text-secondary text-xs">
                    {date.getDate()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </Animated.View>

        {/* Time Slot Selection */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideUpAnim }],
          }}
          className="mx-4 mt-6 mb-6"
        >
          <Text className="text-primary text-lg font-bold mb-4">
            Select Time Slot
          </Text>

          <View className="flex-row flex-wrap gap-3">
            {timeSlots.map((time) => (
              <TouchableOpacity
                key={time}
                onPress={() => setSelectedTimeSlot(time)}
                className={`bg-white rounded-xl px-4 py-3 border-2 ${selectedTimeSlot === time
                  ? 'border-accent bg-accent/5'
                  : 'border-gray-200'
                  } shadow-sm shadow-black/5`}
                activeOpacity={0.8}
              >
                <Text className={`text-sm font-medium ${selectedTimeSlot === time ? 'text-accent' : 'text-secondary'
                  }`}>
                  {time}
                </Text>
              </TouchableOpacity>
            ))}
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
              Total Duration: {getTotalDuration()} min
            </Text>
            <View className="flex-row items-center">
              <Text className="text-primary text-2xl font-bold">
                ₹{calculateTotal()}
              </Text>
              <Text className="text-secondary text-sm ml-2">
                (incl. taxes)
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleBookNow}
            activeOpacity={0.8}
            className="rounded-2xl overflow-hidden"
          >
            <LinearGradient
              colors={['#00C851', '#00A843']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                borderRadius: 16,
                paddingVertical: 12,
                paddingHorizontal: 24,
              }}
            >
              <View className="flex-row items-center">
                <Text className="text-white text-lg font-semibold mr-2">
                  Book Now
                </Text>
                <Ionicons name="arrow-forward" size={20} color="#ffffff" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Payment Modal */}
      <Modal
        visible={showPaymentModal}
        transparent={true}
        animationType="none"
        onRequestClose={closePaymentModal}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <Animated.View
            style={{
              transform: [{ translateY: modalSlideAnim }],
            }}
            className="bg-white rounded-t-3xl p-6"
          >
            <View className="items-center mb-6">
              <View className="w-12 h-1 bg-gray-300 rounded-full mb-4" />
              <Text className="text-primary text-xl font-bold">
                Confirm Booking
              </Text>
            </View>

            {/* Booking Summary */}
            <View className="bg-gray-50 rounded-2xl p-4 mb-6">
              <Text className="text-primary text-base font-semibold mb-3">
                Booking Summary
              </Text>

              <View className="space-y-2">
                <View className="flex-row justify-between">
                  <Text className="text-secondary text-sm">Service</Text>
                  <Text className="text-primary text-sm font-medium">
                    {services.find(s => s.id === selectedService)?.name || 'Selected Service'}
                  </Text>
                </View>

                <View className="flex-row justify-between">
                  <Text className="text-secondary text-sm">Date & Time</Text>
                  <Text className="text-primary text-sm font-medium">
                    {selectedDate.toLocaleDateString()} at {selectedTimeSlot}
                  </Text>
                </View>

                <View className="flex-row justify-between">
                  <Text className="text-secondary text-sm">Duration</Text>
                  <Text className="text-primary text-sm font-medium">
                    {getTotalDuration()} minutes
                  </Text>
                </View>

                <View className="border-t border-gray-200 pt-2 mt-2">
                  <View className="flex-row justify-between">
                    <Text className="text-primary text-base font-semibold">Total Amount</Text>
                    <Text className="text-primary text-lg font-bold">
                      ₹{calculateTotal()}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View className="flex-row space-x-4">
              <TouchableOpacity
                onPress={closePaymentModal}
                className="flex-1 bg-gray-200 rounded-2xl py-4 justify-center items-center"
                activeOpacity={0.8}
              >
                <Text className="text-primary text-base font-semibold">
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleConfirmBooking}
                disabled={isBooking}
                activeOpacity={0.8}
                className="flex-1 rounded-2xl overflow-hidden"
              >
                <LinearGradient
                  colors={isBooking ? ['#cccccc', '#999999'] : ['#00C851', '#00A843']}
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
                    {isBooking ? (
                      <>
                        <View className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        <Text className="text-white text-base font-semibold">
                          Booking...
                        </Text>
                      </>
                    ) : (
                      <>
                        <Text className="text-white text-base font-semibold mr-2">
                          Pay & Confirm
                        </Text>
                        <Ionicons name="card" size={20} color="#ffffff" />
                      </>
                    )}
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

export default BookWashScreen;