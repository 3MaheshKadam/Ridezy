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
  Modal,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useUser } from '../../context/UserContext';
import { useNotifications } from '../../context/NotificationContext';
import { get, patch } from '../../lib/api';
import { endpoints } from '../../config/apiConfig';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { reverseGeocode } from '../../lib/locationService';

const { width, height } = Dimensions.get('window');

const CenterDashboardScreen = ({ navigation }) => {
  const { user } = useUser();
  const { unreadCount } = useNotifications();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [centerStatus, setCenterStatus] = useState('open');
  const [stats, setStats] = useState({
    today: {
      revenue: 0,
      bookings: 0,
      completedServices: 0,
      pendingBookings: 0,
      newCustomers: 0,
      avgServiceTime: 0,
      customerSatisfaction: 0,
    },
    week: { revenue: 0, bookings: 0, completedServices: 0, pendingBookings: 0, avgServiceTime: 0, customerSatisfaction: 0, newCustomers: 0 },
    month: { revenue: 0, bookings: 0, completedServices: 0, pendingBookings: 0, avgServiceTime: 0, customerSatisfaction: 0, newCustomers: 0 },
  });
  const [activities, setActivities] = useState([]);

  // Address Editing State
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [newAddress, setNewAddress] = useState('');
  const [isServing, setIsServing] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(30)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Center data from context or fallbacks
  // Center data from context or fallbacks - initialized with user data but updated from API
  const [centerProfile, setCenterProfile] = useState({
    name: user?.name || user?.fullName || 'My Car Wash',
    address: user?.address || 'Location not set',
    contactPhone: user?.phone || '',
    logo: '',
    rating: 0,
    totalReviews: 0,
    subscriptionPlan: 'Basic',
    subscriptionExpiry: new Date().toISOString(),
  });

  useEffect(() => {
    startAnimations();
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const data = await get(endpoints.centers.dashboard);
      if (data && data.dashboardData) {
        const dd = data.dashboardData;
        setStats(prev => ({
          ...prev,
          today: dd.today || prev.today,
          week: dd.week || prev.week,
          month: dd.month || prev.month,
          // Store total revenue if needed or map widely
        }));

        // Fix for Subscription Plan showing as ID
        let planName = dd.profile?.subscriptionPlan || 'Basic';
        // If planName looks like a MongoDB ID (24 hex chars), assume 'Basic' or derive from ID if logic exists
        if (/^[0-9a-fA-F]{24}$/.test(planName)) {
          planName = 'Basic'; // Fallback to Basic if it's an ID
        }

        setCenterProfile(prev => ({
          ...prev,
          ...dd.profile,
          subscriptionPlan: planName
        }));

        setActivities(dd.recentActivities || []);
      }
    } catch (error) {
      console.error("Dashboard fetch error:", error);
    }
  };

  // Removed handleUpdateAddress as it is now handled in EditCenterProfileScreen

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
    await fetchDashboardData();
    setRefreshing(false);
  };

  const toggleCenterStatus = async () => {
    const statusCycle = { open: 'busy', busy: 'closed', closed: 'open' };
    const nextStatus = statusCycle[centerStatus];
    setCenterStatus(nextStatus);

    const statusMessages = {
      open: 'Center is now open for bookings',
      busy: 'Center marked as busy - limited bookings',
      closed: 'Center is now closed',
    };

    // Persist status to backend
    try {
      await patch(endpoints.centers.profile, { status: nextStatus });
    } catch (error) {
      console.error('Failed to update center status:', error);
    }

    Alert.alert('Status Updated', statusMessages[nextStatus]);
  };

  const getStatusColor = (status) => {
    const colors = {
      open: '#00C851',
      busy: '#F59E0B',
      closed: '#dc2626',
    };
    return colors[status];
  };

  const getStatusLabel = (status) => {
    const labels = {
      open: 'Open',
      busy: 'Busy',
      closed: 'Closed',
    };
    return labels[status];
  };

  const renderIcon = (action) => {
    const IconComponent = action.iconLibrary === 'MaterialIcons' ? MaterialIcons : Ionicons;
    return <IconComponent name={action.icon} size={24} color={action.color} />;
  };

  // Quick actions
  const quickActions = [
    {
      id: 'manage_bookings',
      title: 'Manage Bookings',
      subtitle: `${stats[selectedPeriod]?.pendingBookings || 0} pending`,
      icon: 'calendar',
      iconLibrary: 'Ionicons',
      color: '#00C851',
      onPress: () => navigation.navigate('Bookings'),
    },
    {
      id: 'manage_services',
      title: 'Services',
      subtitle: 'Manage offerings',
      icon: 'construct',
      iconLibrary: 'Ionicons',
      color: '#3B82F6',
      onPress: () => navigation.navigate('ServiceManagement'),
    },
    {
      id: 'subscription',
      title: 'Subscription',
      subtitle: centerProfile.subscriptionPlan,
      icon: 'card',
      iconLibrary: 'Ionicons',
      color: '#8B5CF6',
      onPress: () => navigation.navigate('Subscriptions'),
    },
    {
      id: 'staff_management',
      title: 'Staff',
      subtitle: 'Manage team',
      icon: 'people',
      iconLibrary: 'Ionicons',
      color: '#F59E0B',
      onPress: () => navigation.navigate('StaffManagement'),
    },
  ];

  // Performance metrics
  const performanceMetrics = [
    {
      title: 'Revenue',
      value: `₹${(stats[selectedPeriod]?.revenue || 0).toLocaleString()}`,
      change: stats[selectedPeriod]?.revenueChange || '0%',
      changeType: (stats[selectedPeriod]?.revenueChange || '').includes('-') ? 'negative' : 'positive',
      icon: 'trending-up',
    },
    {
      title: 'Bookings',
      value: (stats[selectedPeriod]?.bookings || 0).toString(),
      change: stats[selectedPeriod]?.bookingsChange || '0%',
      changeType: (stats[selectedPeriod]?.bookingsChange || '').includes('-') ? 'negative' : 'positive',
      icon: 'calendar',
    },
  ];

  const periods = [
    { id: 'today', label: 'Today' },
    { id: 'week', label: 'This Week' },
    { id: 'month', label: 'This Month' },
  ];

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
              <View className="flex-1">
                <Text className="text-secondary text-sm font-medium">
                  Good Morning
                </Text>
                <Text className="text-primary text-2xl font-bold">
                  {centerProfile.name}
                </Text>
                {centerProfile.contactPhone ? (
                  <Text className="text-secondary text-xs mt-1">
                    📞 {centerProfile.contactPhone}
                  </Text>
                ) : null}
                <View className="flex-row items-center mt-1">
                  <Ionicons name="location" size={14} color="#6C757D" />
                  <Text className="text-secondary text-sm ml-1 mr-2">
                    {centerProfile.address}
                  </Text>
                  <TouchableOpacity onPress={() => navigation.navigate('EditCenterProfile')}>
                    <Ionicons name="pencil" size={14} color="#3B82F6" />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => navigation.navigate('Notifications')}
                className="w-12 h-12 bg-white rounded-2xl justify-center items-center shadow-sm shadow-black/5"
                activeOpacity={0.7}
              >
                <Ionicons name="notifications-outline" size={20} color="#1A1B23" />
                {unreadCount > 0 && (
                  <View className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full justify-center items-center">
                    <Text className="text-white text-xs font-bold">{unreadCount > 9 ? '9+' : unreadCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Center Status Toggle */}
            <TouchableOpacity
              onPress={toggleCenterStatus}
              activeOpacity={0.8}
              className="rounded-2xl overflow-hidden mb-4"
            >
              <LinearGradient
                colors={[getStatusColor(centerStatus), getStatusColor(centerStatus) + '80']}
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
                        {getStatusLabel(centerStatus)}
                      </Text>
                      <Text className="text-white/80 text-sm">
                        Tap to change status
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#ffffff" />
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* Center Rating */}
            <View className="bg-white rounded-2xl p-4 shadow-sm shadow-black/5">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <View className="bg-yellow-50 p-2 rounded-xl mr-3">
                    <Ionicons name="star" size={24} color="#F59E0B" />
                  </View>
                  <View>
                    <Text className="text-primary text-lg font-bold">
                      {centerProfile.rating} Rating
                    </Text>
                    <Text className="text-secondary text-sm">
                      Based on {centerProfile.totalReviews} reviews
                    </Text>
                  </View>
                </View>

                <View className="bg-accent/10 px-3 py-1 rounded-full">
                  <Text className="text-accent text-sm font-semibold">
                    {centerProfile.subscriptionPlan}
                  </Text>
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
                  <View className="w-8 h-8 bg-accent/10 rounded-full justify-center items-center">
                    <Ionicons name={metric.icon} size={16} color="#00C851" />
                  </View>
                  <View className={`px-2 py-1 rounded-full ${metric.changeType === 'positive' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                    <Text className={`text-xs font-semibold ${metric.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                      }`}>
                      {metric.change}
                    </Text>
                  </View>
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

        {/* Service Summary - Lifetime Stats */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideUpAnim }],
          }}
          className="px-6 mb-8"
        >
          <Text className="text-primary text-lg font-bold mb-4">
            Service Summary (All Time)
          </Text>

          <View className="bg-white rounded-2xl shadow-sm shadow-black/5 border border-gray-100 overflow-hidden">
            <View className="p-4 border-b border-gray-100">
              <View className="flex-row items-center justify-between">
                <Text className="text-secondary text-sm">Total Bookings</Text>
                <Text className="text-primary text-lg font-bold">
                  {stats.total?.bookings || 0}
                </Text>
              </View>
            </View>

            <View className="p-4 border-b border-gray-100">
              <View className="flex-row items-center justify-between">
                <Text className="text-secondary text-sm">Completed Services</Text>
                <Text className="text-green-600 text-lg font-bold">
                  {stats.total?.completedServices || 0}
                </Text>
              </View>
            </View>

            <View className="p-4 border-b border-gray-100">
              <View className="flex-row items-center justify-between">
                <Text className="text-secondary text-sm">Pending Bookings</Text>
                <Text className="text-yellow-600 text-lg font-bold">
                  {stats.total?.pendingBookings || 0}
                </Text>
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
            <TouchableOpacity onPress={() => navigation.navigate('Bookings')} activeOpacity={0.7}>
              <Text className="text-accent text-sm font-semibold">
                View All
              </Text>
            </TouchableOpacity>
          </View>

          <View className="bg-white rounded-2xl shadow-sm shadow-black/5 border border-gray-100 overflow-hidden">
            {activities.length > 0 ? (
              activities.map((activity, index) => (
                <View
                  key={activity.id}
                  className={`p-4 flex-row items-center ${index !== activities.length - 1 ? 'border-b border-gray-100' : ''
                    }`}
                >
                  <View
                    className="w-10 h-10 rounded-full justify-center items-center mr-3"
                    style={{ backgroundColor: '#00C851' + '20' }} // Default color for now
                  >
                    <Ionicons
                      name="calendar" // Default icon
                      size={18}
                      color="#00C851"
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
              ))
            ) : (
              <View className="p-4 items-center">
                <Text className="text-secondary">No recent activities</Text>
              </View>
            )}
          </View>
        </Animated.View>


      </ScrollView>

      {/* Address Edit Modal */}
      {/* Address Edit Modal Removed - Handled in EditCenterProfileScreen */}
    </View>
  );
};

export default CenterDashboardScreen;