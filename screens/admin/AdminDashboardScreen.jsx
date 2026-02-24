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
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { get } from '../../lib/api';
import { endpoints } from '../../config/apiConfig';

const { width } = Dimensions.get('window');

const GlassCard = ({ children, className = "" }) => (
  <View
    className={`bg-white/80 border border-white/20 rounded-3xl overflow-hidden ${className}`}
    style={{
      ...Platform.select({
        ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 12 },
        android: { elevation: 8 }
      })
    }}
  >
    {children}
  </View>
);

const AdminDashboardScreen = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    pendingCarWash: 0,
    pendingDrivers: 0,
    pendingCarOwners: 0,
    activeSubscriptions: 0,
    totalRevenue: 0,
    todayRevenue: 0,
    activeUsers: 0,
    activeDrivers: 0,
    activeCarWash: 0,
    recentActivities: [],
    growth: {
      revenue: '+0%',
      users: '+0%',
      drivers: '+0%',
      centers: '+0%'
    }
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
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(slideUpAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const fetchDashboardData = async () => {
    try {
      const data = await get(endpoints.admin.stats);
      if (data) {
        setDashboardData(prev => ({
          ...prev,
          ...data
        }));
      }
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
    const val = amount || 0;
    return `₹${val.toLocaleString('en-IN')}`;
  };

  const quickActions = [
    { id: '1', title: 'Car Wash', icon: 'local-car-wash', count: dashboardData.pendingCarWash, gradient: ['#6366F1', '#4F46E5'], screen: 'CarWashApprovals' },
    { id: '2', title: 'Drivers', icon: 'toys', count: dashboardData.pendingDrivers, gradient: ['#8B5CF6', '#7C3AED'], screen: 'DriverApprovals' },
    { id: '5', title: 'Owners', icon: 'directions-car', count: dashboardData.pendingCarOwners, gradient: ['#EC4899', '#DB2777'], screen: 'CarOwnerApprovals' },
    { id: '3', title: 'Plans', icon: 'card-membership', count: dashboardData.activeSubscriptions, gradient: ['#10B981', '#059669'], screen: 'Plans' },
  ];

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      {/* Hero Header */}
      <View className="h-72">
        <LinearGradient
          colors={['#0F172A', '#1E293B']}
          className="flex-1 px-6 pt-16 pb-12"
        >
          <View className="flex-row items-center justify-between mb-8">
            <View>
              <Text className="text-blue-400 text-sm font-bold tracking-widest uppercase mb-1">Ridezy Admin</Text>
              <Text className="text-white text-3xl font-black">Dashboard</Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('Profile')}
              className="w-12 h-12 bg-white/10 rounded-2xl border border-white/20 justify-center items-center"
            >
              <Ionicons name="person" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>

          <GlassCard className="p-6 bg-white/10">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-white/60 text-xs font-bold uppercase tracking-wider mb-1">Today's Revenue</Text>
                <Text className="text-white text-3xl font-black">{formatCurrency(dashboardData.todayRevenue)}</Text>
              </View>
              <View className="w-14 h-14 bg-emerald-500/20 rounded-2xl justify-center items-center border border-emerald-500/30">
                <Ionicons name="trending-up" size={32} color="#10B981" />
              </View>
            </View>
          </GlassCard>
        </LinearGradient>
      </View>

      <ScrollView
        className="flex-1 -mt-8"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4F46E5" />}
      >
        {/* Quick Actions Grid */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideUpAnim }] }} className="px-6">
          <Text className="text-slate-900 text-xl font-black mb-4">Quick Actions</Text>
          <View className="flex-row flex-wrap justify-between">
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                onPress={() => navigation.navigate(action.screen)}
                className="w-[48%] mb-4"
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={action.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="rounded-3xl p-5"
                  style={{ height: 140 }}
                >
                  <View className="flex-row justify-between items-start mb-4">
                    <View className="w-10 h-10 bg-white/20 rounded-xl justify-center items-center">
                      <MaterialIcons name={action.icon} size={24} color="#ffffff" />
                    </View>
                    {action.count > 0 && (
                      <View className="bg-white/90 px-2 py-1 rounded-lg">
                        <Text className="text-slate-900 text-[10px] font-black">{action.count}</Text>
                      </View>
                    )}
                  </View>
                  <Text className="text-white text-lg font-black">{action.title}</Text>
                  <Text className="text-white/60 text-[10px] font-bold uppercase tracking-tighter">Approvals</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Stats Section */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideUpAnim }] }} className="px-6 mt-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-slate-900 text-xl font-black">Platform Stats</Text>
            <View className="bg-slate-100 px-3 py-1 rounded-full">
              <Text className="text-slate-500 text-[10px] font-bold uppercase">Real-time</Text>
            </View>
          </View>

          <View className="flex-row flex-wrap justify-between">
            {[{ id: 'u', label: 'Users', val: dashboardData.activeUsers, icon: 'people', color: '#6366F1' },
            { id: 'r', label: 'Revenue', val: formatCurrency(dashboardData.totalRevenue), icon: 'wallet', color: '#10B981' }].map(stat => (
              <GlassCard key={stat.id} className="w-[48%] p-4 mb-4 bg-slate-50 border-slate-100">
                <View className="w-10 h-10 rounded-xl bg-white justify-center items-center mb-3 shadow-sm">
                  <Ionicons name={stat.icon} size={20} color={stat.color} />
                </View>
                <Text className="text-slate-400 text-[10px] font-bold uppercase mb-1">{stat.label}</Text>
                <Text className="text-slate-900 text-lg font-black">{stat.val}</Text>
              </GlassCard>
            ))}
          </View>
        </Animated.View>

        {/* Recent Activity */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideUpAnim }] }} className="px-6 mt-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-slate-900 text-xl font-black">Live Activities</Text>
            <TouchableOpacity onPress={() => navigation.navigate('PaymentOverview')}><Text className="text-indigo-600 text-sm font-bold">View All</Text></TouchableOpacity>
          </View>

          <GlassCard className="bg-slate-50 border-slate-100 p-2">
            {dashboardData.recentActivities?.length > 0 ? (
              dashboardData.recentActivities.map((activity, idx) => (
                <View key={activity.id} className={`flex-row items-center p-4 ${idx !== dashboardData.recentActivities.length - 1 ? 'border-b border-slate-100' : ''}`}>
                  <View className="w-10 h-10 rounded-xl bg-white justify-center items-center mr-4 shadow-sm">
                    <MaterialIcons name={activity.icon} size={20} color={activity.color} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-slate-900 text-sm font-bold">{activity.title}</Text>
                    <Text className="text-slate-500 text-[10px]">{activity.description}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
                </View>
              ))
            ) : (
              <View className="py-10 items-center">
                <Ionicons name="notifications-off-outline" size={40} color="#CBD5E1" />
                <Text className="text-slate-400 text-sm font-medium mt-2">No activities yet</Text>
              </View>
            )}
          </GlassCard>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

export default AdminDashboardScreen;
