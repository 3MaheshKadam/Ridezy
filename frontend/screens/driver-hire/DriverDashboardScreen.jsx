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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import '../../global.css';

const { width, height } = Dimensions.get('window');

const DriverDashboardScreen = ({ navigation }) => {
  const [isOnline, setIsOnline] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [refreshing, setRefreshing] = useState(false);
  const [pendingTrips, setPendingTrips] = useState(2);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(30)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Mock driver data
  const driverProfile = {
    name: 'Rajesh Kumar',
    avatar: '👨‍💼',
    rating: 4.8,
    totalTrips: 342,
    memberSince: '2023',
    vehicleNumber: 'MH 27 AB 1234',
    vehicleName: 'Honda City',
    verificationStatus: 'verified',
  };

  // Performance data for different periods
  const performanceData = {
    today: {
      earnings: 1250,
      trips: 8,
      distance: 147,
      hours: 6.5,
      acceptanceRate: 92,
      cancellationRate: 3,
      avgRating: 4.9,
      completionRate: 97,
    },
    week: {
      earnings: 8750,
      trips: 56,
      distance: 1023,
      hours: 45,
      acceptanceRate: 89,
      cancellationRate: 5,
      avgRating: 4.8,
      completionRate: 95,
    },
    month: {
      earnings: 35200,
      trips: 234,
      distance: 4156,
      hours: 186,
      acceptanceRate: 91,
      cancellationRate: 4,
      avgRating: 4.8,
      completionRate: 96,
    },
  };

  // Quick actions for drivers
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
      onPress: () => Alert.alert('Earnings', 'Detailed earnings breakdown will be shown here'),
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

  // Performance metrics
  const performanceMetrics = [
    {
      title: 'Total Earnings',
      value: `₹${performanceData[selectedPeriod].earnings.toLocaleString()}`,
      change: '+₹320',
      changeType: 'positive',
      icon: 'trending-up',
      color: '#00C851',
    },
    {
      title: 'Completed Trips',
      value: performanceData[selectedPeriod].trips.toString(),
      change: '+5',
      changeType: 'positive',
      icon: 'car',
      color: '#3B82F6',
    },
    {
      title: 'Distance Covered',
      value: `${performanceData[selectedPeriod].distance} km`,
      change: '+23 km',
      changeType: 'positive',
      icon: 'location',
      color: '#8B5CF6',
    },
    {
      title: 'Hours Online',
      value: `${performanceData[selectedPeriod].hours}h`,
      change: '+1.2h',
      changeType: 'positive',
      icon: 'time',
      color: '#F59E0B',
    },
  ];

  // Recent activities
  const recentActivities = [
    {
      id: '1',
      type: 'trip_completed',
      title: 'Trip completed',
      subtitle: 'Airport pickup - ₹450 earned',
      time: '15 min ago',
      icon: 'checkmark-circle',
      iconBg: '#00C851',
    },
    {
      id: '2',
      type: 'rating_received',
      title: '5-star rating received',
      subtitle: 'Great service by customer Priya',
      time: '1 hour ago',
      icon: 'star',
      iconBg: '#F59E0B',
    },
    {
      id: '3',
      type: 'bonus_earned',
      title: 'Peak hour bonus',
      subtitle: 'Extra ₹50 for morning rush',
      time: '2 hours ago',
      icon: 'gift',
      iconBg: '#00C851',
    },
    {
      id: '4',
      type: 'trip_completed',
      title: 'Long trip completed',
      subtitle: 'Amravati to Nagpur - ₹1200',
      time: '5 hours ago',
      icon: 'car',
      iconBg: '#3B82F6',
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

  const onRefresh = async () => {
    setRefreshing(true);
    // TODO: Refresh driver data from API
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const toggleOnlineStatus = () => {
    setIsOnline(!isOnline);

    Alert.alert(
      isOnline ? 'Going Offline' : 'Going Online',
      isOnline ?
        'You will stop receiving trip requests and current location tracking will be disabled.' :
        'You will start receiving trip requests and location tracking will be enabled.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isOnline ? 'Go Offline' : 'Go Online',
          onPress: () => {
            // TODO: Update driver status via API
            Alert.alert('Status Updated', `You are now ${!isOnline ? 'online' : 'offline'}`);
          }
        }
      ]
    );
  };

  const handleEmergencySupport = () => {
    Alert.alert(
      'Emergency Support',
      'Need immediate help?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call Support', onPress: () => Alert.alert('Calling', 'Emergency support: +91 1800-RIDEZY') },
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
              <View className="flex-1">
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
              </View>

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
                  <View className="w-16 h-16 bg-accent/10 rounded-2xl justify-center items-center mr-4">
                    <Text className="text-3xl">{driverProfile.avatar}</Text>
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
                  <View className="bg-green-100 px-3 py-1 rounded-full">
                    <Text className="text-green-600 text-sm font-semibold">
                      Verified
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
            onPress={() => Alert.alert('Earnings Details', 'Detailed earnings breakdown will be shown here')}
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
    </View>
  );
};

export default DriverDashboardScreen;