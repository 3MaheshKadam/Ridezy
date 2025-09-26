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
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import '../../global.css';

const { width, height } = Dimensions.get('window');

const TripTrackingScreen = ({ navigation, route }) => {
  const { tripDetails } = route.params || {};
  
  const [tripStatus, setTripStatus] = useState('driver_assigned'); // driver_assigned, driver_arriving, trip_started, trip_completed
  const [driverLocation, setDriverLocation] = useState({ latitude: 20.9334, longitude: 77.7756 });
  const [estimatedArrival, setEstimatedArrival] = useState('5 min');
  const [showDriverDetails, setShowDriverDetails] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [tripRating, setTripRating] = useState(0);
  const [feedback, setFeedback] = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(30)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const modalSlideAnim = useRef(new Animated.Value(height)).current;

  // Mock driver data
  const driverData = {
    name: 'Rajesh Kumar',
    photo: '👨‍💼',
    rating: 4.8,
    reviews: 142,
    phone: '+91 98765 43210',
    vehicleNumber: 'MH 27 AB 1234',
    vehicleName: 'Honda City',
    vehicleColor: 'White',
    experience: '5 years',
    completedTrips: 1248,
  };

  const statusConfig = {
    driver_assigned: {
      title: 'Driver Assigned',
      subtitle: 'Your driver is getting ready',
      color: '#00C851',
      icon: 'checkmark-circle',
    },
    driver_arriving: {
      title: 'Driver Arriving',
      subtitle: `Arriving in ${estimatedArrival}`,
      color: '#F59E0B',
      icon: 'car',
    },
    trip_started: {
      title: 'Trip in Progress',
      subtitle: 'Enjoy your ride!',
      color: '#00C851',
      icon: 'navigate',
    },
    trip_completed: {
      title: 'Trip Completed',
      subtitle: 'You have reached your destination',
      color: '#00C851',
      icon: 'flag',
    },
  };

  useEffect(() => {
    startAnimations();
    simulateTripProgress();
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

    // Start pulse animation for tracking indicator
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

  const simulateTripProgress = () => {
    // Simulate trip status changes
    const statusSequence = ['driver_assigned', 'driver_arriving', 'trip_started', 'trip_completed'];
    let currentIndex = 0;

    const interval = setInterval(() => {
      currentIndex++;
      if (currentIndex < statusSequence.length) {
        setTripStatus(statusSequence[currentIndex]);
        
        if (statusSequence[currentIndex] === 'trip_completed') {
          clearInterval(interval);
          setTimeout(() => {
            setShowPaymentModal(true);
            openPaymentModal();
          }, 2000);
        }
      }
    }, 10000); // Change status every 10 seconds

    return () => clearInterval(interval);
  };

  const openDriverDetails = () => {
    setShowDriverDetails(true);
    Animated.timing(modalSlideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeDriverDetails = () => {
    Animated.timing(modalSlideAnim, {
      toValue: height,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowDriverDetails(false);
    });
  };

  const openPaymentModal = () => {
    setShowPaymentModal(true);
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

  const handleCallDriver = () => {
    Linking.openURL(`tel:${driverData.phone}`);
  };

  const handleMessageDriver = () => {
    Alert.alert('Message Driver', 'Messaging feature will be implemented soon.');
  };

  const handleCancelTrip = () => {
    Alert.alert(
      'Cancel Trip',
      'Are you sure you want to cancel this trip? Cancellation charges may apply.',
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

  const handleRating = (rating) => {
    setTripRating(rating);
  };

  const handleSubmitFeedback = () => {
    // TODO: Submit rating and feedback to API
    closePaymentModal();
    
    Alert.alert(
      'Thank You!',
      'Your feedback has been submitted successfully.',
      [
        {
          text: 'Book Another Trip',
          onPress: () => navigation.navigate('TripRequest'),
        },
        {
          text: 'Go Home',
          onPress: () => navigation.navigate('Home'),
        },
      ]
    );
  };

  const currentStatus = statusConfig[tripStatus];

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
            <Text className="text-primary text-lg font-semibold">Track Trip</Text>
          </View>
          
          <TouchableOpacity
            onPress={() => Alert.alert('Support', 'Emergency support: +91 1234567890')}
            className="w-10 h-10 bg-red-100 rounded-2xl justify-center items-center"
            activeOpacity={0.7}
          >
            <Ionicons name="shield-checkmark" size={20} color="#dc2626" />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Map Placeholder */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideUpAnim }],
            height: height * 0.35 
          }}
          className="bg-white m-4 rounded-2xl shadow-sm shadow-black/5 border border-gray-100 justify-center items-center"
        >
          <View className="items-center">
            <Animated.View
              style={{
                transform: [{ scale: pulseAnim }],
              }}
              className="w-20 h-20 bg-accent/10 rounded-full justify-center items-center mb-4"
            >
              <Ionicons name="location" size={40} color="#00C851" />
            </Animated.View>
            <Text className="text-primary text-lg font-semibold mb-2">
              Live Tracking
            </Text>
            <Text className="text-secondary text-sm text-center">
              Real-time map with driver location{'\n'}will be implemented here
            </Text>
          </View>
        </Animated.View>

        {/* Trip Status */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideUpAnim }],
          }}
          className="mx-4 mb-4"
        >
          <View className="rounded-2xl overflow-hidden">
            <LinearGradient
              colors={[currentStatus.color, currentStatus.color + '80']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                borderRadius: 16,
                padding: 20,
              }}
            >
              <View className="flex-row items-center">
                <View className="w-12 h-12 bg-white/20 rounded-full justify-center items-center mr-4">
                  <Ionicons name={currentStatus.icon} size={24} color="#ffffff" />
                </View>
                <View className="flex-1">
                  <Text className="text-white text-xl font-bold mb-1">
                    {currentStatus.title}
                  </Text>
                  <Text className="text-white/80 text-sm">
                    {currentStatus.subtitle}
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        </Animated.View>

        {/* Driver Information */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideUpAnim }],
          }}
          className="bg-white mx-4 rounded-2xl p-4 shadow-sm shadow-black/5 border border-gray-100 mb-4"
        >
          <TouchableOpacity
            onPress={openDriverDetails}
            activeOpacity={0.8}
            className="flex-row items-center"
          >
            <View className="w-16 h-16 bg-accent/10 rounded-2xl justify-center items-center mr-4">
              <Text className="text-3xl">{driverData.photo}</Text>
            </View>
            
            <View className="flex-1">
              <Text className="text-primary text-lg font-bold mb-1">
                {driverData.name}
              </Text>
              <View className="flex-row items-center mb-1">
                <View className="bg-yellow-50 px-2 py-1 rounded-full mr-2">
                  <View className="flex-row items-center">
                    <Ionicons name="star" size={12} color="#F59E0B" />
                    <Text className="text-yellow-600 text-xs font-semibold ml-1">
                      {driverData.rating}
                    </Text>
                  </View>
                </View>
                <Text className="text-secondary text-sm">
                  ({driverData.reviews} rides)
                </Text>
              </View>
              <Text className="text-secondary text-sm">
                {driverData.vehicleName} • {driverData.vehicleNumber}
              </Text>
            </View>
            
            <Ionicons name="chevron-forward" size={20} color="#6C757D" />
          </TouchableOpacity>

          {/* Action Buttons */}
          <View className="flex-row mt-4 space-x-3">
            <TouchableOpacity
              onPress={handleCallDriver}
              className="flex-1 bg-accent/10 rounded-2xl py-3 flex-row justify-center items-center"
              activeOpacity={0.8}
            >
              <Ionicons name="call" size={18} color="#00C851" />
              <Text className="text-accent text-sm font-semibold ml-2">
                Call
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={handleMessageDriver}
              className="flex-1 bg-primary/10 rounded-2xl py-3 flex-row justify-center items-center"
              activeOpacity={0.8}
            >
              <Ionicons name="chatbubble" size={18} color="#1A1B23" />
              <Text className="text-primary text-sm font-semibold ml-2">
                Message
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Trip Details */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideUpAnim }],
          }}
          className="bg-white mx-4 rounded-2xl p-4 shadow-sm shadow-black/5 border border-gray-100 mb-4"
        >
          <Text className="text-primary text-lg font-bold mb-4">
            Trip Details
          </Text>
          
          <View className="space-y-4">
            {/* Pickup Location */}
            <View className="flex-row items-center">
              <View className="w-3 h-3 bg-accent rounded-full mr-3" />
              <View className="flex-1">
                <Text className="text-secondary text-xs font-medium mb-1">
                  PICKUP
                </Text>
                <Text className="text-primary text-sm font-medium">
                  {tripDetails?.pickup || 'Rajkamal Square, Amravati'}
                </Text>
              </View>
            </View>

            {/* Route Line */}
            <View className="ml-1.5 w-0.5 h-6 bg-gray-300" />

            {/* Dropoff Location */}
            <View className="flex-row items-center">
              <View className="w-3 h-3 bg-red-500 rounded-full mr-3" />
              <View className="flex-1">
                <Text className="text-secondary text-xs font-medium mb-1">
                  DROP-OFF
                </Text>
                <Text className="text-primary text-sm font-medium">
                  {tripDetails?.dropoff || 'Amravati Airport'}
                </Text>
              </View>
            </View>
          </View>

          {/* Trip Info */}
          <View className="border-t border-gray-100 mt-4 pt-4">
            <View className="flex-row justify-between items-center">
              <View>
                <Text className="text-secondary text-xs font-medium mb-1">
                  DATE & TIME
                </Text>
                <Text className="text-primary text-sm font-medium">
                  {tripDetails?.date?.toLocaleDateString()} • {tripDetails?.time}
                </Text>
              </View>
              
              <View className="items-end">
                <Text className="text-secondary text-xs font-medium mb-1">
                  FARE
                </Text>
                <Text className="text-primary text-lg font-bold">
                  ₹{tripDetails?.price || 450}
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Cancel Trip Button (only show if trip not completed) */}
        {tripStatus !== 'trip_completed' && (
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideUpAnim }],
            }}
            className="mx-4 mb-6"
          >
            <TouchableOpacity
              onPress={handleCancelTrip}
              className="bg-white rounded-2xl py-4 border border-red-200 shadow-sm shadow-black/5"
              activeOpacity={0.8}
            >
              <View className="flex-row justify-center items-center">
                <Ionicons name="close-circle-outline" size={20} color="#dc2626" />
                <Text className="text-red-600 text-base font-semibold ml-2">
                  Cancel Trip
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        )}
      </ScrollView>

      {/* Driver Details Modal */}
      <Modal
        visible={showDriverDetails}
        transparent={true}
        animationType="none"
        onRequestClose={closeDriverDetails}
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
                Driver Details
              </Text>
            </View>

            {/* Driver Profile */}
            <View className="items-center mb-6">
              <View className="w-24 h-24 bg-accent/10 rounded-3xl justify-center items-center mb-4">
                <Text className="text-5xl">{driverData.photo}</Text>
              </View>
              <Text className="text-primary text-2xl font-bold mb-2">
                {driverData.name}
              </Text>
              <View className="flex-row items-center mb-2">
                <View className="bg-yellow-50 px-3 py-1 rounded-full mr-2">
                  <View className="flex-row items-center">
                    <Ionicons name="star" size={14} color="#F59E0B" />
                    <Text className="text-yellow-600 text-sm font-semibold ml-1">
                      {driverData.rating}
                    </Text>
                  </View>
                </View>
                <Text className="text-secondary text-sm">
                  {driverData.reviews} rides completed
                </Text>
              </View>
            </View>

            {/* Driver Stats */}
            <View className="flex-row justify-around mb-6">
              <View className="items-center">
                <Text className="text-primary text-xl font-bold">
                  {driverData.experience}
                </Text>
                <Text className="text-secondary text-sm">
                  Experience
                </Text>
              </View>
              <View className="items-center">
                <Text className="text-primary text-xl font-bold">
                  {driverData.completedTrips}
                </Text>
                <Text className="text-secondary text-sm">
                  Total Rides
                </Text>
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
                    {driverData.vehicleName}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-secondary text-sm">Number</Text>
                  <Text className="text-primary text-sm font-medium">
                    {driverData.vehicleNumber}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-secondary text-sm">Color</Text>
                  <Text className="text-primary text-sm font-medium">
                    {driverData.vehicleColor}
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              onPress={closeDriverDetails}
              className="bg-gray-200 rounded-2xl py-4 justify-center items-center"
              activeOpacity={0.8}
            >
              <Text className="text-primary text-base font-semibold">
                Close
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

      {/* Payment & Rating Modal */}
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
                Rate Your Trip
              </Text>
            </View>

            {/* Trip Summary */}
            <View className="bg-gray-50 rounded-2xl p-4 mb-6">
              <View className="flex-row justify-between items-center">
                <Text className="text-primary text-base font-semibold">
                  Total Fare
                </Text>
                <Text className="text-primary text-2xl font-bold">
                  ₹{tripDetails?.price || 450}
                </Text>
              </View>
            </View>

            {/* Rating Stars */}
            <View className="items-center mb-6">
              <Text className="text-primary text-base font-semibold mb-4">
                How was your ride?
              </Text>
              <View className="flex-row space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => handleRating(star)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={star <= tripRating ? "star" : "star-outline"}
                      size={32}
                      color={star <= tripRating ? "#F59E0B" : "#D1D5DB"}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Feedback Input */}
            <View className="bg-gray-50 rounded-2xl p-4 mb-6">
              <Text className="text-primary text-sm font-semibold mb-2">
                Additional Feedback (Optional)
              </Text>
              <TextInput
                value={feedback}
                onChangeText={setFeedback}
                placeholder="Share your experience..."
                placeholderTextColor="#6C757D"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                className="text-primary text-base"
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleSubmitFeedback}
              activeOpacity={0.8}
              className="rounded-2xl overflow-hidden"
            >
              <LinearGradient
                colors={['#00C851', '#00A843']}
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
                  <Text className="text-white text-lg font-semibold mr-2">
                    Submit & Pay
                  </Text>
                  <Ionicons name="checkmark" size={20} color="#ffffff" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

export default TripTrackingScreen;