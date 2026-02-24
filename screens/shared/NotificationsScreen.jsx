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
import { useNotifications } from '../../context/NotificationContext';

const { width, height } = Dimensions.get('window');

const NotificationsScreen = ({ navigation }) => {
  const { notifications, fetchNotifications, markAsRead, loading } = useNotifications();
  const [selectedTab, setSelectedTab] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    bookings: true,
    trips: true,
    payments: true,
    promotions: true,
    system: true,
  });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(30)).current;

  // Derive tabs from real data
  const notificationsData = {
    all: notifications,
    booking: notifications.filter(n => n.type === 'booking'),
    trip: notifications.filter(n => n.type === 'trip'),
    payment: notifications.filter(n => n.type === 'payment'),
    promotion: notifications.filter(n => n.type === 'promotion'),
    system: notifications.filter(n => n.type === 'system'),
  };

  // No need for separate filter lines, done in notificationsData definition

  const tabs = [
    { id: 'all', label: 'All', count: notificationsData.all.length },
    { id: 'booking', label: 'Bookings', count: notificationsData.booking.length },
    { id: 'trip', label: 'Trips', count: notificationsData.trip.length },
    { id: 'payment', label: 'Payments', count: notificationsData.payment.length },
    { id: 'promotion', label: 'Offers', count: notificationsData.promotion.length },
  ];

  useEffect(() => {
    startAnimations();
    fetchNotifications();
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
    // TODO: Refresh notifications from API
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleNotificationAction = (notification) => {
    switch (notification.actionType) {
      case 'booking_details':
        navigation.navigate('BookingDetails', { bookingId: notification.data.bookingId });
        break;
      case 'track_trip':
        navigation.navigate('TripTracking', { tripId: notification.data.tripId });
        break;
      case 'payment_receipt':
        Alert.alert('Payment Receipt', 'Receipt details will be shown here');
        break;
      case 'use_promo':
        Alert.alert('Promo Code', `Use code: ${notification.data.promoCode}`);
        break;
      case 'app_update':
        Alert.alert('Update App', 'Redirecting to app store...');
        break;
      case 'rate_driver':
        Alert.alert('Rate Driver', 'Rating interface will be shown here');
        break;
      default:
        Alert.alert('Action', 'This action will be implemented');
    }

    // Mark notification as read
    markAsRead(notification._id);
  };

  // Removed duplicate markAsRead and markAllAsRead - now using context

  const markAllAsReadAction = () => {
    Alert.alert(
      'Mark All as Read',
      'Are you sure you want to mark all notifications as read?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark All',
          onPress: () => {
            markAsRead('all');
          }
        }
      ]
    );
  };


  const clearAllNotifications = () => {
    Alert.alert(
      'Clear All Notifications',
      'This will permanently delete all your notifications. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => {
            // TODO: Clear all notifications via API
            Alert.alert('Success', 'All notifications cleared');
          }
        }
      ]
    );
  };

  const toggleNotificationSetting = (setting) => {
    setNotificationSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));

    // TODO: Update notification settings via API
    Alert.alert('Settings Updated', `${setting} notifications ${!notificationSettings[setting] ? 'enabled' : 'disabled'}`);
  };

  const getPriorityColor = (priority) => {
    const colors = {
      high: '#dc2626',
      medium: '#F59E0B',
      low: '#6C757D',
    };
    return colors[priority] || '#6C757D';
  };

  const getUnreadCount = () => {
    return notificationsData[selectedTab]?.filter(n => !n.read).length || 0;
  };

  const renderNotificationCard = ({ item }) => (
    <TouchableOpacity
      onPress={() => {
        if (item.actionable) {
          handleNotificationAction(item);
        } else {
          markAsRead(item._id);
        }
      }}
      activeOpacity={0.8}
      className={`bg-white rounded-2xl mx-4 mb-3 shadow-sm shadow-black/5 border ${item.read ? 'border-gray-100' : 'border-accent/20 bg-accent/5'
        } overflow-hidden`}
    >
      <View className="p-4">
        <View className="flex-row items-start">
          {/* Icon */}
          <View
            className="w-12 h-12 rounded-2xl justify-center items-center mr-4"
            style={{ backgroundColor: item.iconBg + '20' }}
          >
            <Ionicons name={item.icon} size={20} color={item.iconBg} />
          </View>

          {/* Content */}
          <View className="flex-1">
            <View className="flex-row items-start justify-between mb-2">
              <Text className={`text-primary text-base font-semibold flex-1 ${!item.read ? 'font-bold' : ''
                }`}>
                {item.title}
              </Text>

              <View className="flex-row items-center ml-2">
                {/* Priority indicator */}
                <View
                  className="w-2 h-2 rounded-full mr-2"
                  style={{ backgroundColor: getPriorityColor(item.priority) }}
                />

                {/* Unread indicator */}
                {!item.read && (
                  <View className="w-2 h-2 bg-accent rounded-full mr-2" />
                )}

                <Text className="text-secondary text-xs">
                  {item.time}
                </Text>
              </View>
            </View>

            <Text className={`text-secondary text-sm leading-5 mb-3 ${!item.read ? 'font-medium' : ''
              }`}>
              {item.message}
            </Text>

            {/* Action Button */}
            {item.actionable && (
              <TouchableOpacity
                onPress={() => handleNotificationAction(item)}
                className="bg-accent/10 px-4 py-2 rounded-xl self-start"
                activeOpacity={0.8}
              >
                <Text className="text-accent text-sm font-semibold">
                  {item.action}
                </Text>
              </TouchableOpacity>
            )}
          </View>
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
            <Text className="text-primary text-lg font-semibold">Notifications</Text>
            {getUnreadCount() > 0 && (
              <Text className="text-secondary text-sm">
                {getUnreadCount()} unread
              </Text>
            )}
          </View>

          <TouchableOpacity
            onPress={markAllAsReadAction}
            className="w-10 h-10 bg-gray-100 rounded-2xl justify-center items-center"
            activeOpacity={0.7}
          >
            <Ionicons name="checkmark-done" size={20} color="#1A1B23" />
          </TouchableOpacity>
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

      {/* Notifications List */}
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideUpAnim }],
        }}
        className="flex-1 mt-4"
      >
        <FlatList
          data={notificationsData[selectedTab] || []}
          renderItem={renderNotificationCard}
          keyExtractor={(item) => item._id}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={
            <View className="items-center justify-center py-12">
              <View className="w-16 h-16 bg-gray-100 rounded-full justify-center items-center mb-4">
                <Ionicons name="notifications-outline" size={32} color="#6C757D" />
              </View>
              <Text className="text-primary text-lg font-semibold mb-2">
                No notifications
              </Text>
              <Text className="text-secondary text-sm text-center">
                {selectedTab === 'all' ?
                  'You have no notifications at the moment' :
                  `No ${selectedTab} notifications found`}
              </Text>
            </View>
          }
        />
      </Animated.View>

      {/* Action Buttons */}
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideUpAnim }],
        }}
        className="bg-white border-t border-gray-200 px-6 py-4"
      >
        <View className="flex-row space-x-3">
          <TouchableOpacity
            onPress={() => Alert.alert('Settings', 'Notification settings will be shown here')}
            className="flex-1 bg-gray-100 rounded-2xl py-3 flex-row justify-center items-center"
            activeOpacity={0.8}
          >
            <Ionicons name="settings" size={18} color="#6C757D" />
            <Text className="text-secondary text-base font-semibold ml-2">
              Settings
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={clearAllNotifications}
            className="flex-1 bg-red-100 rounded-2xl py-3 flex-row justify-center items-center"
            activeOpacity={0.8}
          >
            <Ionicons name="trash" size={18} color="#dc2626" />
            <Text className="text-red-600 text-base font-semibold ml-2">
              Clear All
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};

export default NotificationsScreen;