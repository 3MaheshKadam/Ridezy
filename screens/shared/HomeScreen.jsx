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
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import '../../global.css';

const { width, height } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  // Mock user data - replace with actual user context/AsyncStorage
  const [userRole, setUserRole] = useState('carOwner'); // carOwner, driver, carWashCenter, admin
  const [userName, setUserName] = useState('Alex Johnson');
  const [isDriverOnline, setIsDriverOnline] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalTrips: 24,
    totalWashes: 12,
    earnings: 2850,
    rating: 4.8,
    pendingBookings: 3,
  });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    startAnimations();
    loadUserData();
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

  const loadUserData = async () => {
    // TODO: Load user data from AsyncStorage/API
    // const userData = await getUserData();
    // setUserRole(userData.role);
    // setUserName(userData.name);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserData();
    setRefreshing(false);
  };

  const handleDriverToggle = () => {
    setIsDriverOnline(!isDriverOnline);
    // TODO: Update driver status via API
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getRoleSpecificQuickActions = () => {
    const baseActions = [
      {
        id: 'car-wash',
        title: 'Car Wash',
        subtitle: 'Book premium cleaning',
        icon: 'local-car-wash',
        iconLibrary: 'MaterialIcons',
        color: '#00C851',
        onPress: () => navigation.navigate('SearchWash'),
      },
      {
        id: 'hire-driver',
        title: 'Hire Driver',
        subtitle: 'Professional drivers',
        icon: 'person',
        iconLibrary: 'Ionicons',
        color: '#1A1B23',
        onPress: () => navigation.navigate('TripRequest'),
      },
    ];

    if (userRole === 'driver' || userRole === 'carOwner') {
      baseActions.push({
        id: 'driver-mode',
        title: isDriverOnline ? 'Go Offline' : 'Go Online',
        subtitle: isDriverOnline ? 'Stop earning' : 'Start earning',
        icon: isDriverOnline ? 'pause' : 'play',
        iconLibrary: 'Ionicons',
        color: isDriverOnline ? '#ff6b6b' : '#00C851',
        onPress: handleDriverToggle,
      });
    }

    if (userRole === 'carWashCenter') {
      baseActions.push({
        id: 'manage-bookings',
        title: 'Manage Bookings',
        subtitle: `${stats.pendingBookings} pending`,
        icon: 'calendar',
        iconLibrary: 'Ionicons',
        color: '#00C851',
        onPress: () => navigation.navigate('Bookings'),
      });
    }

    return baseActions.slice(0, 3); // Show max 3 quick actions
  };

  const getRoleSpecificStats = () => {
    switch (userRole) {
      case 'carOwner':
        return [
          { label: 'Total Trips', value: stats.totalTrips, icon: 'car' },
          { label: 'Car Washes', value: stats.totalWashes, icon: 'water' },
          { label: 'Saved Money', value: `₹${stats.earnings}`, icon: 'wallet' },
        ];
      case 'driver':
        return [
          { label: 'Total Earnings', value: `₹${stats.earnings}`, icon: 'cash' },
          { label: 'Completed Trips', value: stats.totalTrips, icon: 'car' },
          { label: 'Rating', value: stats.rating, icon: 'star' },
        ];
      case 'carWashCenter':
        return [
          { label: 'Monthly Revenue', value: `₹${stats.earnings}`, icon: 'trending-up' },
          { label: 'Total Bookings', value: stats.totalWashes, icon: 'calendar' },
          { label: 'Pending', value: stats.pendingBookings, icon: 'time' },
        ];
      default:
        return [];
    }
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
        {/* Header Section */}
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
                  {getGreeting()}
                </Text>
                <Text className="text-primary text-2xl font-bold">
                  {userName}
                </Text>
                <View className="flex-row items-center mt-1">
                  <View className="w-2 h-2 bg-accent rounded-full mr-2" />
                  <Text className="text-secondary text-sm font-medium capitalize">
                    {userRole.replace(/([A-Z])/g, ' $1').trim()}
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
                  <Text className="text-white text-xs font-bold">3</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Driver Status Toggle (if driver role) */}
            {(userRole === 'driver' || userRole === 'carOwner') && (
              <TouchableOpacity
                onPress={handleDriverToggle}
                activeOpacity={0.8}
                className="mb-4 rounded-2xl overflow-hidden"
              >
                <LinearGradient
                  colors={isDriverOnline ? ['#ff6b6b', '#ff5252'] : ['#00C851', '#00A843']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    borderRadius: 16,
                    padding: 16,
                  }}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      <View className="w-10 h-10 bg-white/20 rounded-full justify-center items-center mr-3">
                        <Ionicons 
                          name={isDriverOnline ? "pause" : "play"} 
                          size={18} 
                          color="#ffffff" 
                        />
                      </View>
                      <View>
                        <Text className="text-white text-lg font-semibold">
                          {isDriverOnline ? 'Online' : 'Offline'}
                        </Text>
                        <Text className="text-white/80 text-sm">
                          {isDriverOnline ? 'Accepting rides' : 'Tap to go online'}
                        </Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#ffffff" />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </LinearGradient>
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
          <View className="flex-row justify-between">
            {getRoleSpecificQuickActions().map((action, index) => (
              <TouchableOpacity
                key={action.id}
                onPress={action.onPress}
                activeOpacity={0.7}
                className="bg-white rounded-2xl p-4 shadow-sm shadow-black/5 border border-gray-100"
                style={{ width: (width - 60) / 3 }}
              >
                <View className="items-center">
                  <View className="w-12 h-12 bg-gray-50 rounded-2xl justify-center items-center mb-3">
                    {renderIcon(action)}
                  </View>
                  <Text className="text-primary text-sm font-semibold text-center mb-1">
                    {action.title}
                  </Text>
                  <Text className="text-secondary text-xs text-center">
                    {action.subtitle}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Stats Section */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideUpAnim }],
          }}
          className="px-6 mb-6"
        >
          <Text className="text-primary text-lg font-bold mb-4">
            Your Activity
          </Text>
          <View className="flex-row justify-between">
            {getRoleSpecificStats().map((stat, index) => (
              <View
                key={index}
                className="bg-white rounded-2xl p-4 shadow-sm shadow-black/5 border border-gray-100 items-center"
                style={{ width: (width - 60) / 3 }}
              >
                <View className="w-10 h-10 bg-accent/10 rounded-full justify-center items-center mb-2">
                  <Ionicons name={stat.icon} size={16} color="#00C851" />
                </View>
                <Text className="text-primary text-lg font-bold mb-1">
                  {stat.value}
                </Text>
                <Text className="text-secondary text-xs text-center">
                  {stat.label}
                </Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Recent Activity */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideUpAnim }],
          }}
          className="px-6 mb-6"
        >
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-primary text-lg font-bold">
              Recent Activity
            </Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text className="text-accent text-sm font-semibold">
                View All
              </Text>
            </TouchableOpacity>
          </View>

          <View className="space-y-3">
            {/* Activity Item 1 */}
            <View className="bg-white rounded-2xl p-4 shadow-sm shadow-black/5 border border-gray-100">
              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-accent/10 rounded-full justify-center items-center mr-3">
                  <MaterialIcons name="local-car-wash" size={16} color="#00C851" />
                </View>
                <View className="flex-1">
                  <Text className="text-primary text-sm font-semibold mb-1">
                    Car Wash Completed
                  </Text>
                  <Text className="text-secondary text-xs">
                    Premium wash at Downtown Center • ₹299
                  </Text>
                </View>
                <Text className="text-secondary text-xs">
                  2h ago
                </Text>
              </View>
            </View>

            {/* Activity Item 2 */}
            <View className="bg-white rounded-2xl p-4 shadow-sm shadow-black/5 border border-gray-100">
              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-primary/10 rounded-full justify-center items-center mr-3">
                  <Ionicons name="car" size={16} color="#1A1B23" />
                </View>
                <View className="flex-1">
                  <Text className="text-primary text-sm font-semibold mb-1">
                    Trip to Airport
                  </Text>
                  <Text className="text-secondary text-xs">
                    Professional driver • 45 min ride • ₹850
                  </Text>
                </View>
                <Text className="text-secondary text-xs">
                  1d ago
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Promotional Banner */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideUpAnim }],
          }}
          className="px-6 mb-8"
        >
          <View className="rounded-2xl overflow-hidden">
            <LinearGradient
              colors={['#00C851', '#00A843']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                borderRadius: 16,
                padding: 24,
              }}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-white text-lg font-bold mb-2">
                    🎉 Special Offer
                  </Text>
                  <Text className="text-white/80 text-sm mb-3">
                    Get 20% off on your next car wash service
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
                      Claim Now
                    </Text>
                  </TouchableOpacity>
                </View>
                <View className="w-16 h-16 bg-white/20 rounded-2xl justify-center items-center">
                  <Ionicons name="gift" size={24} color="#ffffff" />
                </View>
              </View>
            </LinearGradient>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Bottom Navigation Hint */}
      <View className="bg-white border-t border-gray-200 px-6 py-4">
        <View className="flex-row justify-center items-center">
          <View className="w-2 h-2 bg-accent rounded-full mr-2" />
          <Text className="text-secondary text-sm">
            Swipe up for more options
          </Text>
        </View>
      </View>
    </View>
  );
};

export default HomeScreen;