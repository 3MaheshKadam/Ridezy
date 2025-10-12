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
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import '../../global.css';

const { width, height } = Dimensions.get('window');

const PaymentOverviewScreen = ({ navigation }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('month'); // week, month, year
  const [refreshing, setRefreshing] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(30)).current;
  const modalSlideAnim = useRef(new Animated.Value(height)).current;

  // Mock payment data
  const [paymentData, setPaymentData] = useState({
    totalRevenue: 1245680,
    todayRevenue: 28450,
    weekRevenue: 156780,
    monthRevenue: 645890,
    yearRevenue: 5678900,
    pendingPayments: 45600,
    
    // Revenue by source
    ownerRevenue: 567890,
    driverRevenue: 345670,
    carwashRevenue: 332120,
    
    // Subscription stats
    activeSubscriptions: 256,
    expiringThisWeek: 12,
    expiringThisMonth: 45,
    renewalRate: 85.5,
  });

  // Recent transactions
  const [transactions, setTransactions] = useState([
    {
      id: '1',
      type: 'subscription',
      source: 'owner',
      userName: 'Amit Sharma',
      planName: 'Premium Plan',
      amount: 599,
      date: '2025-01-12T10:30:00',
      status: 'completed',
      paymentMethod: 'UPI',
      transactionId: 'TXN1234567890',
    },
    {
      id: '2',
      type: 'subscription',
      source: 'carwash',
      userName: 'Sparkle Auto Wash',
      planName: 'Business Plan',
      amount: 1999,
      date: '2025-01-12T09:15:00',
      status: 'completed',
      paymentMethod: 'Card',
      transactionId: 'TXN1234567891',
    },
    {
      id: '3',
      type: 'subscription',
      source: 'driver',
      userName: 'Rajesh Kumar',
      planName: 'Professional Plan',
      amount: 399,
      date: '2025-01-11T18:45:00',
      status: 'completed',
      paymentMethod: 'Net Banking',
      transactionId: 'TXN1234567892',
    },
    {
      id: '4',
      type: 'renewal',
      source: 'owner',
      userName: 'Priya Deshmukh',
      planName: 'Elite Plan',
      amount: 999,
      date: '2025-01-11T14:20:00',
      status: 'completed',
      paymentMethod: 'UPI',
      transactionId: 'TXN1234567893',
    },
    {
      id: '5',
      type: 'subscription',
      source: 'driver',
      userName: 'Suresh Patel',
      planName: 'Starter Plan',
      amount: 199,
      date: '2025-01-11T11:30:00',
      status: 'pending',
      paymentMethod: 'UPI',
      transactionId: 'TXN1234567894',
    },
  ]);

  // Expiring subscriptions
  const [expiringSubscriptions, setExpiringSubscriptions] = useState([
    {
      id: '1',
      userName: 'Vikram Singh',
      userType: 'owner',
      planName: 'Premium Plan',
      expiryDate: '2025-01-15',
      amount: 599,
      autoRenewal: true,
    },
    {
      id: '2',
      userName: 'Elite Car Care',
      userType: 'carwash',
      planName: 'Business Plan',
      expiryDate: '2025-01-16',
      amount: 1999,
      autoRenewal: false,
    },
    {
      id: '3',
      userName: 'Manish Joshi',
      userType: 'driver',
      planName: 'Professional Plan',
      expiryDate: '2025-01-18',
      amount: 399,
      autoRenewal: true,
    },
  ]);

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
    // TODO: Fetch latest payment data
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const formatCurrency = (amount) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffTime / (1000 * 60));
        return `${diffMinutes} min ago`;
      }
      return `${diffHours} hours ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getDaysUntilExpiry = (expiryDate) => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getSourceIcon = (source) => {
    switch (source) {
      case 'owner':
        return { icon: 'person', color: '#3B82F6', bg: '#EFF6FF' };
      case 'driver':
        return { icon: 'car-sport', color: '#8B5CF6', bg: '#F5F3FF' };
      case 'carwash':
        return { icon: 'car-wash', color: '#10B981', bg: '#ECFDF5' };
      default:
        return { icon: 'cash', color: '#6C757D', bg: '#F9FAFB' };
    }
  };

  const openTransactionModal = (transaction) => {
    setSelectedTransaction(transaction);
    setShowTransactionModal(true);
    Animated.timing(modalSlideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeTransactionModal = () => {
    Animated.timing(modalSlideAnim, {
      toValue: height,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowTransactionModal(false);
      setSelectedTransaction(null);
    });
  };

  const getRevenueByPeriod = () => {
    switch (selectedPeriod) {
      case 'week':
        return paymentData.weekRevenue;
      case 'month':
        return paymentData.monthRevenue;
      case 'year':
        return paymentData.yearRevenue;
      default:
        return paymentData.monthRevenue;
    }
  };

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
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="w-10 h-10 bg-white/10 rounded-2xl justify-center items-center"
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={20} color="#ffffff" />
            </TouchableOpacity>

            <View className="flex-1 items-center">
              <Text className="text-white text-lg font-semibold">Payment Overview</Text>
            </View>

            <TouchableOpacity
              className="w-10 h-10 bg-white/10 rounded-2xl justify-center items-center"
              activeOpacity={0.7}
            >
              <Ionicons name="download" size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {/* Total Revenue Card */}
          <View className="bg-white/10 rounded-2xl p-4 backdrop-blur-lg">
            <Text className="text-white/60 text-sm mb-2">Total Revenue</Text>
            <Text className="text-white text-3xl font-bold mb-3">
              {formatCurrency(paymentData.totalRevenue)}
            </Text>
            
            <View className="flex-row items-center">
              <View className="bg-green-500/20 px-3 py-1 rounded-full mr-2">
                <View className="flex-row items-center">
                  <Ionicons name="trending-up" size={12} color="#10B981" />
                  <Text className="text-green-400 text-xs font-semibold ml-1">
                    +12.5%
                  </Text>
                </View>
              </View>
              <Text className="text-white/60 text-xs">vs last month</Text>
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
        {/* Period Selector */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideUpAnim }],
          }}
          className="px-4 mt-4"
        >
          <View className="flex-row bg-white rounded-2xl p-1 shadow-sm shadow-black/5">
            {['week', 'month', 'year'].map((period) => (
              <TouchableOpacity
                key={period}
                onPress={() => setSelectedPeriod(period)}
                className={`flex-1 py-2 rounded-xl ${
                  selectedPeriod === period ? 'bg-accent' : ''
                }`}
                activeOpacity={0.8}
              >
                <Text
                  className={`text-sm font-semibold text-center capitalize ${
                    selectedPeriod === period ? 'text-white' : 'text-secondary'
                  }`}
                >
                  {period}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Revenue by Source */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideUpAnim }],
          }}
          className="px-4 mt-6"
        >
          <Text className="text-primary text-lg font-bold mb-4">
            Revenue by Source
          </Text>

          <View className="bg-white rounded-2xl p-4 shadow-sm shadow-black/5 mb-4">
            {/* Car Owners */}
            <View className="flex-row items-center mb-4">
              <View className="w-12 h-12 bg-blue-50 rounded-2xl justify-center items-center mr-3">
                <Ionicons name="person" size={20} color="#3B82F6" />
              </View>
              <View className="flex-1">
                <Text className="text-primary text-sm font-semibold mb-1">
                  Car Owners
                </Text>
                <View className="flex-row items-center">
                  <View className="flex-1 h-2 bg-gray-100 rounded-full mr-3">
                    <View
                      className="h-2 bg-blue-500 rounded-full"
                      style={{
                        width: `${(paymentData.ownerRevenue / paymentData.totalRevenue) * 100}%`,
                      }}
                    />
                  </View>
                  <Text className="text-secondary text-xs">
                    {((paymentData.ownerRevenue / paymentData.totalRevenue) * 100).toFixed(1)}%
                  </Text>
                </View>
              </View>
              <Text className="text-primary text-base font-bold ml-2">
                {formatCurrency(paymentData.ownerRevenue)}
              </Text>
            </View>

            {/* Drivers */}
            <View className="flex-row items-center mb-4">
              <View className="w-12 h-12 bg-purple-50 rounded-2xl justify-center items-center mr-3">
                <Ionicons name="car-sport" size={20} color="#8B5CF6" />
              </View>
              <View className="flex-1">
                <Text className="text-primary text-sm font-semibold mb-1">
                  Drivers
                </Text>
                <View className="flex-row items-center">
                  <View className="flex-1 h-2 bg-gray-100 rounded-full mr-3">
                    <View
                      className="h-2 bg-purple-500 rounded-full"
                      style={{
                        width: `${(paymentData.driverRevenue / paymentData.totalRevenue) * 100}%`,
                      }}
                    />
                  </View>
                  <Text className="text-secondary text-xs">
                    {((paymentData.driverRevenue / paymentData.totalRevenue) * 100).toFixed(1)}%
                  </Text>
                </View>
              </View>
              <Text className="text-primary text-base font-bold ml-2">
                {formatCurrency(paymentData.driverRevenue)}
              </Text>
            </View>

            {/* Car Wash Centers */}
            <View className="flex-row items-center">
              <View className="w-12 h-12 bg-green-50 rounded-2xl justify-center items-center mr-3">
                <MaterialIcons name="car-wash" size={20} color="#10B981" />
              </View>
              <View className="flex-1">
                <Text className="text-primary text-sm font-semibold mb-1">
                  Car Wash Centers
                </Text>
                <View className="flex-row items-center">
                  <View className="flex-1 h-2 bg-gray-100 rounded-full mr-3">
                    <View
                      className="h-2 bg-green-500 rounded-full"
                      style={{
                        width: `${(paymentData.carwashRevenue / paymentData.totalRevenue) * 100}%`,
                      }}
                    />
                  </View>
                  <Text className="text-secondary text-xs">
                    {((paymentData.carwashRevenue / paymentData.totalRevenue) * 100).toFixed(1)}%
                  </Text>
                </View>
              </View>
              <Text className="text-primary text-base font-bold ml-2">
                {formatCurrency(paymentData.carwashRevenue)}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Subscription Stats */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideUpAnim }],
          }}
          className="px-4 mt-2"
        >
          <Text className="text-primary text-lg font-bold mb-4">
            Subscription Statistics
          </Text>

          <View className="flex-row justify-between mb-4">
            <View className="flex-1 bg-white rounded-2xl p-4 shadow-sm shadow-black/5 mr-2">
              <View className="w-10 h-10 bg-green-50 rounded-xl justify-center items-center mb-2">
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              </View>
              <Text className="text-secondary text-xs mb-1">Active</Text>
              <Text className="text-primary text-2xl font-bold">
                {paymentData.activeSubscriptions}
              </Text>
            </View>

            <View className="flex-1 bg-white rounded-2xl p-4 shadow-sm shadow-black/5 ml-2">
              <View className="w-10 h-10 bg-yellow-50 rounded-xl justify-center items-center mb-2">
                <Ionicons name="time" size={20} color="#F59E0B" />
              </View>
              <Text className="text-secondary text-xs mb-1">Expiring Soon</Text>
              <Text className="text-primary text-2xl font-bold">
                {paymentData.expiringThisMonth}
              </Text>
            </View>
          </View>

          <View className="flex-row justify-between">
            <View className="flex-1 bg-white rounded-2xl p-4 shadow-sm shadow-black/5 mr-2">
              <View className="w-10 h-10 bg-blue-50 rounded-xl justify-center items-center mb-2">
                <Ionicons name="refresh" size={20} color="#3B82F6" />
              </View>
              <Text className="text-secondary text-xs mb-1">Renewal Rate</Text>
              <Text className="text-primary text-2xl font-bold">
                {paymentData.renewalRate}%
              </Text>
            </View>

            <View className="flex-1 bg-white rounded-2xl p-4 shadow-sm shadow-black/5 ml-2">
              <View className="w-10 h-10 bg-orange-50 rounded-xl justify-center items-center mb-2">
                <Ionicons name="hourglass" size={20} color="#F97316" />
              </View>
              <Text className="text-secondary text-xs mb-1">Pending</Text>
              <Text className="text-primary text-2xl font-bold">
                {formatCurrency(paymentData.pendingPayments)}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Expiring Subscriptions */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideUpAnim }],
          }}
          className="px-4 mt-6"
        >
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-primary text-lg font-bold">
              Expiring This Week
            </Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text className="text-accent text-sm font-semibold">View All</Text>
            </TouchableOpacity>
          </View>

          <View className="bg-white rounded-2xl p-4 shadow-sm shadow-black/5">
            {expiringSubscriptions.map((subscription, index) => {
              const daysLeft = getDaysUntilExpiry(subscription.expiryDate);
              const sourceStyle = getSourceIcon(subscription.userType);

              return (
                <View key={subscription.id}>
                  <View className="flex-row items-center py-3">
                    <View
                      className="w-12 h-12 rounded-2xl justify-center items-center mr-3"
                      style={{ backgroundColor: sourceStyle.bg }}
                    >
                      <Ionicons name={sourceStyle.icon} size={20} color={sourceStyle.color} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-primary text-sm font-semibold mb-1">
                        {subscription.userName}
                      </Text>
                      <Text className="text-secondary text-xs mb-1">
                        {subscription.planName}
                      </Text>
                      <View className="flex-row items-center">
                        <View
                          className={`px-2 py-1 rounded-full ${
                            daysLeft <= 3 ? 'bg-red-50' : 'bg-yellow-50'
                          }`}
                        >
                          <Text
                            className={`text-xs font-semibold ${
                              daysLeft <= 3 ? 'text-red-600' : 'text-yellow-600'
                            }`}
                          >
                            {daysLeft} days left
                          </Text>
                        </View>
                        {subscription.autoRenewal && (
                          <View className="bg-green-50 px-2 py-1 rounded-full ml-2">
                            <Text className="text-green-600 text-xs font-semibold">
                              Auto-renewal
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <Text className="text-primary text-base font-bold">
                      {formatCurrency(subscription.amount)}
                    </Text>
                  </View>
                  {index < expiringSubscriptions.length - 1 && (
                    <View className="h-px bg-gray-100" />
                  )}
                </View>
              );
            })}
          </View>
        </Animated.View>

        {/* Recent Transactions */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideUpAnim }],
          }}
          className="px-4 mt-6 mb-6"
        >
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-primary text-lg font-bold">
              Recent Transactions
            </Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text className="text-accent text-sm font-semibold">View All</Text>
            </TouchableOpacity>
          </View>

          <View className="bg-white rounded-2xl p-4 shadow-sm shadow-black/5">
            {transactions.map((transaction, index) => {
              const sourceStyle = getSourceIcon(transaction.source);

              return (
                <TouchableOpacity
                  key={transaction.id}
                  onPress={() => openTransactionModal(transaction)}
                  activeOpacity={0.8}
                >
                  <View className="flex-row items-center py-3">
                    <View
                      className="w-12 h-12 rounded-2xl justify-center items-center mr-3"
                      style={{ backgroundColor: sourceStyle.bg }}
                    >
                      <Ionicons name={sourceStyle.icon} size={20} color={sourceStyle.color} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-primary text-sm font-semibold mb-1">
                        {transaction.userName}
                      </Text>
                      <Text className="text-secondary text-xs mb-1">
                        {transaction.planName}
                      </Text>
                      <Text className="text-secondary text-xs">
                        {formatDate(transaction.date)}
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-primary text-base font-bold mb-1">
                        {formatCurrency(transaction.amount)}
                      </Text>
                      <View
                        className={`px-2 py-1 rounded-full ${
                          transaction.status === 'completed'
                            ? 'bg-green-50'
                            : transaction.status === 'pending'
                            ? 'bg-yellow-50'
                            : 'bg-red-50'
                        }`}
                      >
                        <Text
                          className={`text-xs font-semibold capitalize ${
                            transaction.status === 'completed'
                              ? 'text-green-600'
                              : transaction.status === 'pending'
                              ? 'text-yellow-600'
                              : 'text-red-600'
                          }`}
                        >
                          {transaction.status}
                        </Text>
                      </View>
                    </View>
                  </View>
                  {index < transactions.length - 1 && (
                    <View className="h-px bg-gray-100" />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </ScrollView>

      {/* Transaction Details Modal */}
      <Modal
        visible={showTransactionModal}
        transparent={true}
        animationType="none"
        onRequestClose={closeTransactionModal}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <Animated.View
            style={{
              transform: [{ translateY: modalSlideAnim }],
            }}
            className="bg-white rounded-t-3xl p-6"
          >
            <View className="items-center mb-6">
              <View className="w-12 h-1 bg-gray-300 rounded-full mb-4" />
              <Text className="text-primary text-xl font-bold">
                Transaction Details
              </Text>
            </View>

            {selectedTransaction && (
              <>
                {/* Status */}
                <View className="items-center mb-6">
                  <View
                    className={`w-20 h-20 rounded-full justify-center items-center mb-3 ${
                      selectedTransaction.status === 'completed'
                        ? 'bg-green-50'
                        : 'bg-yellow-50'
                    }`}
                  >
                    <Ionicons
                      name={
                        selectedTransaction.status === 'completed'
                          ? 'checkmark-circle'
                          : 'time'
                      }
                      size={40}
                      color={
                        selectedTransaction.status === 'completed'
                          ? '#10B981'
                          : '#F59E0B'
                      }
                    />
                  </View>
                  <Text className="text-primary text-3xl font-bold mb-2">
                    {formatCurrency(selectedTransaction.amount)}
                  </Text>
                  <View
                    className={`px-3 py-1 rounded-full ${
                      selectedTransaction.status === 'completed'
                        ? 'bg-green-50'
                        : 'bg-yellow-50'
                    }`}
                  >
                    <Text
                      className={`text-sm font-semibold capitalize ${
                        selectedTransaction.status === 'completed'
                          ? 'text-green-600'
                          : 'text-yellow-600'
                      }`}
                    >
                      {selectedTransaction.status}
                    </Text>
                  </View>
                </View>

                {/* Transaction Info */}
                <View className="bg-gray-50 rounded-2xl p-4 mb-4">
                  <View className="flex-row justify-between mb-3">
                    <Text className="text-secondary text-sm">User Name</Text>
                    <Text className="text-primary text-sm font-medium">
                      {selectedTransaction.userName}
                    </Text>
                  </View>
                  <View className="flex-row justify-between mb-3">
                    <Text className="text-secondary text-sm">Plan</Text>
                    <Text className="text-primary text-sm font-medium">
                      {selectedTransaction.planName}
                    </Text>
                  </View>
                  <View className="flex-row justify-between mb-3">
                    <Text className="text-secondary text-sm">Type</Text>
                    <Text className="text-primary text-sm font-medium capitalize">
                      {selectedTransaction.type}
                    </Text>
                  </View>
                  <View className="flex-row justify-between mb-3">
                    <Text className="text-secondary text-sm">Payment Method</Text>
                    <Text className="text-primary text-sm font-medium">
                      {selectedTransaction.paymentMethod}
                    </Text>
                  </View>
                  <View className="flex-row justify-between mb-3">
                    <Text className="text-secondary text-sm">Transaction ID</Text>
                    <Text className="text-primary text-sm font-medium">
                      {selectedTransaction.transactionId}
                    </Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-secondary text-sm">Date & Time</Text>
                    <Text className="text-primary text-sm font-medium">
                      {new Date(selectedTransaction.date).toLocaleString()}
                    </Text>
                  </View>
                </View>

                {/* Close Button */}
                <TouchableOpacity
                  onPress={closeTransactionModal}
                  className="bg-gray-200 rounded-2xl py-4 justify-center items-center"
                  activeOpacity={0.8}
                >
                  <Text className="text-primary text-base font-semibold">Close</Text>
                </TouchableOpacity>
              </>
            )}
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

export default PaymentOverviewScreen;