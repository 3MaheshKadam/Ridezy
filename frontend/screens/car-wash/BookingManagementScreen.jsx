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
  FlatList,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import '../../global.css';

const { width, height } = Dimensions.get('window');

const BookingManagementScreen = ({ navigation }) => {
  const [selectedTab, setSelectedTab] = useState('pending');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [todayStats, setTodayStats] = useState({
    totalBookings: 12,
    pendingBookings: 3,
    completedBookings: 7,
    cancelledBookings: 2,
    totalRevenue: 3580,
  });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(30)).current;
  const modalSlideAnim = useRef(new Animated.Value(height)).current;

  // Mock booking data
  const bookingsData = {
    pending: [
      {
        id: '1',
        customerName: 'Rahul Sharma',
        customerPhone: '+91 98765 43210',
        customerAvatar: '👨',
        service: 'Premium Wash',
        vehicleType: 'Sedan',
        vehicleNumber: 'MH 27 AB 1234',
        scheduledTime: '10:30 AM',
        scheduledDate: 'Today',
        price: 299,
        duration: 45,
        status: 'pending',
        specialInstructions: 'Please focus on interior cleaning',
        createdAt: '9:15 AM',
      },
      {
        id: '2',
        customerName: 'Priya Patel',
        customerPhone: '+91 87654 32109',
        customerAvatar: '👩',
        service: 'Basic Wash',
        vehicleType: 'Hatchback',
        vehicleNumber: 'MH 27 CD 5678',
        scheduledTime: '2:00 PM',
        scheduledDate: 'Today',
        price: 199,
        duration: 30,
        status: 'pending',
        specialInstructions: '',
        createdAt: '11:30 AM',
      },
      {
        id: '3',
        customerName: 'Amit Kumar',
        customerPhone: '+91 76543 21098',
        customerAvatar: '👨‍💼',
        service: 'Deluxe Spa',
        vehicleType: 'SUV',
        vehicleNumber: 'MH 27 EF 9012',
        scheduledTime: '4:30 PM',
        scheduledDate: 'Today',
        price: 449,
        duration: 60,
        status: 'pending',
        specialInstructions: 'Customer prefers eco-friendly products',
        createdAt: '1:45 PM',
      },
    ],
    ongoing: [
      {
        id: '4',
        customerName: 'Sneha Desai',
        customerPhone: '+91 65432 10987',
        customerAvatar: '👩‍💻',
        service: 'Premium Wash',
        vehicleType: 'Sedan',
        vehicleNumber: 'MH 27 GH 3456',
        scheduledTime: '9:00 AM',
        scheduledDate: 'Today',
        price: 299,
        duration: 45,
        status: 'ongoing',
        specialInstructions: '',
        createdAt: '8:30 AM',
        startedAt: '9:05 AM',
        progress: 75,
      },
    ],
    completed: [
      {
        id: '5',
        customerName: 'Vikash Singh',
        customerPhone: '+91 54321 09876',
        customerAvatar: '👨‍🎓',
        service: 'Basic Wash',
        vehicleType: 'Hatchback',
        vehicleNumber: 'MH 27 IJ 7890',
        scheduledTime: '8:00 AM',
        scheduledDate: 'Today',
        price: 199,
        duration: 30,
        status: 'completed',
        specialInstructions: '',
        createdAt: '7:15 AM',
        completedAt: '8:35 AM',
        customerRating: 5,
      },
      {
        id: '6',
        customerName: 'Anjali Mehta',
        customerPhone: '+91 43210 98765',
        customerAvatar: '👩‍🔬',
        service: 'Premium Wash',
        vehicleType: 'SUV',
        vehicleNumber: 'MH 27 KL 2345',
        scheduledTime: '7:30 AM',
        scheduledDate: 'Today',
        price: 359,
        duration: 45,
        status: 'completed',
        specialInstructions: 'Extra attention to wheels',
        createdAt: '6:45 AM',
        completedAt: '8:20 AM',
        customerRating: 4,
      },
    ],
    cancelled: [
      {
        id: '7',
        customerName: 'Rohan Joshi',
        customerPhone: '+91 32109 87654',
        customerAvatar: '👨‍⚕️',
        service: 'Deluxe Spa',
        vehicleType: 'Luxury',
        vehicleNumber: 'MH 27 MN 6789',
        scheduledTime: '11:00 AM',
        scheduledDate: 'Today',
        price: 549,
        duration: 60,
        status: 'cancelled',
        specialInstructions: '',
        createdAt: '10:00 AM',
        cancelledAt: '10:45 AM',
        cancellationReason: 'Customer emergency',
      },
    ],
  };

  const tabs = [
    { id: 'pending', label: 'Pending', count: bookingsData.pending.length, color: '#F59E0B' },
    { id: 'ongoing', label: 'Ongoing', count: bookingsData.ongoing.length, color: '#00C851' },
    { id: 'completed', label: 'Completed', count: bookingsData.completed.length, color: '#00C851' },
    { id: 'cancelled', label: 'Cancelled', count: bookingsData.cancelled.length, color: '#dc2626' },
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
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // TODO: Refresh booking data from API
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const openBookingModal = (booking) => {
    setSelectedBooking(booking);
    setShowBookingModal(true);
    
    Animated.timing(modalSlideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeBookingModal = () => {
    Animated.timing(modalSlideAnim, {
      toValue: height,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowBookingModal(false);
      setSelectedBooking(null);
    });
  };

  const handleBookingAction = (action, booking) => {
    switch (action) {
      case 'accept':
        Alert.alert(
          'Accept Booking',
          'Are you sure you want to accept this booking?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Accept', onPress: () => updateBookingStatus(booking.id, 'accepted') }
          ]
        );
        break;
      case 'reject':
        Alert.alert(
          'Reject Booking',
          'Are you sure you want to reject this booking?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Reject', style: 'destructive', onPress: () => updateBookingStatus(booking.id, 'rejected') }
          ]
        );
        break;
      case 'start':
        updateBookingStatus(booking.id, 'ongoing');
        break;
      case 'complete':
        updateBookingStatus(booking.id, 'completed');
        break;
      case 'call':
        Alert.alert('Call Customer', `Calling ${booking.customerName} at ${booking.customerPhone}`);
        break;
    }
  };

  const updateBookingStatus = (bookingId, newStatus) => {
    // TODO: Update booking status via API
    closeBookingModal();
    Alert.alert('Success', `Booking ${newStatus} successfully!`);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#F59E0B',
      ongoing: '#00C851',
      completed: '#00C851',
      cancelled: '#dc2626',
    };
    return colors[status] || '#6C757D';
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: 'time',
      ongoing: 'play-circle',
      completed: 'checkmark-circle',
      cancelled: 'close-circle',
    };
    return icons[status] || 'help-circle';
  };

  const formatTime = (timeString) => {
    // Simple time formatting - in real app, use proper date formatting
    return timeString;
  };

  const renderBookingCard = ({ item }) => (
    <TouchableOpacity
      onPress={() => openBookingModal(item)}
      activeOpacity={0.8}
      className="bg-white rounded-2xl mx-4 mb-4 shadow-sm shadow-black/5 border border-gray-100 overflow-hidden"
    >
      {/* Header */}
      <View className="p-4 pb-3">
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
                {item.vehicleType} • {item.vehicleNumber}
              </Text>
            </View>
          </View>
          
          <View className="items-end">
            <View 
              className="px-3 py-1 rounded-full"
              style={{ backgroundColor: getStatusColor(item.status) + '20' }}
            >
              <Text 
                className="text-xs font-semibold capitalize"
                style={{ color: getStatusColor(item.status) }}
              >
                {item.status}
              </Text>
            </View>
            {item.status === 'ongoing' && item.progress && (
              <Text className="text-secondary text-xs mt-1">
                {item.progress}% Complete
              </Text>
            )}
          </View>
        </View>

        {/* Service Details */}
        <View className="flex-row items-center justify-between mb-3">
          <View>
            <Text className="text-primary text-base font-semibold">
              {item.service}
            </Text>
            <Text className="text-secondary text-sm">
              {item.duration} min • {formatTime(item.scheduledTime)}
            </Text>
          </View>
          
          <Text className="text-primary text-xl font-bold">
            ₹{item.price}
          </Text>
        </View>

        {/* Special Instructions */}
        {item.specialInstructions ? (
          <View className="bg-blue-50 rounded-xl p-3 mb-3">
            <View className="flex-row items-start">
              <Ionicons name="information-circle" size={16} color="#3B82F6" />
              <Text className="text-blue-600 text-sm ml-2 flex-1">
                {item.specialInstructions}
              </Text>
            </View>
          </View>
        ) : null}

        {/* Progress Bar for Ongoing */}
        {item.status === 'ongoing' && item.progress && (
          <View className="mb-3">
            <View className="bg-gray-200 h-2 rounded-full">
              <View 
                className="bg-accent h-2 rounded-full"
                style={{ width: `${item.progress}%` }}
              />
            </View>
          </View>
        )}
      </View>

      {/* Actions */}
      <View className="bg-gray-50 px-4 py-3 flex-row justify-between">
        <TouchableOpacity
          onPress={() => handleBookingAction('call', item)}
          className="flex-row items-center bg-blue-100 px-4 py-2 rounded-xl"
          activeOpacity={0.8}
        >
          <Ionicons name="call" size={16} color="#3B82F6" />
          <Text className="text-blue-600 text-sm font-semibold ml-2">
            Call
          </Text>
        </TouchableOpacity>

        <View className="flex-row space-x-2">
          {item.status === 'pending' && (
            <>
              <TouchableOpacity
                onPress={() => handleBookingAction('reject', item)}
                className="bg-red-100 px-4 py-2 rounded-xl"
                activeOpacity={0.8}
              >
                <Text className="text-red-600 text-sm font-semibold">
                  Reject
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleBookingAction('accept', item)}
                className="bg-accent/10 px-4 py-2 rounded-xl"
                activeOpacity={0.8}
              >
                <Text className="text-accent text-sm font-semibold">
                  Accept
                </Text>
              </TouchableOpacity>
            </>
          )}

          {item.status === 'accepted' && (
            <TouchableOpacity
              onPress={() => handleBookingAction('start', item)}
              className="bg-accent/10 px-4 py-2 rounded-xl"
              activeOpacity={0.8}
            >
              <Text className="text-accent text-sm font-semibold">
                Start
              </Text>
            </TouchableOpacity>
          )}

          {item.status === 'ongoing' && (
            <TouchableOpacity
              onPress={() => handleBookingAction('complete', item)}
              className="bg-accent/10 px-4 py-2 rounded-xl"
              activeOpacity={0.8}
            >
              <Text className="text-accent text-sm font-semibold">
                Complete
              </Text>
            </TouchableOpacity>
          )}

          {item.status === 'completed' && item.customerRating && (
            <View className="bg-yellow-100 px-4 py-2 rounded-xl flex-row items-center">
              <Ionicons name="star" size={16} color="#F59E0B" />
              <Text className="text-yellow-600 text-sm font-semibold ml-1">
                {item.customerRating}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
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
            onPress={() => navigation.goBack()}
            className="w-10 h-10 bg-gray-100 rounded-2xl justify-center items-center"
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={20} color="#1A1B23" />
          </TouchableOpacity>
          
          <View className="flex-1 items-center">
            <Text className="text-primary text-lg font-semibold">Manage Bookings</Text>
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

      {/* Today's Stats */}
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideUpAnim }],
        }}
        className="bg-white mx-4 mt-4 rounded-2xl p-4 shadow-sm shadow-black/5 border border-gray-100"
      >
        <Text className="text-primary text-lg font-bold mb-4">
          Today's Overview
        </Text>
        
        <View className="flex-row justify-between">
          <View className="items-center">
            <Text className="text-primary text-2xl font-bold">
              {todayStats.totalBookings}
            </Text>
            <Text className="text-secondary text-sm">Total</Text>
          </View>
          
          <View className="items-center">
            <Text className="text-yellow-600 text-2xl font-bold">
              {todayStats.pendingBookings}
            </Text>
            <Text className="text-secondary text-sm">Pending</Text>
          </View>
          
          <View className="items-center">
            <Text className="text-green-600 text-2xl font-bold">
              {todayStats.completedBookings}
            </Text>
            <Text className="text-secondary text-sm">Completed</Text>
          </View>
          
          <View className="items-center">
            <Text className="text-primary text-2xl font-bold">
              ₹{todayStats.totalRevenue}
            </Text>
            <Text className="text-secondary text-sm">Revenue</Text>
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

      {/* Bookings List */}
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideUpAnim }],
        }}
        className="flex-1 mt-4"
      >
        <FlatList
          data={bookingsData[selectedTab] || []}
          renderItem={renderBookingCard}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={
            <View className="items-center justify-center py-12">
              <View className="w-16 h-16 bg-gray-100 rounded-full justify-center items-center mb-4">
                <Ionicons name="calendar-outline" size={32} color="#6C757D" />
              </View>
              <Text className="text-primary text-lg font-semibold mb-2">
                No {selectedTab} bookings
              </Text>
              <Text className="text-secondary text-sm text-center">
                {selectedTab === 'pending' ? 'New bookings will appear here' : 
                 selectedTab === 'ongoing' ? 'Active services will be shown here' :
                 selectedTab === 'completed' ? 'Completed bookings will be listed here' :
                 'Cancelled bookings will appear here'}
              </Text>
            </View>
          }
        />
      </Animated.View>

      {/* Booking Detail Modal */}
      <Modal
        visible={showBookingModal}
        transparent={true}
        animationType="none"
        onRequestClose={closeBookingModal}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <Animated.View
            style={{
              transform: [{ translateY: modalSlideAnim }],
            }}
            className="bg-white rounded-t-3xl p-6 max-h-[90%]"
          >
            <View className="items-center mb-6">
              <View className="w-12 h-1 bg-gray-300 rounded-full mb-4" />
              <Text className="text-primary text-xl font-bold">
                Booking Details
              </Text>
            </View>

            {selectedBooking && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Customer Info */}
                <View className="bg-gray-50 rounded-2xl p-4 mb-4">
                  <Text className="text-primary text-base font-semibold mb-3">
                    Customer Information
                  </Text>
                  
                  <View className="flex-row items-center mb-3">
                    <View className="w-12 h-12 bg-accent/10 rounded-2xl justify-center items-center mr-3">
                      <Text className="text-2xl">{selectedBooking.customerAvatar}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-primary text-lg font-bold">
                        {selectedBooking.customerName}
                      </Text>
                      <Text className="text-secondary text-sm">
                        {selectedBooking.customerPhone}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Service Details */}
                <View className="bg-gray-50 rounded-2xl p-4 mb-4">
                  <Text className="text-primary text-base font-semibold mb-3">
                    Service Details
                  </Text>
                  
                  <View className="space-y-3">
                    <View className="flex-row justify-between">
                      <Text className="text-secondary text-sm">Service</Text>
                      <Text className="text-primary text-sm font-medium">
                        {selectedBooking.service}
                      </Text>
                    </View>
                    
                    <View className="flex-row justify-between">
                      <Text className="text-secondary text-sm">Vehicle</Text>
                      <Text className="text-primary text-sm font-medium">
                        {selectedBooking.vehicleType} • {selectedBooking.vehicleNumber}
                      </Text>
                    </View>
                    
                    <View className="flex-row justify-between">
                      <Text className="text-secondary text-sm">Scheduled</Text>
                      <Text className="text-primary text-sm font-medium">
                        {selectedBooking.scheduledDate} • {selectedBooking.scheduledTime}
                      </Text>
                    </View>
                    
                    <View className="flex-row justify-between">
                      <Text className="text-secondary text-sm">Duration</Text>
                      <Text className="text-primary text-sm font-medium">
                        {selectedBooking.duration} minutes
                      </Text>
                    </View>
                    
                    <View className="flex-row justify-between">
                      <Text className="text-secondary text-sm">Price</Text>
                      <Text className="text-primary text-lg font-bold">
                        ₹{selectedBooking.price}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Special Instructions */}
                {selectedBooking.specialInstructions && (
                  <View className="bg-blue-50 rounded-2xl p-4 mb-4">
                    <Text className="text-primary text-base font-semibold mb-2">
                      Special Instructions
                    </Text>
                    <Text className="text-blue-600 text-sm">
                      {selectedBooking.specialInstructions}
                    </Text>
                  </View>
                )}

                {/* Status Timeline */}
                <View className="bg-gray-50 rounded-2xl p-4 mb-6">
                  <Text className="text-primary text-base font-semibold mb-3">
                    Status Timeline
                  </Text>
                  
                  <View className="space-y-2">
                    <View className="flex-row items-center">
                      <Ionicons name="add-circle" size={16} color="#00C851" />
                      <Text className="text-secondary text-sm ml-3">
                        Booking created at {selectedBooking.createdAt}
                      </Text>
                    </View>
                    
                    {selectedBooking.startedAt && (
                      <View className="flex-row items-center">
                        <Ionicons name="play-circle" size={16} color="#00C851" />
                        <Text className="text-secondary text-sm ml-3">
                          Service started at {selectedBooking.startedAt}
                        </Text>
                      </View>
                    )}
                    
                    {selectedBooking.completedAt && (
                      <View className="flex-row items-center">
                        <Ionicons name="checkmark-circle" size={16} color="#00C851" />
                        <Text className="text-secondary text-sm ml-3">
                          Service completed at {selectedBooking.completedAt}
                        </Text>
                      </View>
                    )}
                    
                    {selectedBooking.cancelledAt && (
                      <View className="flex-row items-center">
                        <Ionicons name="close-circle" size={16} color="#dc2626" />
                        <Text className="text-secondary text-sm ml-3">
                          Booking cancelled at {selectedBooking.cancelledAt}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Action Buttons */}
                <View className="space-y-3">
                  <TouchableOpacity
                    onPress={() => handleBookingAction('call', selectedBooking)}
                    className="bg-blue-100 rounded-2xl py-4 flex-row justify-center items-center"
                    activeOpacity={0.8}
                  >
                    <Ionicons name="call" size={20} color="#3B82F6" />
                    <Text className="text-blue-600 text-lg font-semibold ml-2">
                      Call Customer
                    </Text>
                  </TouchableOpacity>
                  
                  {selectedBooking.status === 'pending' && (
                    <View className="flex-row space-x-3">
                      <TouchableOpacity
                        onPress={() => handleBookingAction('reject', selectedBooking)}
                        className="flex-1 bg-red-100 rounded-2xl py-4 justify-center items-center"
                        activeOpacity={0.8}
                      >
                        <Text className="text-red-600 text-lg font-semibold">
                          Reject
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        onPress={() => handleBookingAction('accept', selectedBooking)}
                        activeOpacity={0.8}
                        className="flex-1 rounded-2xl overflow-hidden"
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
                          <Text className="text-white text-lg font-semibold">
                            Accept
                          </Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </ScrollView>
            )}

            {/* Close Button */}
            <TouchableOpacity
              onPress={closeBookingModal}
              className="bg-gray-200 rounded-2xl py-4 justify-center items-center mt-4"
              activeOpacity={0.8}
            >
              <Text className="text-primary text-base font-semibold">
                Close
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

export default BookingManagementScreen;