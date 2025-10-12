import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import '../../global.css';

const { width, height } = Dimensions.get('window');

const AdminDashboardScreen = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    pendingCarWash: 8,
    pendingDrivers: 12,
    activeSubscriptions: 156,
    totalRevenue: 245680,
    todayRevenue: 8450,
    activeUsers: 542,
    activeDrivers: 89,
    activeCarWash: 34,
  });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    startAnimations();
    fetchDashboardData();
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

  const fetchDashboardData = async () => {
    // TODO: Implement API call to fetch dashboard data
    try {
      // Simulated API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Update dashboardData with API response
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const formatCurrency = (amount) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  // Quick action cards
  const quickActions = [
    {
      id: '1',
      title: 'Car Wash Approvals',
      icon: 'car-wash',
      iconType: 'material',
      count: dashboardData.pendingCarWash,
      color: '#3B82F6',
      gradient: ['#3B82F6', '#2563EB'],
      screen: 'CarWashApproval',
    },
    {
      id: '2',
      title: 'Driver Approvals',
      icon: 'steering',
      iconType: 'material',
      count: dashboardData.pendingDrivers,
      color: '#8B5CF6',
      gradient: ['#8B5CF6', '#7C3AED'],
      screen: 'DriverApproval',
    },
    {
      id: '3',
      title: 'Subscriptions',
      icon: 'card-membership',
      iconType: 'material',
      count: dashboardData.activeSubscriptions,
      color: '#10B981',
      gradient: ['#10B981', '#059669'],
      screen: 'SubscriptionManagement',
    },
    {
      id: '4',
      title: 'Payment Overview',
      icon: 'attach-money',
      iconType: 'material',
      count: `${formatCurrency(dashboardData.todayRevenue)}`,
      color: '#F59E0B',
      gradient: ['#F59E0B', '#D97706'],
      screen: 'PaymentOverview',
    },
  ];

  // Stats cards
  const statsCards = [
    {
      id: '1',
      title: 'Total Revenue',
      value: formatCurrency(dashboardData.totalRevenue),
      icon: 'trending-up',
      change: '+12.5%',
      changeType: 'positive',
      color: '#10B981',
    },
    {
      id: '2',
      title: 'Active Users',
      value: dashboardData.activeUsers,
      icon: 'people',
      change: '+8.2%',
      changeType: 'positive',
      color: '#3B82F6',
    },
    {
      id: '3',
      title: 'Active Drivers',
      value: dashboardData.activeDrivers,
      icon: 'car',
      change: '+5.1%',
      changeType: 'positive',
      color: '#8B5CF6',
    },
    {
      id: '4',
      title: 'Car Wash Centers',
      value: dashboardData.activeCarWash,
      icon: 'water',
      change: '+3.7%',
      changeType: 'positive',
      color: '#06B6D4',
    },
  ];

  // Recent activities
  const recentActivities = [
    {
      id: '1',
      type: 'carwash_approval',
      title: 'New Car Wash Registration',
      description: 'Sparkle Auto Wash - Pending Approval',
      time: '5 min ago',
      icon: 'car-wash',
      color: '#3B82F6',
    },
    {
      id: '2',
      type: 'driver_approval',
      title: 'Driver Registration',
      description: 'Amit Kumar - Pending Verification',
      time: '15 min ago',
      icon: 'person',
      color: '#8B5CF6',
    },
    {
      id: '3',
      type: 'payment',
      title: 'Subscription Payment',
      description: '₹2,500 received from Premium Wash',
      time: '1 hour ago',
      icon: 'payments',
      color: '#10B981',
    },
    {
      id: '4',
      type: 'subscription',
      title: 'New Subscription',
      description: 'Car Owner - Monthly Plan',
      time: '2 hours ago',
      icon: 'card-membership',
      color: '#F59E0B',
    },
  ];

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar barStyle="light-content" backgroundColor="#1A1B23" />
      
      {/* Header */}
      <LinearGradient
        colors={['#1A1B23', '#2D2E3A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="pt-12 pb-6 px-6"
      >
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideUpAnim }],
          }}
        >
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-white/60 text-sm mb-1">Welcome back,</Text>
              <Text className="text-white text-2xl font-bold">Admin Dashboard</Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('Profile')}
              className="w-12 h-12 bg-white/10 rounded-2xl justify-center items-center"
              activeOpacity={0.8}
            >
              <Ionicons name="settings-outline" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {/* Today's Revenue Highlight */}
          <View className="bg-white/10 rounded-2xl p-4 mt-2">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-white/60 text-sm mb-1">Today's Revenue</Text>
                <Text className="text-white text-2xl font-bold">
                  {formatCurrency(dashboardData.todayRevenue)}
                </Text>
              </View>
              <View className="bg-accent/20 w-14 h-14 rounded-2xl justify-center items-center">
                <Ionicons name="cash" size={28} color="#00C851" />
              </View>
            </View>
          </View>
        </Animated.View>
      </LinearGradient>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Quick Actions Grid */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideUpAnim }],
          }}
          className="px-4 mt-6"
        >
          <Text className="text-primary text-lg font-bold mb-4">Quick Actions</Text>
          
          <View className="flex-row flex-wrap justify-between">
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={action.id}
                onPress={() => navigation.navigate(action.screen)}
                className="w-[48%] mb-4"
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={action.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    borderRadius: 16,
                    padding: 16,
                    minHeight: 120,
                  }}
                >
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="w-10 h-10 bg-white/20 rounded-xl justify-center items-center">
                      <MaterialIcons name={action.icon} size={22} color="#ffffff" />
                    </View>
                    {typeof action.count === 'number' && action.count > 0 && (
                      <View className="bg-white/30 px-2 py-1 rounded-full">
                        <Text className="text-white text-xs font-bold">
                          {action.count}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text className="text-white text-base font-semibold">
                    {action.title}
                  </Text>
                  {typeof action.count === 'string' && (
                    <Text className="text-white/80 text-xs mt-1">Today</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Statistics Cards */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideUpAnim }],
          }}
          className="px-4 mt-4"
        >
          <Text className="text-primary text-lg font-bold mb-4">Platform Statistics</Text>
          
          <View className="flex-row flex-wrap justify-between">
            {statsCards.map((stat) => (
              <View
                key={stat.id}
                className="w-[48%] bg-white rounded-2xl p-4 mb-4 shadow-sm shadow-black/5"
              >
                <View className="flex-row items-center justify-between mb-3">
                  <View
                    className="w-10 h-10 rounded-xl justify-center items-center"
                    style={{ backgroundColor: `${stat.color}15` }}
                  >
                    <Ionicons name={stat.icon} size={20} color={stat.color} />
                  </View>
                  <View
                    className={`px-2 py-1 rounded-full ${
                      stat.changeType === 'positive' ? 'bg-green-50' : 'bg-red-50'
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {stat.change}
                    </Text>
                  </View>
                </View>
                <Text className="text-secondary text-xs mb-1">{stat.title}</Text>
                <Text className="text-primary text-xl font-bold">{stat.value}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Recent Activities */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideUpAnim }],
          }}
          className="px-4 mt-4 mb-6"
        >
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-primary text-lg font-bold">Recent Activities</Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text className="text-accent text-sm font-semibold">View All</Text>
            </TouchableOpacity>
          </View>

          <View className="bg-white rounded-2xl p-4 shadow-sm shadow-black/5">
            {recentActivities.map((activity, index) => (
              <View key={activity.id}>
                <View className="flex-row items-center py-3">
                  <View
                    className="w-12 h-12 rounded-2xl justify-center items-center mr-3"
                    style={{ backgroundColor: `${activity.color}15` }}
                  >
                    <MaterialIcons name={activity.icon} size={20} color={activity.color} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-primary text-sm font-semibold mb-1">
                      {activity.title}
                    </Text>
                    <Text className="text-secondary text-xs">
                      {activity.description}
                    </Text>
                  </View>
                  <Text className="text-secondary text-xs">{activity.time}</Text>
                </View>
                {index < recentActivities.length - 1 && (
                  <View className="h-px bg-gray-100" />
                )}
              </View>
            ))}
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

export default AdminDashboardScreen;