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
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { get, patch } from '../../lib/api';
import { endpoints } from '../../config/apiConfig';
const { width, height } = Dimensions.get('window');

const BookingManagementScreen = ({ navigation }) => {
  const [selectedTab, setSelectedTab] = useState('pending');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  /* DYNAMIC STATE MANAGEMENT */
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Stats
  const [todayStats, setTodayStats] = useState({
    totalBookings: 0,
    pendingBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0,
    totalRevenue: 0,
  });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(30)).current;
  const modalSlideAnim = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    startAnimations();
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const data = await get(endpoints.centers.bookings); // Use new endpoint
      if (data && data.bookings) {
        setBookings(data.bookings);
        calculateStats(data.bookings);
      }
    } catch (err) {
      console.error("Failed to fetch bookings", err);
      Alert.alert("Error", "Failed to load bookings");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateStats = (allBookings) => {
    // Calculating stats for ALL bookings to ensure visibility
    const stats = {
      totalBookings: allBookings.length,
      pendingBookings: allBookings.filter(b => b.status === 'PENDING').length,
      completedBookings: allBookings.filter(b => b.status === 'COMPLETED').length,
      cancelledBookings: allBookings.filter(b => b.status === 'CANCELLED').length,
      totalRevenue: allBookings
        .filter(b => b.status === 'COMPLETED')
        .reduce((sum, b) => sum + (b.price || 0), 0)
    };
    setTodayStats(stats);
  };

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

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  // Helper to filter bookings for tabs
  const getFilteredBookings = (statusTab) => {
    if (statusTab === 'pending') return bookings.filter(b => b.status === 'PENDING');
    if (statusTab === 'ongoing') return bookings.filter(b => b.status === 'CONFIRMED' || b.status === 'IN_PROGRESS'); // Ongoing includes Confirmed (Accepted) & In Progress
    if (statusTab === 'completed') return bookings.filter(b => b.status === 'COMPLETED');
    if (statusTab === 'cancelled') return bookings.filter(b => b.status === 'CANCELLED');
    return [];
  };

  // Derived data for tabs count
  const tabs = [
    { id: 'pending', label: 'Pending', count: bookings.filter(b => b.status === 'PENDING').length, color: '#F59E0B' },
    { id: 'ongoing', label: 'Ongoing', count: bookings.filter(b => b.status === 'CONFIRMED' || b.status === 'IN_PROGRESS').length, color: '#00C851' },
    { id: 'completed', label: 'Completed', count: bookings.filter(b => b.status === 'COMPLETED').length, color: '#00C851' },
    { id: 'cancelled', label: 'Cancelled', count: bookings.filter(b => b.status === 'CANCELLED').length, color: '#dc2626' },
  ];

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
            { text: 'Accept', onPress: () => updateBookingStatus(booking._id, 'accepted') }
          ]
        );
        break;
      case 'reject':
        Alert.alert(
          'Reject Booking',
          'Are you sure you want to reject this booking?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Reject', style: 'destructive', onPress: () => updateBookingStatus(booking._id, 'rejected') }
          ]
        );
        break;
      case 'start':
        updateBookingStatus(booking._id, 'ongoing');
        break;
      case 'complete':
        updateBookingStatus(booking._id, 'completed');
        break;
      case 'call':
        const phoneNumber = booking.ownerId?.phone;
        if (phoneNumber) {
          Linking.openURL(`tel:${phoneNumber}`);
        } else {
          Alert.alert('Error', 'No phone number available for this customer.');
        }
        break;
    }
  };

  /* DYNAMIC ACTION HANDLER */
  const updateBookingStatus = async (bookingId, newStatus) => {
    try {
      // Map UI status to Backend ENUM Status if needed
      let backendStatus = newStatus.toUpperCase();
      if (newStatus === 'ongoing') backendStatus = 'IN_PROGRESS';
      if (newStatus === 'accepted') backendStatus = 'CONFIRMED';
      if (newStatus === 'completed') backendStatus = 'COMPLETED';
      if (newStatus === 'rejected') backendStatus = 'CANCELLED';

      await patch(endpoints.bookings.status(bookingId), { status: backendStatus });

      closeBookingModal();
      Alert.alert('Success', `Booking marked as ${newStatus}!`);

      // Refresh list
      fetchBookings();
    } catch (error) {
      console.error("Update failed", error);
      Alert.alert("Error", "Failed to update status");
    }
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

  const renderBookingCard = ({ item }) => {
    // Helper to safely access nested properties
    const customerName = item.ownerId?.full_name || 'Unknown Customer';
    const customerPhone = item.ownerId?.phone || 'No Phone';
    const customerAvatar = item.ownerId?.avatar || '👤'; // Using emoji for now if avatar url is complex
    const vehicleType = item.vehicleId?.type || 'Vehicle';
    const vehicleNumber = item.vehicleId?.plateNumber || 'No Plate';
    const serviceName = item.packageType || 'Service';
    const scheduledTime = new Date(item.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
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
                <Text className="text-2xl">👤</Text>
              </View>
              <View>
                <Text className="text-primary text-lg font-bold">
                  {customerName}
                </Text>
                <Text className="text-secondary text-sm">
                  {vehicleType} • {vehicleNumber}
                </Text>
              </View>
            </View>

            <View className="items-end">
              <View
                className="px-3 py-1 rounded-full"
                style={{ backgroundColor: getStatusColor(item.status.toLowerCase()) + '20' }}
              >
                <Text
                  className="text-xs font-semibold capitalize"
                  style={{ color: getStatusColor(item.status.toLowerCase()) }}
                >
                  {item.status}
                </Text>
              </View>
            </View>
          </View>

          {/* Service Details */}
          <View className="flex-row items-center justify-between mb-3">
            <View>
              <Text className="text-primary text-base font-semibold">
                {serviceName}
              </Text>
              <Text className="text-secondary text-sm">
                {formatTime(scheduledTime)}
              </Text>
            </View>

            <Text className="text-primary text-xl font-bold">
              ₹{item.price}
            </Text>
          </View>
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
            {item.status === 'PENDING' && (
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

            {item.status === 'CONFIRMED' && (
              <TouchableOpacity
                onPress={() => handleBookingAction('start', item)}
                className="bg-accent/10 px-4 py-2 rounded-xl"
                activeOpacity={0.8}
              >
                <Text className="text-accent text-sm font-semibold">
                  Start Service
                </Text>
              </TouchableOpacity>
            )}

            {item.status === 'IN_PROGRESS' && (
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
          </View>
        </View>
      </TouchableOpacity>
    );
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
          Booking Overview
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
                className={`flex-row items-center px-4 py-3 rounded-xl mr-2 ${selectedTab === tab.id ? 'bg-accent/10' : 'bg-transparent'
                  }`}
                activeOpacity={0.7}
              >
                <View
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: tab.color }}
                />
                <Text className={`text-sm font-medium ${selectedTab === tab.id ? 'text-accent' : 'text-secondary'
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
          data={getFilteredBookings(selectedTab)}
          renderItem={renderBookingCard}
          keyExtractor={(item) => item._id || item.id}
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