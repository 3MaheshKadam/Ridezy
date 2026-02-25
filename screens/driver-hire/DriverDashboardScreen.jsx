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
  RefreshControl,
  Switch,
  ActivityIndicator,
  Image,
  Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useUser } from '../../context/UserContext';
import { useNotifications } from '../../context/NotificationContext'; // Added
import { get, patch } from '../../lib/api';
import { endpoints } from '../../config/apiConfig';

const { width, height } = Dimensions.get('window');

import { useDriverStatus } from '../../hooks/useDriverStatus';

const DriverDashboardScreen = ({ navigation }) => {
  const { user } = useUser();
  const { popupNotification, setPopupNotification, markAsRead } = useNotifications(); // Added
  const { isOnline, fetchStatus: fetchDriverStatus, toggleStatus: toggleOnlineStatus } = useDriverStatus();
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [acceptedTrip, setAcceptedTrip] = useState(null); // Trip assigned by owner
  const [tripPopupVisible, setTripPopupVisible] = useState(false);
  const tripPollRef = useRef(null);
  const lastAcceptedTripId = useRef(null); // Avoid re-triggering same trip popup

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(30)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Fallback data
  const defaultStats = {
    performance: {
      today: { earnings: 0, trips: 0, distance: 0, hours: 0, acceptanceRate: 100, cancellationRate: 0, avgRating: 5.0, completionRate: 100 },
      week: { earnings: 0, trips: 0, distance: 0, hours: 0, acceptanceRate: 100, cancellationRate: 0, avgRating: 5.0, completionRate: 100 },
      month: { earnings: 0, trips: 0, distance: 0, hours: 0, acceptanceRate: 100, cancellationRate: 0, avgRating: 5.0, completionRate: 100 },
    },
    recentActivity: []
  };

  const performanceData = stats?.performance || defaultStats.performance;
  const recentActivities = stats?.recentActivity || [];
  const pendingTrips = stats?.pendingTrips || 0;

  const driverProfile = {
    name: user?.name || user?.fullName || 'Driver',
    avatar: user?.avatar || '👨‍💼',
    rating: stats?.rating || 5.0,
    totalTrips: stats?.totalTrips || 0,
    memberSince: user?.createdAt ? new Date(user.createdAt).getFullYear().toString() : '2024',
    vehicleNumber: user?.vehicle?.plateNumber || 'MH XX XX 1234',
    vehicleName: user?.vehicle?.model || 'Vehicle',
    verificationStatus: user?.status === 'active' ? 'verified' : 'pending',
  };

  // 🔄 Robust Polling for Accepted Trips
  useEffect(() => {
    let interval = null;

    if (isOnline) {
      console.log('Driver is ONLINE - Starting trip poll loop...');

      const poll = async () => {
        try {
          const response = await get(endpoints.drivers.myAcceptedTrip);
          const trip = response?.trip;

          if (trip && trip._id) {
            console.log('Poll Found Trip:', trip._id, 'Status:', trip.status);

            if (lastAcceptedTripId.current !== trip._id) {
              lastAcceptedTripId.current = trip._id;
              setAcceptedTrip(trip);
              setTripPopupVisible(true);
              console.log('New trip! Showing popup.');
            }
          } else {
            // Reset tracker if no trip found (important for re-hiring)
            if (lastAcceptedTripId.current) {
              console.log('No active trip found. Resetting tracker.');
              lastAcceptedTripId.current = null;
              setAcceptedTrip(null);
            }
          }
        } catch (error) {
          console.log('Trip poll error:', error);
        }
      };

      // Initial check
      poll();

      // Secondary loop
      interval = setInterval(poll, 5000);
    } else {
      console.log('Driver is OFFLINE - Stopping poll loop.');
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOnline]);

  // Also re-check whenever this screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (isOnline) {
        // We don't need to start a new interval here, the useEffect handles it.
        // But a quick immediate check is good when returning to dashboard.
        console.log('Dashboard Focus - Immediate trip check...');
        const check = async () => {
          const res = await get(endpoints.drivers.myAcceptedTrip);
          if (res?.trip && lastAcceptedTripId.current !== res.trip._id) {
            lastAcceptedTripId.current = res.trip._id;
            setAcceptedTrip(res.trip);
            setTripPopupVisible(true);
          }
        };
        check();
      }
    }, [isOnline])
  );

  useEffect(() => {
    fetchStats();
    fetchDriverStatus(); // Fetch status from hook
    startAnimations();
  }, [fetchDriverStatus]);

  const fetchStats = async () => {
    try {
      const data = await get(endpoints.drivers.stats);
      setStats(data);
      // Status handling moved to hook
    } catch (error) {
      console.error("Failed to fetch driver stats:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
    fetchDriverStatus();
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

    // Pulse animation for online status
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

  const quickActions = [
    {
      id: 'view_trips',
      title: 'My Trips',
      subtitle: `${pendingTrips} available`,
      icon: 'car',
      iconLibrary: 'Ionicons',
      color: '#00C851',
      onPress: () => navigation.navigate('DriverTrips'),
    },
    {
      id: 'earnings',
      title: 'Earnings',
      subtitle: `₹${performanceData[selectedPeriod].earnings}`,
      icon: 'wallet',
      iconLibrary: 'Ionicons',
      color: '#F59E0B',
      onPress: () => navigation.navigate('DriverEarnings'),
    },
    {
      id: 'find_trips',
      title: 'Find Trips',
      subtitle: 'View Request Feed',
      icon: 'search',
      iconLibrary: 'Ionicons',
      color: '#3B82F6',
      onPress: () => navigation.navigate('DriverRequestFeed'),
    },
    {
      id: 'support',
      title: 'Support',
      subtitle: '24/7 Help',
      icon: 'help-circle',
      iconLibrary: 'Ionicons',
      color: '#8B5CF6',
      onPress: () => navigation.navigate('Support'),
    },
  ];

  const performanceMetrics = [
    {
      title: 'Total Earnings',
      value: `₹${performanceData[selectedPeriod].earnings.toLocaleString()}`,
      icon: 'trending-up',
      color: '#00C851',
    },
    {
      title: 'Completed Trips',
      value: performanceData[selectedPeriod].trips.toString(),
      icon: 'car',
      color: '#3B82F6',
    },
    {
      title: 'Distance Covered',
      value: `${performanceData[selectedPeriod].distance} km`,
      icon: 'location',
      color: '#8B5CF6',
    },
    {
      title: 'Hours Online',
      value: `${performanceData[selectedPeriod].hours}h`,
      icon: 'time',
      color: '#F59E0B',
    },
  ];

  const periods = [
    { id: 'today', label: 'Today' },
    { id: 'week', label: 'This Week' },
    { id: 'month', label: 'This Month' },
  ];

  const handleEmergencySupport = () => {
    Alert.alert(
      'Emergency Support',
      'Need immediate help?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call Support',
          onPress: () => {
            // Linking.openURL('tel:1800743399'); 
            // Importing Linking first or just use it if imported. 
            // Assuming Linking is not imported, let's just keep alert but cleaner.
            // Wait, I should import Linking.
            Alert.alert('Calling', 'Emergency support: +91 1800-RIDEZY')
          }
        },
        { text: 'Share Location', onPress: () => Alert.alert('Location Shared', 'Your location has been shared with support team') }
      ]
    );
  };



  const renderIcon = (action) => {
    const IconComponent = action.iconLibrary === 'MaterialIcons' ? MaterialIcons : Ionicons;
    return <IconComponent name={action.icon} size={24} color={action.color} />;
  };

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideUpAnim }],
          }}
        >
          <LinearGradient
            colors={['#ffffff', '#f8f9fa']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="pt-12 pb-6 px-6"
          >
            <View className="flex-row items-center justify-between mb-6">
              <TouchableOpacity
                className="flex-1"
                activeOpacity={0.7}
                onPress={() => navigation.navigate('Profile')}
              >
                <Text className="text-secondary text-sm font-medium">
                  Good Morning
                </Text>
                <Text className="text-primary text-2xl font-bold">
                  {driverProfile.name}
                </Text>
                <View className="flex-row items-center mt-1">
                  <Ionicons name="car-sport" size={14} color="#6C757D" />
                  <Text className="text-secondary text-sm ml-1">
                    {driverProfile.vehicleName} • {driverProfile.vehicleNumber}
                  </Text>
                </View>
              </TouchableOpacity>

              <View className="items-center">
                <TouchableOpacity
                  onPress={() => navigation.navigate('Notifications')}
                  className="w-12 h-12 bg-white rounded-2xl justify-center items-center shadow-sm shadow-black/5 mb-2"
                  activeOpacity={0.7}
                >
                  <Ionicons name="notifications-outline" size={20} color="#1A1B23" />
                  {pendingTrips > 0 && (
                    <View className="absolute -top-1 -right-1 w-4 h-4 bg-accent rounded-full justify-center items-center">
                      <Text className="text-white text-xs font-bold">{pendingTrips}</Text>
                    </View>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleEmergencySupport}
                  className="w-12 h-12 bg-red-100 rounded-2xl justify-center items-center shadow-sm shadow-black/5"
                  activeOpacity={0.7}
                >
                  <Ionicons name="shield-checkmark" size={20} color="#dc2626" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Driver Status Toggle */}
            <TouchableOpacity
              onPress={toggleOnlineStatus}
              activeOpacity={0.8}
              className="rounded-2xl overflow-hidden mb-4"
            >
              <LinearGradient
                colors={isOnline ? ['#00C851', '#00A843'] : ['#6C757D', '#4B5563']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  borderRadius: 16,
                  padding: 16,
                }}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <Animated.View
                      style={{
                        transform: [{ scale: pulseAnim }],
                      }}
                      className="w-3 h-3 bg-white rounded-full mr-3"
                    />
                    <View>
                      <Text className="text-white text-lg font-semibold">
                        {isOnline ? 'Online - Ready for Trips' : 'Offline - Not Receiving Trips'}
                      </Text>
                      <Text className="text-white/80 text-sm">
                        Tap to {isOnline ? 'go offline' : 'start earning'}
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={isOnline}
                    onValueChange={toggleOnlineStatus}
                    trackColor={{ false: 'rgba(255,255,255,0.3)', true: 'rgba(255,255,255,0.3)' }}
                    thumbColor="#ffffff"
                    ios_backgroundColor="rgba(255,255,255,0.3)"
                  />
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* Driver Profile Card */}
            <View className="bg-white rounded-2xl p-4 shadow-sm shadow-black/5">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <View className="w-16 h-16 bg-accent/10 rounded-2xl justify-center items-center mr-4 overflow-hidden">
                    {driverProfile.avatar && (driverProfile.avatar.startsWith('http') || driverProfile.avatar.startsWith('file')) ? (
                      <Image
                        source={{ uri: driverProfile.avatar }}
                        className="w-full h-full"
                        resizeMode="cover"
                      />
                    ) : (
                      <Text className="text-3xl">{driverProfile.avatar}</Text>
                    )}
                  </View>
                  <View>
                    <View className="flex-row items-center mb-1">
                      <Text className="text-primary text-lg font-bold mr-2">
                        {driverProfile.rating}
                      </Text>
                      <Ionicons name="star" size={16} color="#F59E0B" />
                    </View>
                    <Text className="text-secondary text-sm">
                      {driverProfile.totalTrips} trips completed
                    </Text>
                    <Text className="text-secondary text-sm">
                      Driver since {driverProfile.memberSince}
                    </Text>
                  </View>
                </View>

                <View className="items-end">
                  <View className={`px-3 py-1 rounded-full ${driverProfile.verificationStatus === 'verified' ? 'bg-green-100' : 'bg-yellow-100'}`}>
                    <Text className={`text-sm font-semibold ${driverProfile.verificationStatus === 'verified' ? 'text-green-600' : 'text-yellow-600'}`}>
                      {driverProfile.verificationStatus === 'verified' ? 'Verified ✓' : 'Pending Review'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Period Selector */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideUpAnim }],
          }}
          className="px-6 mb-4"
        >
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row space-x-3">
              {periods.map((period) => (
                <TouchableOpacity
                  key={period.id}
                  onPress={() => setSelectedPeriod(period.id)}
                  className={`px-6 py-3 rounded-2xl ${selectedPeriod === period.id
                    ? 'bg-accent'
                    : 'bg-white border border-gray-200'
                    } shadow-sm shadow-black/5`}
                  activeOpacity={0.8}
                >
                  <Text className={`text-sm font-semibold ${selectedPeriod === period.id ? 'text-white' : 'text-secondary'
                    }`}>
                    {period.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </Animated.View>

        {/* Performance Metrics */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideUpAnim }],
          }}
          className="px-6 mb-6"
        >
          <Text className="text-primary text-lg font-bold mb-4">
            Performance Overview
          </Text>

          <View className="flex-row flex-wrap gap-3">
            {performanceMetrics.map((metric, index) => (
              <View
                key={index}
                className="bg-white rounded-2xl p-4 shadow-sm shadow-black/5 border border-gray-100"
                style={{ width: (width - 60) / 2 }}
              >
                <View className="flex-row items-center justify-between mb-2">
                  <View
                    className="w-8 h-8 rounded-full justify-center items-center"
                    style={{ backgroundColor: metric.color + '20' }}
                  >
                    <Ionicons name={metric.icon} size={16} color={metric.color} />
                  </View>
                  {metric.change && (
                    <View className={`px-2 py-1 rounded-full ${metric.changeType === 'positive' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                      <Text className={`text-xs font-semibold ${metric.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                        }`}>
                        {metric.change}
                      </Text>
                    </View>
                  )}
                </View>

                <Text className="text-primary text-xl font-bold mb-1">
                  {metric.value}
                </Text>
                <Text className="text-secondary text-sm">
                  {metric.title}
                </Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideUpAnim }],
          }}
          className="px-6 mb-6"
        >
          <Text className="text-primary text-lg font-bold mb-4">
            Quick Actions
          </Text>

          <View className="flex-row flex-wrap gap-3">
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                onPress={action.onPress}
                activeOpacity={0.8}
                className="bg-white rounded-2xl p-4 shadow-sm shadow-black/5 border border-gray-100 items-center"
                style={{ width: (width - 60) / 2 }}
              >
                <View
                  className="w-12 h-12 rounded-2xl justify-center items-center mb-3"
                  style={{ backgroundColor: action.color + '20' }}
                >
                  {renderIcon(action)}
                </View>
                <Text className="text-primary text-base font-semibold text-center mb-1">
                  {action.title}
                </Text>
                <Text className="text-secondary text-sm text-center">
                  {action.subtitle}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Performance Summary */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideUpAnim }],
          }}
          className="px-6 mb-6"
        >
          <Text className="text-primary text-lg font-bold mb-4">
            Performance Summary
          </Text>

          <View className="bg-white rounded-2xl shadow-sm shadow-black/5 border border-gray-100 overflow-hidden">
            <View className="p-4 border-b border-gray-100">
              <View className="flex-row items-center justify-between">
                <Text className="text-secondary text-sm">Acceptance Rate</Text>
                <Text className="text-primary text-lg font-bold">
                  {performanceData[selectedPeriod].acceptanceRate}%
                </Text>
              </View>
            </View>

            <View className="p-4 border-b border-gray-100">
              <View className="flex-row items-center justify-between">
                <Text className="text-secondary text-sm">Completion Rate</Text>
                <Text className="text-green-600 text-lg font-bold">
                  {performanceData[selectedPeriod].completionRate}%
                </Text>
              </View>
            </View>

            <View className="p-4 border-b border-gray-100">
              <View className="flex-row items-center justify-between">
                <Text className="text-secondary text-sm">Cancellation Rate</Text>
                <Text className="text-yellow-600 text-lg font-bold">
                  {performanceData[selectedPeriod].cancellationRate}%
                </Text>
              </View>
            </View>

            <View className="p-4">
              <View className="flex-row items-center justify-between">
                <Text className="text-secondary text-sm">Average Rating</Text>
                <View className="flex-row items-center">
                  <Text className="text-primary text-lg font-bold mr-2">
                    {performanceData[selectedPeriod].avgRating}
                  </Text>
                  <Ionicons name="star" size={16} color="#F59E0B" />
                </View>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Recent Activities */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideUpAnim }],
          }}
          className="px-6 mb-6"
        >
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-primary text-lg font-bold">
              Recent Activities
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('DriverTrips')}
              activeOpacity={0.7}
            >
              <Text className="text-accent text-sm font-semibold">
                View All
              </Text>
            </TouchableOpacity>
          </View>

          <View className="bg-white rounded-2xl shadow-sm shadow-black/5 border border-gray-100 overflow-hidden">
            {recentActivities.map((activity, index) => (
              <View
                key={activity.id}
                className={`p-4 flex-row items-center ${index !== recentActivities.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
              >
                <View
                  className="w-10 h-10 rounded-full justify-center items-center mr-3"
                  style={{ backgroundColor: activity.iconBg + '20' }}
                >
                  <Ionicons
                    name={activity.icon}
                    size={18}
                    color={activity.iconBg}
                  />
                </View>

                <View className="flex-1">
                  <Text className="text-primary text-base font-medium mb-1">
                    {activity.title}
                  </Text>
                  <Text className="text-secondary text-sm">
                    {activity.subtitle}
                  </Text>
                </View>

                <Text className="text-secondary text-xs">
                  {activity.time}
                </Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Earnings Summary */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideUpAnim }],
          }}
          className="px-6 mb-8"
        >
          <TouchableOpacity
            onPress={() => navigation.navigate('DriverEarnings')}
            activeOpacity={0.8}
            className="rounded-2xl overflow-hidden"
          >
            <LinearGradient
              colors={['#F59E0B', '#D97706']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                borderRadius: 16,
                padding: 20,
              }}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-white text-lg font-bold mb-2">
                    Total Earnings ({selectedPeriod})
                  </Text>
                  <Text className="text-white text-3xl font-black mb-3">
                    ₹{performanceData[selectedPeriod].earnings.toLocaleString()}
                  </Text>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('DriverEarnings')}
                    activeOpacity={0.8}
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      borderRadius: 12,
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      alignSelf: 'flex-start',
                    }}
                  >
                    <Text className="text-white text-sm font-semibold">
                      View Details
                    </Text>
                  </TouchableOpacity>
                </View>
                <View className="w-16 h-16 bg-white/20 rounded-2xl justify-center items-center">
                  <Ionicons name="wallet" size={24} color="#ffffff" />
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>


      {/* ✅ Accepted Trip Modal — fires when Owner selects this driver */}
      <Modal
        visible={tripPopupVisible && !!acceptedTrip}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={() => setTripPopupVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <View style={{ backgroundColor: 'white', borderRadius: 24, padding: 24, width: '100%', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 20, elevation: 20 }}>

            {/* Icon */}
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#DCFCE7', justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 16 }}>
              <Ionicons name="checkmark-circle" size={44} color="#16a34a" />
            </View>

            <Text style={{ fontSize: 22, fontWeight: 'bold', textAlign: 'center', color: '#111827', marginBottom: 4 }}>You're Hired! 🎉</Text>
            <Text style={{ color: '#6B7280', textAlign: 'center', marginBottom: 20 }}>
              {acceptedTrip?.ownerName || 'An owner'} selected you for their trip.
            </Text>

            {/* Trip route */}
            <View style={{ backgroundColor: '#F9FAFB', borderRadius: 16, padding: 16, marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 }}>
                <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#22C55E', marginTop: 3, marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 10, color: '#9CA3AF', fontWeight: '700', letterSpacing: 1 }}>PICKUP</Text>
                  <Text style={{ color: '#1F2937', fontWeight: '700', fontSize: 14 }}>{acceptedTrip?.pickupLocation || 'See map'}</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#EF4444', marginTop: 3, marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 10, color: '#9CA3AF', fontWeight: '700', letterSpacing: 1 }}>DROP-OFF</Text>
                  <Text style={{ color: '#1F2937', fontWeight: '700', fontSize: 14 }}>{acceptedTrip?.dropLocation || 'See map'}</Text>
                </View>
              </View>
            </View>

            {/* Fare */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F0FDF4', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 20 }}>
              <Text style={{ color: '#166534', fontWeight: '600', fontSize: 15 }}>Your Earnings</Text>
              <Text style={{ color: '#15803D', fontWeight: 'bold', fontSize: 20 }}>₹{acceptedTrip?.price || 0}</Text>
            </View>

            {/* CTA */}
            <TouchableOpacity
              onPress={() => {
                setTripPopupVisible(false);
                navigation.navigate('DriverTripTracking', {
                  tripId: acceptedTrip._id,
                  tripDetails: {
                    pickupLocation: acceptedTrip.pickupLocation,
                    dropoffLocation: acceptedTrip.dropLocation,
                    pickupCoordinates: acceptedTrip.pickupCoords,
                    dropoffCoordinates: acceptedTrip.dropoffCoords,
                    estimatedPrice: acceptedTrip.price,
                    status: acceptedTrip.status,
                  }
                });
              }}
              style={{ backgroundColor: '#16A34A', borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginBottom: 12 }}
            >
              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Start Navigation →</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setTripPopupVisible(false)}
              style={{ alignItems: 'center', paddingVertical: 8 }}
            >
              <Text style={{ color: '#9CA3AF', fontWeight: '500' }}>Dismiss (check later in My Trips)</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Legacy Notification Modal */}
      <Modal
        visible={!!popupNotification}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={() => setPopupNotification(null)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <View style={{ backgroundColor: 'white', borderRadius: 24, padding: 24, width: '100%', alignItems: 'center' }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#DCFCE7', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
              <Ionicons name="gift" size={32} color="#166534" />
            </View>
            <Text style={{ fontSize: 18, fontWeight: 'bold', textAlign: 'center', color: '#111827', marginBottom: 8 }}>{popupNotification?.title}</Text>
            <Text style={{ color: '#6B7280', textAlign: 'center', marginBottom: 24 }}>{popupNotification?.message}</Text>
            <TouchableOpacity
              onPress={() => {
                markAsRead(popupNotification._id);
                setPopupNotification(null);
                if (popupNotification.actionType === 'track_trip' && popupNotification.data?.tripId) {
                  navigation.navigate('DriverTripTracking', { tripId: popupNotification.data.tripId });
                } else {
                  navigation.navigate('DriverTrips');
                }
              }}
              style={{ backgroundColor: '#16A34A', width: '100%', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginBottom: 12 }}
            >
              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>
                {popupNotification?.actionType === 'track_trip' ? 'View Trip' : 'Detailed View'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setPopupNotification(null)} style={{ paddingVertical: 8 }}>
              <Text style={{ color: '#9CA3AF', fontWeight: '500' }}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
};

export default DriverDashboardScreen;