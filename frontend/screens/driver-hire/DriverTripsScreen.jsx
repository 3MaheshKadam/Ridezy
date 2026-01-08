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
  FlatList,
  RefreshControl,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import '../../global.css';

const { width, height } = Dimensions.get('window');

const DriverTripsScreen = ({ navigation }) => {
  const [selectedTab, setSelectedTab] = useState('available');
  const [isOnline, setIsOnline] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [todayStats, setTodayStats] = useState({
    totalEarnings: 1250,
    completedTrips: 8,
    totalDistance: 147,
    totalHours: 6.5,
    rating: 4.8,
    acceptanceRate: 92,
  });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(30)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Mock trips data
  const tripsData = {
    available: [
      {
        id: '1',
        customerName: 'Rajesh Kumar',
        customerAvatar: '👨',
        customerRating: 4.7,
        pickupLocation: 'Rajkamal Square, Amravati',
        dropoffLocation: 'Amravati Airport',
        distance: 18.5,
        estimatedTime: 35,
        fare: 450,
        tripType: 'oneway',
        requestTime: '2 min ago',
        paymentMethod: 'Cash',
        specialInstructions: 'Airport pickup, please be on time',
      },
      {
        id: '2',
        customerName: 'Priya Patel',
        customerAvatar: '👩',
        customerRating: 4.9,
        pickupLocation: 'Camp Area, Amravati',
        dropoffLocation: 'Railway Station',
        distance: 8.2,
        estimatedTime: 20,
        fare: 200,
        tripType: 'oneway',
        requestTime: '5 min ago',
        paymentMethod: 'UPI',
        specialInstructions: '',
      },
      {
        id: '3',
        customerName: 'Amit Sharma',
        customerAvatar: '👨‍💼',
        customerRating: 4.6,
        pickupLocation: 'Badnera Road',
        dropoffLocation: 'Medical College',
        distance: 12.3,
        estimatedTime: 25,
        fare: 320,
        tripType: 'roundtrip',
        requestTime: '7 min ago',
        paymentMethod: 'Card',
        specialInstructions: 'Round trip, wait time 30 minutes',
      },
    ],
    ongoing: [
      {
        id: '4',
        customerName: 'Sneha Desai',
        customerAvatar: '👩‍💻',
        customerPhone: '+91 98765 43210',
        pickupLocation: 'Hotel Rajkamal',
        dropoffLocation: 'SGBAU University',
        distance: 15.2,
        estimatedTime: 30,
        fare: 380,
        tripType: 'oneway',
        startTime: '2:15 PM',
        progress: 65,
        currentLocation: 'Near Kathora Chowk',
        paymentMethod: 'UPI',
      },
    ],
    completed: [
      {
        id: '5',
        customerName: 'Vikash Singh',
        customerAvatar: '👨‍🎓',
        pickupLocation: 'Central Mall',
        dropoffLocation: 'Shegaon Road',
        distance: 22.1,
        fare: 520,
        tripType: 'oneway',
        completedTime: '1:45 PM',
        duration: 42,
        customerRating: 5,
        tip: 50,
        paymentMethod: 'Cash',
      },
      {
        id: '6',
        customerName: 'Anjali Mehta',
        customerAvatar: '👩‍🔬',
        pickupLocation: 'Collectorate',
        dropoffLocation: 'Rajapeth',
        distance: 6.8,
        fare: 180,
        tripType: 'oneway',
        completedTime: '11:20 AM',
        duration: 18,
        customerRating: 4,
        tip: 0,
        paymentMethod: 'UPI',
      },
      {
        id: '7',
        customerName: 'Rohan Joshi',
        customerAvatar: '👨‍⚕️',
        pickupLocation: 'Bus Stand',
        dropoffLocation: 'Chandur Railway',
        distance: 35.4,
        fare: 680,
        tripType: 'oneway',
        completedTime: '9:30 AM',
        duration: 55,
        customerRating: 5,
        tip: 20,
        paymentMethod: 'Card',
      },
    ],
    cancelled: [
      {
        id: '8',
        customerName: 'Manish Gupta',
        customerAvatar: '👨‍🏫',
        pickupLocation: 'Cotton Market',
        dropoffLocation: 'Dharampeth',
        fare: 290,
        cancelledTime: '10:15 AM',
        cancellationReason: 'Customer cancelled',
        cancellationFee: 25,
      },
    ],
  };

  const tabs = [
    { id: 'available', label: 'Available', count: tripsData.available.length, color: '#00C851' },
    { id: 'ongoing', label: 'Ongoing', count: tripsData.ongoing.length, color: '#3B82F6' },
    { id: 'completed', label: 'Completed', count: tripsData.completed.length, color: '#00C851' },
    { id: 'cancelled', label: 'Cancelled', count: tripsData.cancelled.length, color: '#dc2626' },
  ];

  useEffect(() => {
    startAnimations();
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

    // Pulse animation for online indicator
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

  const onRefresh = async () => {
    setRefreshing(true);
    // TODO: Refresh trips data from API
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleTripAction = (action, trip) => {
    switch (action) {
      case 'accept':
        Alert.alert(
          'Accept Trip',
          `Accept trip to ${trip.dropoffLocation}?`,
          [
            { text: 'Decline', style: 'cancel' },
            { 
              text: 'Accept', 
              onPress: () => {
                // TODO: Accept trip API call
                navigation.navigate('TripTracking', { tripDetails: trip });
              }
            }
          ]
        );
        break;
      case 'decline':
        Alert.alert(
          'Decline Trip',
          'Are you sure you want to decline this trip?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Decline', style: 'destructive', onPress: () => updateTripStatus(trip.id, 'declined') }
          ]
        );
        break;
      case 'navigate':
        // TODO: Open navigation app
        Alert.alert('Navigation', `Opening navigation to ${trip.dropoffLocation}`);
        break;
      case 'call':
        // TODO: Call customer
        Alert.alert('Call Customer', `Calling ${trip.customerName}`);
        break;
      case 'complete':
        Alert.alert(
          'Complete Trip',
          'Mark this trip as completed?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Complete', onPress: () => updateTripStatus(trip.id, 'completed') }
          ]
        );
        break;
    }
  };

  const updateTripStatus = (tripId, newStatus) => {
    // TODO: Update trip status via API
    Alert.alert('Success', `Trip ${newStatus} successfully!`);
  };

  const toggleOnlineStatus = () => {
    setIsOnline(!isOnline);
    Alert.alert(
      isOnline ? 'Going Offline' : 'Going Online',
      isOnline ? 'You will stop receiving trip requests' : 'You will start receiving trip requests'
    );
  };

  const formatTime = (timeString) => {
    return timeString;
  };

  const renderAvailableTripCard = ({ item }) => (
    <View className="bg-white rounded-2xl mx-4 mb-4 shadow-sm shadow-black/5 border border-gray-100 overflow-hidden">
      {/* Header */}
      <View className="p-4">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center">
            <View className="w-12 h-12 bg-accent/10 rounded-2xl justify-center items-center mr-3">
              <Text className="text-2xl">{item.customerAvatar}</Text>
            </View>
            <View>
              <Text className="text-primary text-lg font-bold">
                {item.customerName}
              </Text>
              <View className="flex-row items-center">
                <Ionicons name="star" size={14} color="#F59E0B" />
                <Text className="text-secondary text-sm ml-1">
                  {item.customerRating} • {item.paymentMethod}
                </Text>
              </View>
            </View>
          </View>
          
          <View className="items-end">
            <Text className="text-primary text-2xl font-bold">
              ₹{item.fare}
            </Text>
            <Text className="text-secondary text-xs">
              {item.requestTime}
            </Text>
          </View>
        </View>

        {/* Trip Details */}
        <View className="space-y-3 mb-4">
          {/* Pickup */}
          <View className="flex-row items-center">
            <View className="w-3 h-3 bg-accent rounded-full mr-3" />
            <Text className="text-primary text-sm font-medium flex-1">
              {item.pickupLocation}
            </Text>
          </View>

          {/* Route Line */}
          <View className="ml-1.5 w-0.5 h-4 bg-gray-300" />

          {/* Dropoff */}
          <View className="flex-row items-center">
            <View className="w-3 h-3 bg-red-500 rounded-full mr-3" />
            <Text className="text-primary text-sm font-medium flex-1">
              {item.dropoffLocation}
            </Text>
          </View>
        </View>

        {/* Trip Info */}
        <View className="flex-row justify-between items-center mb-4">
          <View className="flex-row items-center">
            <Ionicons name="location" size={16} color="#6C757D" />
            <Text className="text-secondary text-sm ml-1">
              {item.distance} km
            </Text>
          </View>
          
          <View className="flex-row items-center">
            <Ionicons name="time" size={16} color="#6C757D" />
            <Text className="text-secondary text-sm ml-1">
              ~{item.estimatedTime} min
            </Text>
          </View>
          
          {item.tripType === 'roundtrip' && (
            <View className="bg-blue-100 px-2 py-1 rounded-full">
              <Text className="text-blue-600 text-xs font-semibold">
                Round Trip
              </Text>
            </View>
          )}
        </View>

        {/* Special Instructions */}
        {item.specialInstructions && (
          <View className="bg-blue-50 rounded-xl p-3 mb-4">
            <View className="flex-row items-start">
              <Ionicons name="information-circle" size={16} color="#3B82F6" />
              <Text className="text-blue-600 text-sm ml-2 flex-1">
                {item.specialInstructions}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View className="bg-gray-50 px-4 py-3 flex-row justify-between">
        <TouchableOpacity
          onPress={() => handleTripAction('decline', item)}
          className="flex-1 bg-red-100 rounded-xl py-3 mr-2 justify-center items-center"
          activeOpacity={0.8}
        >
          <Text className="text-red-600 text-base font-semibold">
            Decline
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => handleTripAction('accept', item)}
          className="flex-1 rounded-xl overflow-hidden ml-2"
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#00C851', '#00A843']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              borderRadius: 12,
              paddingVertical: 12,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text className="text-white text-base font-semibold">
              Accept
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderOngoingTripCard = ({ item }) => (
    <View className="bg-white rounded-2xl mx-4 mb-4 shadow-sm shadow-black/5 border border-gray-100 overflow-hidden">
      <View className="p-4">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center">
            <View className="w-12 h-12 bg-accent/10 rounded-2xl justify-center items-center mr-3">
              <Text className="text-2xl">{item.customerAvatar}</Text>
            </View>
            <View>
              <Text className="text-primary text-lg font-bold">
                {item.customerName}
              </Text>
              <Text className="text-secondary text-sm">
                Started at {item.startTime}
              </Text>
            </View>
          </View>
          
          <Text className="text-primary text-2xl font-bold">
            ₹{item.fare}
          </Text>
        </View>

        {/* Progress */}
        <View className="mb-4">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-secondary text-sm">Progress</Text>
            <Text className="text-primary text-sm font-medium">
              {item.progress}% Complete
            </Text>
          </View>
          <View className="bg-gray-200 h-2 rounded-full">
            <View 
              className="bg-accent h-2 rounded-full"
              style={{ width: `${item.progress}%` }}
            />
          </View>
        </View>

        {/* Current Location */}
        <View className="bg-blue-50 rounded-xl p-3 mb-4">
          <View className="flex-row items-center">
            <Ionicons name="location" size={16} color="#3B82F6" />
            <Text className="text-blue-600 text-sm ml-2">
              Current: {item.currentLocation}
            </Text>
          </View>
        </View>

        {/* Destination */}
        <View className="flex-row items-center mb-4">
          <View className="w-3 h-3 bg-red-500 rounded-full mr-3" />
          <Text className="text-primary text-base font-medium">
            To: {item.dropoffLocation}
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View className="bg-gray-50 px-4 py-3 flex-row space-x-3">
        <TouchableOpacity
          onPress={() => handleTripAction('call', item)}
          className="flex-1 bg-blue-100 rounded-xl py-3 justify-center items-center"
          activeOpacity={0.8}
        >
          <Text className="text-blue-600 text-base font-semibold">
            Call
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => handleTripAction('navigate', item)}
          className="flex-1 bg-accent/10 rounded-xl py-3 justify-center items-center"
          activeOpacity={0.8}
        >
          <Text className="text-accent text-base font-semibold">
            Navigate
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => handleTripAction('complete', item)}
          className="flex-1 rounded-xl overflow-hidden"
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#00C851', '#00A843']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              borderRadius: 12,
              paddingVertical: 12,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text className="text-white text-base font-semibold">
              Complete
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCompletedTripCard = ({ item }) => (
    <View className="bg-white rounded-2xl mx-4 mb-4 shadow-sm shadow-black/5 border border-gray-100 overflow-hidden">
      <View className="p-4">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center">
            <View className="w-12 h-12 bg-accent/10 rounded-2xl justify-center items-center mr-3">
              <Text className="text-2xl">{item.customerAvatar}</Text>
            </View>
            <View>
              <Text className="text-primary text-lg font-bold">
                {item.customerName}
              </Text>
              <Text className="text-secondary text-sm">
                Completed at {item.completedTime}
              </Text>
            </View>
          </View>
          
          <View className="items-end">
            <Text className="text-primary text-xl font-bold">
              ₹{item.fare + item.tip}
            </Text>
            {item.tip > 0 && (
              <Text className="text-green-600 text-sm">
                +₹{item.tip} tip
              </Text>
            )}
          </View>
        </View>

        {/* Trip Summary */}
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-secondary text-sm">
            {item.distance} km • {item.duration} min
          </Text>
          
          {item.customerRating && (
            <View className="flex-row items-center">
              <Ionicons name="star" size={16} color="#F59E0B" />
              <Text className="text-yellow-600 text-sm font-medium ml-1">
                {item.customerRating} rating
              </Text>
            </View>
          )}
        </View>

        {/* Route */}
        <View className="border-t border-gray-100 pt-3">
          <Text className="text-secondary text-sm mb-1">
            From: {item.pickupLocation}
          </Text>
          <Text className="text-secondary text-sm">
            To: {item.dropoffLocation}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderCancelledTripCard = ({ item }) => (
    <View className="bg-white rounded-2xl mx-4 mb-4 shadow-sm shadow-black/5 border border-gray-100 overflow-hidden">
      <View className="p-4">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center">
            <View className="w-12 h-12 bg-red-100 rounded-2xl justify-center items-center mr-3">
              <Text className="text-2xl">{item.customerAvatar}</Text>
            </View>
            <View>
              <Text className="text-primary text-lg font-bold">
                {item.customerName}
              </Text>
              <Text className="text-secondary text-sm">
                Cancelled at {item.cancelledTime}
              </Text>
            </View>
          </View>
          
          {item.cancellationFee > 0 && (
            <Text className="text-green-600 text-base font-bold">
              +₹{item.cancellationFee}
            </Text>
          )}
        </View>

        {/* Cancellation Reason */}
        <View className="bg-red-50 rounded-xl p-3 mb-3">
          <Text className="text-red-600 text-sm">
            Reason: {item.cancellationReason}
          </Text>
        </View>

        {/* Route */}
        <Text className="text-secondary text-sm">
          From {item.pickupLocation} to {item.dropoffLocation}
        </Text>
      </View>
    </View>
  );

  const renderTripCard = ({ item }) => {
    switch (selectedTab) {
      case 'available':
        return renderAvailableTripCard({ item });
      case 'ongoing':
        return renderOngoingTripCard({ item });
      case 'completed':
        return renderCompletedTripCard({ item });
      case 'cancelled':
        return renderCancelledTripCard({ item });
      default:
        return null;
    }
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
            <Text className="text-primary text-lg font-semibold">My Trips</Text>
          </View>
          
          <TouchableOpacity
            onPress={onRefresh}
            className="w-10 h-10 bg-gray-100 rounded-2xl justify-center items-center"
            activeOpacity={0.7}
          >
            <Ionicons name="refresh" size={20} color="#1A1B23" />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Driver Status & Stats */}
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideUpAnim }],
        }}
        className="bg-white mx-4 mt-4 rounded-2xl p-4 shadow-sm shadow-black/5 border border-gray-100"
      >
        {/* Online Status Toggle */}
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center">
            <Animated.View
              style={{
                transform: [{ scale: pulseAnim }],
              }}
              className={`w-3 h-3 rounded-full mr-3 ${
                isOnline ? 'bg-accent' : 'bg-red-500'
              }`}
            />
            <Text className="text-primary text-lg font-bold">
              {isOnline ? 'Online' : 'Offline'}
            </Text>
          </View>
          
          <Switch
            value={isOnline}
            onValueChange={toggleOnlineStatus}
            trackColor={{ false: '#f3f4f6', true: '#dcfce7' }}
            thumbColor={isOnline ? '#00C851' : '#9ca3af'}
            ios_backgroundColor="#f3f4f6"
          />
        </View>

        {/* Today's Stats */}
        <View className="border-t border-gray-100 pt-4">
          <Text className="text-primary text-base font-semibold mb-3">
            Today's Performance
          </Text>
          
          <View className="flex-row justify-between">
            <View className="items-center">
              <Text className="text-primary text-xl font-bold">
                ₹{todayStats.totalEarnings}
              </Text>
              <Text className="text-secondary text-sm">Earnings</Text>
            </View>
            
            <View className="items-center">
              <Text className="text-primary text-xl font-bold">
                {todayStats.completedTrips}
              </Text>
              <Text className="text-secondary text-sm">Trips</Text>
            </View>
            
            <View className="items-center">
              <Text className="text-primary text-xl font-bold">
                {todayStats.totalDistance}
              </Text>
              <Text className="text-secondary text-sm">km</Text>
            </View>
            
            <View className="items-center">
              <Text className="text-primary text-xl font-bold">
                {todayStats.rating}
              </Text>
              <Text className="text-secondary text-sm">Rating</Text>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* Tab Navigation */}
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideUpAnim }],
        }}
        className="bg-white mx-4 mt-4 rounded-2xl shadow-sm shadow-black/5 border border-gray-100 overflow-hidden"
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row p-2">
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setSelectedTab(tab.id)}
                className={`flex-row items-center px-4 py-3 rounded-xl mr-2 ${
                  selectedTab === tab.id ? 'bg-accent/10' : 'bg-transparent'
                }`}
                activeOpacity={0.7}
              >
                <View 
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: tab.color }}
                />
                <Text className={`text-sm font-medium ${
                  selectedTab === tab.id ? 'text-accent' : 'text-secondary'
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
          opacity: fadeAnim,
          transform: [{ translateY: slideUpAnim }],
        }}
        className="flex-1 mt-4"
      >
        <FlatList
          data={tripsData[selectedTab] || []}
          renderItem={renderTripCard}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={
            <View className="items-center justify-center py-12">
              <View className="w-16 h-16 bg-gray-100 rounded-full justify-center items-center mb-4">
                <Ionicons 
                  name={selectedTab === 'available' ? 'car-outline' : 
                       selectedTab === 'ongoing' ? 'navigate-outline' :
                       selectedTab === 'completed' ? 'checkmark-circle-outline' :
                       'close-circle-outline'} 
                  size={32} 
                  color="#6C757D" 
                />
              </View>
              <Text className="text-primary text-lg font-semibold mb-2">
                No {selectedTab} trips
              </Text>
              <Text className="text-secondary text-sm text-center">
                {selectedTab === 'available' ? 
                  isOnline ? 'New trip requests will appear here' : 'Go online to receive trip requests' :
                 selectedTab === 'ongoing' ? 'Active trips will be shown here' :
                 selectedTab === 'completed' ? 'Completed trips will be listed here' :
                 'Cancelled trips will appear here'}
              </Text>
            </View>
          }
        />
      </Animated.View>
    </View>
  );
};

export default DriverTripsScreen;