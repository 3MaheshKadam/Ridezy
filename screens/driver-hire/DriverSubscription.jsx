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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import '../../global.css';

const { width, height } = Dimensions.get('window');

const DriverSubscription = ({ navigation }) => {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(30)).current;
  const modalSlideAnim = useRef(new Animated.Value(height)).current;

  // Mock current subscription data
  useEffect(() => {
    // TODO: Fetch driver's current subscription from API
    setCurrentSubscription({
      planId: '2',
      planName: 'Professional Plan',
      price: 399,
      duration: 'monthly',
      startDate: '2025-01-01',
      expiryDate: '2025-02-01',
      status: 'active',
      autoRenewal: true,
    });
  }, []);

  // Available subscription plans
  const subscriptionPlans = [
    {
      id: '1',
      name: 'Starter Plan',
      price: 199,
      duration: 'monthly',
      description: 'Perfect for new drivers starting out',
      commission: 5,
      features: [
        '5% platform commission',
        'Up to 50 trips per month',
        'Basic analytics dashboard',
        'Standard customer support',
        'Email notifications',
        'Basic driver profile',
      ],
      color: '#3B82F6',
      gradient: ['#3B82F6', '#2563EB'],
    },
    {
      id: '2',
      name: 'Professional Plan',
      price: 399,
      duration: 'monthly',
      description: 'Best for active professional drivers',
      commission: 3,
      features: [
        '3% platform commission',
        'Unlimited trips per month',
        'Advanced analytics & insights',
        'Priority booking algorithm',
        'Priority customer support',
        'Marketing & promotion support',
        'Featured driver badge',
        'SMS + Email notifications',
      ],
      color: '#8B5CF6',
      gradient: ['#8B5CF6', '#7C3AED'],
      popular: true,
    },
    {
      id: '3',
      name: 'Elite Plan',
      price: 699,
      duration: 'monthly',
      description: 'Ultimate plan for top-tier drivers',
      commission: 2,
      features: [
        'Only 2% platform commission',
        'Unlimited premium trips',
        'Premium analytics suite',
        'Highest priority booking',
        '24/7 dedicated support line',
        'Premium marketing exposure',
        'Elite driver badge & perks',
        'All notifications channels',
        'Monthly performance bonus',
        'Exclusive high-value customers',
      ],
      color: '#F59E0B',
      gradient: ['#F59E0B', '#D97706'],
    },
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
  };

  const openConfirmModal = (plan) => {
    setSelectedPlan(plan);
    setShowConfirmModal(true);
    Animated.timing(modalSlideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeConfirmModal = () => {
    Animated.timing(modalSlideAnim, {
      toValue: height,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowConfirmModal(false);
      setSelectedPlan(null);
    });
  };

  const handleSubscribe = () => {
    closeConfirmModal();
    setTimeout(() => {
      setShowPaymentModal(true);
      Animated.timing(modalSlideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }, 300);
  };

  const handlePayment = async (method) => {
    try {
      // TODO: Implement payment gateway integration
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update current subscription
      setCurrentSubscription({
        planId: selectedPlan.id,
        planName: selectedPlan.name,
        price: selectedPlan.price,
        duration: selectedPlan.duration,
        startDate: new Date().toISOString().split('T')[0],
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'active',
        autoRenewal: true,
      });

      Animated.timing(modalSlideAnim, {
        toValue: height,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setShowPaymentModal(false);
        setSelectedPlan(null);
        
        Alert.alert(
          'Success!',
          'Your subscription has been activated successfully.',
          [{ text: 'OK' }]
        );
      });
    } catch (error) {
      Alert.alert('Payment Failed', 'Please try again or use a different payment method.');
    }
  };

  const handleCancelSubscription = () => {
    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel your subscription? You will lose all premium benefits.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              // TODO: API call to cancel subscription
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              setCurrentSubscription({
                ...currentSubscription,
                status: 'cancelled',
                autoRenewal: false,
              });
              
              Alert.alert('Cancelled', 'Your subscription has been cancelled.');
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel subscription.');
            }
          },
        },
      ]
    );
  };

  const getDaysRemaining = () => {
    if (!currentSubscription) return 0;
    const expiry = new Date(currentSubscription.expiryDate);
    const today = new Date();
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const formatCurrency = (amount) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const renderPlanCard = (plan) => {
    const isCurrentPlan = currentSubscription?.planId === plan.id;
    const isUpgrade = currentSubscription && 
      subscriptionPlans.findIndex(p => p.id === currentSubscription.planId) < 
      subscriptionPlans.findIndex(p => p.id === plan.id);

    return (
      <View
        key={plan.id}
        className="mb-6"
      >
        <View className={`bg-white rounded-3xl overflow-hidden shadow-lg shadow-black/10 border-2 ${
          isCurrentPlan ? 'border-accent' : plan.popular ? 'border-purple-200' : 'border-gray-100'
        }`}>
          {plan.popular && !isCurrentPlan && (
            <View className="bg-purple-500 py-2 px-4">
              <Text className="text-white text-sm font-bold text-center">
                ⭐ MOST POPULAR
              </Text>
            </View>
          )}
          
          {isCurrentPlan && (
            <View className="bg-accent py-2 px-4">
              <Text className="text-white text-sm font-bold text-center">
                ✓ YOUR CURRENT PLAN
              </Text>
            </View>
          )}

          <View className="p-6">
            {/* Plan Header */}
            <View className="items-center mb-6">
              <View
                className="w-16 h-16 rounded-2xl justify-center items-center mb-4"
                style={{ backgroundColor: `${plan.color}15` }}
              >
                <Ionicons name="car-sport" size={32} color={plan.color} />
              </View>
              <Text className="text-primary text-2xl font-bold mb-2">
                {plan.name}
              </Text>
              <Text className="text-secondary text-sm text-center mb-4">
                {plan.description}
              </Text>
              
              {/* Price */}
              <View className="items-center">
                <View className="flex-row items-end">
                  <Text className="text-primary text-4xl font-bold">
                    {formatCurrency(plan.price)}
                  </Text>
                  <Text className="text-secondary text-lg mb-1 ml-2">
                    /{plan.duration}
                  </Text>
                </View>
                <View className="bg-green-50 px-3 py-1 rounded-full mt-2">
                  <Text className="text-green-600 text-sm font-semibold">
                    Only {plan.commission}% Commission
                  </Text>
                </View>
              </View>
            </View>

            {/* Features */}
            <View className="mb-6">
              <Text className="text-primary text-base font-bold mb-3">
                What's Included:
              </Text>
              {plan.features.map((feature, index) => (
                <View key={index} className="flex-row items-center mb-3">
                  <View className="w-6 h-6 bg-accent/10 rounded-full justify-center items-center mr-3">
                    <Ionicons name="checkmark" size={14} color="#00C851" />
                  </View>
                  <Text className="text-secondary text-sm flex-1">
                    {feature}
                  </Text>
                </View>
              ))}
            </View>

            {/* Action Button */}
            {isCurrentPlan ? (
              <View className="space-y-3">
                <View className="bg-gray-50 rounded-2xl p-4">
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-secondary text-sm">Status</Text>
                    <View className="bg-green-50 px-3 py-1 rounded-full">
                      <Text className="text-green-600 text-xs font-semibold">
                        {currentSubscription.status}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-secondary text-sm">Expires in</Text>
                    <Text className="text-primary text-sm font-bold">
                      {getDaysRemaining()} days
                    </Text>
                  </View>
                </View>
                
                <TouchableOpacity
                  onPress={handleCancelSubscription}
                  className="bg-red-50 rounded-2xl py-4 justify-center items-center border border-red-200"
                  activeOpacity={0.8}
                >
                  <Text className="text-red-600 text-base font-semibold">
                    Cancel Subscription
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => openConfirmModal(plan)}
                activeOpacity={0.8}
                className="rounded-2xl overflow-hidden"
              >
                <LinearGradient
                  colors={plan.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    borderRadius: 16,
                    paddingVertical: 16,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Text className="text-white text-lg font-bold">
                    {isUpgrade ? 'Upgrade Plan' : 'Subscribe Now'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />

      {/* Header */}
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
            <Text className="text-primary text-lg font-semibold">
              Subscription Plans
            </Text>
          </View>

          <TouchableOpacity
            className="w-10 h-10 bg-gray-100 rounded-2xl justify-center items-center"
            activeOpacity={0.7}
          >
            <Ionicons name="information-circle" size={20} color="#1A1B23" />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16 }}
      >
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideUpAnim }],
          }}
        >
          {/* Info Card */}
          <View className="bg-blue-50 rounded-2xl p-4 mb-6 border border-blue-100">
            <View className="flex-row items-start">
              <View className="w-10 h-10 bg-blue-100 rounded-xl justify-center items-center mr-3">
                <Ionicons name="information" size={20} color="#3B82F6" />
              </View>
              <View className="flex-1">
                <Text className="text-blue-900 text-sm font-semibold mb-1">
                  Why Subscribe?
                </Text>
                <Text className="text-blue-700 text-xs">
                  Lower commission rates, priority bookings, and exclusive perks to maximize your earnings!
                </Text>
              </View>
            </View>
          </View>

          {/* Current Subscription Summary */}
          {currentSubscription && currentSubscription.status === 'active' && (
            <View className="bg-white rounded-2xl p-4 mb-6 shadow-sm shadow-black/5">
              <Text className="text-primary text-base font-bold mb-3">
                Current Subscription
              </Text>
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-primary text-lg font-bold mb-1">
                    {currentSubscription.planName}
                  </Text>
                  <Text className="text-secondary text-sm">
                    Expires on {new Date(currentSubscription.expiryDate).toLocaleDateString()}
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="text-accent text-xl font-bold">
                    {getDaysRemaining()}
                  </Text>
                  <Text className="text-secondary text-xs">days left</Text>
                </View>
              </View>
            </View>
          )}

          {/* Plans */}
          <Text className="text-primary text-xl font-bold mb-4">
            Choose Your Plan
          </Text>

          {subscriptionPlans.map(renderPlanCard)}

          {/* Benefits Section */}
          <View className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-6 mb-6">
            <Text className="text-primary text-lg font-bold mb-4">
              Premium Benefits
            </Text>
            <View className="space-y-3">
              <View className="flex-row items-center">
                <Ionicons name="trending-up" size={20} color="#8B5CF6" />
                <Text className="text-secondary text-sm ml-3 flex-1">
                  Earn more with reduced commission rates
                </Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="notifications" size={20} color="#8B5CF6" />
                <Text className="text-secondary text-sm ml-3 flex-1">
                  Get priority notifications for high-value trips
                </Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="analytics" size={20} color="#8B5CF6" />
                <Text className="text-secondary text-sm ml-3 flex-1">
                  Access detailed analytics and earnings insights
                </Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="star" size={20} color="#8B5CF6" />
                <Text className="text-secondary text-sm ml-3 flex-1">
                  Stand out with premium badges and profile features
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Confirm Subscription Modal */}
      <Modal
        visible={showConfirmModal}
        transparent={true}
        animationType="none"
        onRequestClose={closeConfirmModal}
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
                Confirm Subscription
              </Text>
            </View>

            {selectedPlan && (
              <>
                <View className="bg-gray-50 rounded-2xl p-4 mb-6">
                  <View className="flex-row items-center justify-between mb-3">
                    <Text className="text-secondary text-sm">Plan</Text>
                    <Text className="text-primary text-base font-bold">
                      {selectedPlan.name}
                    </Text>
                  </View>
                  <View className="flex-row items-center justify-between mb-3">
                    <Text className="text-secondary text-sm">Duration</Text>
                    <Text className="text-primary text-base font-medium capitalize">
                      {selectedPlan.duration}
                    </Text>
                  </View>
                  <View className="flex-row items-center justify-between mb-3">
                    <Text className="text-secondary text-sm">Commission Rate</Text>
                    <Text className="text-accent text-base font-bold">
                      {selectedPlan.commission}%
                    </Text>
                  </View>
                  <View className="h-px bg-gray-200 my-2" />
                  <View className="flex-row items-center justify-between">
                    <Text className="text-primary text-base font-semibold">
                      Total Amount
                    </Text>
                    <Text className="text-primary text-2xl font-bold">
                      {formatCurrency(selectedPlan.price)}
                    </Text>
                  </View>
                </View>

                <View className="flex-row space-x-3">
                  <TouchableOpacity
                    onPress={closeConfirmModal}
                    className="flex-1 bg-gray-200 rounded-2xl py-4 justify-center items-center"
                    activeOpacity={0.8}
                  >
                    <Text className="text-primary text-base font-semibold">
                      Cancel
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleSubscribe}
                    activeOpacity={0.8}
                    className="flex-1 rounded-2xl overflow-hidden"
                  >
                    <LinearGradient
                      colors={selectedPlan.gradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{
                        borderRadius: 16,
                        paddingVertical: 16,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <Text className="text-white text-base font-bold">
                        Proceed to Pay
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </Animated.View>
        </View>
      </Modal>

      {/* Payment Modal */}
      <Modal
        visible={showPaymentModal}
        transparent={true}
        animationType="none"
        onRequestClose={() => setShowPaymentModal(false)}
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
                Select Payment Method
              </Text>
            </View>

            {selectedPlan && (
              <View className="bg-gray-50 rounded-2xl p-4 mb-6">
                <View className="flex-row items-center justify-between">
                  <Text className="text-secondary text-sm">Amount to Pay</Text>
                  <Text className="text-primary text-2xl font-bold">
                    {formatCurrency(selectedPlan.price)}
                  </Text>
                </View>
              </View>
            )}

            <View className="space-y-3 mb-6">
              <TouchableOpacity
                onPress={() => handlePayment('upi')}
                className="bg-white border-2 border-gray-200 rounded-2xl p-4 flex-row items-center"
                activeOpacity={0.8}
              >
                <View className="w-12 h-12 bg-purple-50 rounded-xl justify-center items-center mr-4">
                  <Ionicons name="phone-portrait" size={24} color="#8B5CF6" />
                </View>
                <View className="flex-1">
                  <Text className="text-primary text-base font-bold">UPI</Text>
                  <Text className="text-secondary text-xs">
                    Google Pay, PhonePe, Paytm
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#6C757D" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handlePayment('card')}
                className="bg-white border-2 border-gray-200 rounded-2xl p-4 flex-row items-center"
                activeOpacity={0.8}
              >
                <View className="w-12 h-12 bg-blue-50 rounded-xl justify-center items-center mr-4">
                  <Ionicons name="card" size={24} color="#3B82F6" />
                </View>
                <View className="flex-1">
                  <Text className="text-primary text-base font-bold">
                    Credit / Debit Card
                  </Text>
                  <Text className="text-secondary text-xs">
                    Visa, Mastercard, Rupay
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#6C757D" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handlePayment('netbanking')}
                className="bg-white border-2 border-gray-200 rounded-2xl p-4 flex-row items-center"
                activeOpacity={0.8}
              >
                <View className="w-12 h-12 bg-green-50 rounded-xl justify-center items-center mr-4">
                  <Ionicons name="business" size={24} color="#10B981" />
                </View>
                <View className="flex-1">
                  <Text className="text-primary text-base font-bold">
                    Net Banking
                  </Text>
                  <Text className="text-secondary text-xs">
                    All major banks
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#6C757D" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => {
                Animated.timing(modalSlideAnim, {
                  toValue: height,
                  duration: 300,
                  useNativeDriver: true,
                }).start(() => {
                  setShowPaymentModal(false);
                });
              }}
              className="bg-gray-200 rounded-2xl py-4 justify-center items-center"
              activeOpacity={0.8}
            >
              <Text className="text-primary text-base font-semibold">
                Cancel
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

export default DriverSubscription;