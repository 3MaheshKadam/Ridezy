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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import '../../global.css';

const { width, height } = Dimensions.get('window');

const CenterDashboardScreen = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [centerStatus, setCenterStatus] = useState('open'); // open, closed, busy
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(30)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Mock center data
  const centerInfo = {
    name: 'Premium Auto Spa',
    address: 'Rajkamal Square, Amravati',
    rating: 4.8,
    totalReviews: 156,
    subscriptionPlan: 'Premium',
    subscriptionExpiry: '2024-12-31',
  };

  // Mock dashboard data for different periods
  const dashboardData = {
    today: {
      revenue: 3580,
      bookings: 12,
      completedServices: 8,
      pendingBookings: 3,
      cancelledBookings: 1,
      avgServiceTime: 42,
      customerSatisfaction: 4.7,
      newCustomers: 3,
    },
    week: {
      revenue: 18500,
      bookings: 67,
      completedServices: 58,
      pendingBookings: 6,
      cancelledBookings: 3,
      avgServiceTime: 45,
      customerSatisfaction: 4.6,
      newCustomers: 15,
    },
    month: {
      revenue: 85000,
      bookings: 298,
      completedServices: 275,
      pendingBookings: 12,
      cancelledBookings: 11,
      avgServiceTime: 47,
      customerSatisfaction: 4.5,
      newCustomers: 68,
    },
  };

  // Recent activities
  const recentActivities = [
    {
      id: '1',
      type: 'booking',
      title: 'New booking received',
      subtitle: 'Premium Wash - Rahul Sharma',
      time: '2 min ago',
      icon: 'calendar',
      iconBg: '#00C851',
    },
    {
      id: '2',
      type: 'completion',
      title: 'Service completed',
      subtitle: 'Basic Wash - Priya Patel (₹199)',
      time: '15 min ago',
      icon: 'checkmark-circle',
      iconBg: '#00C851',
    },
    {
      id: '3',
      type: 'review',
      title: 'New 5-star review',
      subtitle: 'Excellent service by Amit Kumar',
      time: '1 hour ago',
      icon: 'star',
      iconBg: '#F59E0B',
    },
    {
      id: '4',
      type: 'payment',
      title: 'Payment received',
      subtitle: 'Deluxe Spa service (₹449)',
      time: '2 hours ago',
      icon: 'wallet',
      iconBg: '#00C851',
    },
  ];

  // Quick actions
  const quickActions = [
    {
      id: 'manage_bookings',
      title: 'Manage Bookings',
      subtitle: `${dashboardData[selectedPeriod].pendingBookings} pending`,
      icon: 'calendar',
      iconLibrary: 'Ionicons',
      color: '#00C851',
      onPress: () => navigation.navigate('BookingManagement'),
    },
    {
      id: 'view_analytics',
      title: 'Analytics',
      subtitle: 'Performance insights',
      icon: 'bar-chart',
      iconLibrary: 'Ionicons',
      color: '#3B82F6',
      onPress: () => Alert.alert('Analytics', 'Detailed analytics will be shown here'),
    },
    {
      id: 'subscription',
      title: 'Subscription',
      subtitle: centerInfo.subscriptionPlan,
      icon: 'card',
      iconLibrary: 'Ionicons',
      color: '#8B5CF6',
      onPress: () => navigation.navigate('Subscription'),
    },
    {
      id: 'staff_management',
      title: 'Staff',
      subtitle: 'Manage team',
      icon: 'people',
      iconLibrary: 'Ionicons',
      color: '#F59E0B',
      onPress: () => Alert.alert('Staff Management', 'Staff management will be implemented'),
    },
  ];

  // Performance metrics
  const performanceMetrics = [
    {
      title: 'Revenue',
      value: `₹${dashboardData[selectedPeriod].revenue.toLocaleString()}`,
      change: '+12%',
      changeType: 'positive',
      icon: 'trending-up',
    },
    {
      title: 'Bookings',
      value: dashboardData[selectedPeriod].bookings.toString(),
      change: '+8%',
      changeType: 'positive',
      icon: 'calendar',
    },
    {
      title: 'Satisfaction',
      value: dashboardData[selectedPeriod].customerSatisfaction.toString(),
      change: '+0.2',
      changeType: 'positive',
      icon: 'star',
    },
    {
      title: 'Avg Time',
      value: `${dashboardData[selectedPeriod].avgServiceTime}m`,
      change: '-3m',
      changeType: 'positive',
      icon: 'time',
    },
  ];

  const periods = [
    { id: 'today', label: 'Today' },
    { id: 'week', label: 'This Week' },
    { id: 'month', label: 'This Month' },
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

    // Pulse animation for live indicator
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
    // TODO: Refresh dashboard data from API
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const toggleCenterStatus = () => {
    const statusCycle = { open: 'busy', busy: 'closed', closed: 'open' };
    const nextStatus = statusCycle[centerStatus];
    setCenterStatus(nextStatus);
    
    const statusMessages = {
      open: 'Center is now open for bookings',
      busy: 'Center marked as busy - limited bookings',
      closed: 'Center is now closed',
    };
    
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
                  {centerInfo.name}
                </Text>
                <View className="flex-row items-center mt-1">
                  <Ionicons name="location" size={14} color="#6C757D" />
                  <Text className="text-secondary text-sm ml-1">
                    {centerInfo.address}
                  </Text>
                </View>
              </View>
              
              <TouchableOpacity
                onPress={() => navigation.navigate('Notifications')}
                className="w-12 h-12 bg-white rounded-2xl justify-center items-center shadow-sm shadow-black/5"
                activeOpacity={0.7}
              >
                <Ionicons name="notifications-outline" size={20} color="#1A1B23" />
                <View className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full justify-center items-center">
                  <Text className="text-white text-xs font-bold">5</Text>
                </View>
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
                      {centerInfo.rating} Rating
                    </Text>
                    <Text className="text-secondary text-sm">
                      Based on {centerInfo.totalReviews} reviews
                    </Text>
                  </View>
                </View>
                
                <View className="bg-accent/10 px-3 py-1 rounded-full">
                  <Text className="text-accent text-sm font-semibold">
                    {centerInfo.subscriptionPlan}
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
                  className={`px-6 py-3 rounded-2xl ${
                    selectedPeriod === period.id
                      ? 'bg-accent'
                      : 'bg-white border border-gray-200'
                  } shadow-sm shadow-black/5`}
                  activeOpacity={0.8}
                >
                  <Text className={`text-sm font-semibold ${
                    selectedPeriod === period.id ? 'text-white' : 'text-secondary'
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
                  <View className={`px-2 py-1 rounded-full ${
                    metric.changeType === 'positive' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    <Text className={`text-xs font-semibold ${
                      metric.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
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

        {/* Service Summary */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideUpAnim }],
          }}
          className="px-6 mb-6"
        >
          <Text className="text-primary text-lg font-bold mb-4">
            Service Summary
          </Text>
          
          <View className="bg-white rounded-2xl shadow-sm shadow-black/5 border border-gray-100 overflow-hidden">
            <View className="p-4 border-b border-gray-100">
              <View className="flex-row items-center justify-between">
                <Text className="text-secondary text-sm">Total Bookings</Text>
                <Text className="text-primary text-lg font-bold">
                  {dashboardData[selectedPeriod].bookings}
                </Text>
              </View>
            </View>
            
            <View className="p-4 border-b border-gray-100">
              <View className="flex-row items-center justify-between">
                <Text className="text-secondary text-sm">Completed Services</Text>
                <Text className="text-green-600 text-lg font-bold">
                  {dashboardData[selectedPeriod].completedServices}
                </Text>
              </View>
            </View>
            
            <View className="p-4 border-b border-gray-100">
              <View className="flex-row items-center justify-between">
                <Text className="text-secondary text-sm">Pending Bookings</Text>
                <Text className="text-yellow-600 text-lg font-bold">
                  {dashboardData[selectedPeriod].pendingBookings}
                </Text>
              </View>
            </View>
            
            <View className="p-4">
              <View className="flex-row items-center justify-between">
                <Text className="text-secondary text-sm">New Customers</Text>
                <View className="flex-row items-center">
                  <Text className="text-primary text-lg font-bold mr-2">
                    {dashboardData[selectedPeriod].newCustomers}
                  </Text>
                  <View className="bg-green-100 px-2 py-1 rounded-full">
                    <Text className="text-green-600 text-xs font-semibold">
                      +{Math.round((dashboardData[selectedPeriod].newCustomers / dashboardData[selectedPeriod].bookings) * 100)}%
                    </Text>
                  </View>
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
            <TouchableOpacity activeOpacity={0.7}>
              <Text className="text-accent text-sm font-semibold">
                View All
              </Text>
            </TouchableOpacity>
          </View>
          
          <View className="bg-white rounded-2xl shadow-sm shadow-black/5 border border-gray-100 overflow-hidden">
            {recentActivities.map((activity, index) => (
              <View
                key={activity.id}
                className={`p-4 flex-row items-center ${
                  index !== recentActivities.length - 1 ? 'border-b border-gray-100' : ''
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

        {/* Subscription Status */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideUpAnim }],
          }}
          className="px-6 mb-8"
        >
          <TouchableOpacity
            onPress={() => navigation.navigate('Subscription')}
            activeOpacity={0.8}
            className="rounded-2xl overflow-hidden"
          >
            <LinearGradient
              colors={['#8B5CF6', '#7C3AED']}
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
                    {centerInfo.subscriptionPlan} Plan
                  </Text>
                  <Text className="text-white/80 text-sm mb-3">
                    Active until {new Date(centerInfo.subscriptionExpiry).toLocaleDateString()}
                  </Text>
                  <TouchableOpacity
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
                      Manage Plan
                    </Text>
                  </TouchableOpacity>
                </View>
                <View className="w-16 h-16 bg-white/20 rounded-2xl justify-center items-center">
                  <Ionicons name="diamond" size={24} color="#ffffff" />
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

export default CenterDashboardScreen;