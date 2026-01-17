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
import { get, post } from '../../lib/api';
import { endpoints } from '../../config/apiConfig';
import '../../global.css';

const { width, height } = Dimensions.get('window');

const SubscriptionScreen = ({ navigation }) => {
  const [selectedPlan, setSelectedPlan] = useState('premium');
  const [currentPlan, setCurrentPlan] = useState('premium');
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(30)).current;
  const modalSlideAnim = useRef(new Animated.Value(height)).current;

  const [currentSubscription, setCurrentSubscription] = useState({
    plan: 'Basic',
    status: 'Active',
    startDate: new Date().toISOString(),
    expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
    autoRenewal: true,
    nextBillingAmount: 0,
    nextBillingDate: new Date().toISOString(),
  });

  const [billingHistory, setBillingHistory] = useState([]);

  const [subscriptionPlans, setSubscriptionPlans] = useState([]);

  // Usage statistics (Still Mocked)
  const usageStats = {
    bookingsThisMonth: 78,
    bookingLimit: billingCycle === 'monthly' && currentPlan.toLowerCase() === 'basic' ? 50 : '∞',
    staffMembers: 3,
    staffLimit: currentPlan.toLowerCase() === 'basic' ? 1 : '∞',
    storageUsed: '2.3 GB',
    storageLimit: '10 GB',
  };

  useEffect(() => {
    startAnimations();
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const data = await get(endpoints.centers.subscription);
      if (data) {
        setCurrentPlan(data.plan.toLowerCase());

        // Update subscription object
        setCurrentSubscription(prev => ({
          ...prev,
          plan: data.plan,
          expiryDate: data.expiry,
          status: new Date(data.expiry) > new Date() ? 'Active' : 'Expired'
        }));

        if (data.availablePlans) {
          // Map backend plans to frontend structure if needed, or simply set them
          // We need to support filtering by monthly/yearly, so we keep all of them
          // and filter in the render or derived state.
          const mappedPlans = data.availablePlans.map(p => ({
            id: p._id,
            name: p.name,
            subtitle: p.description,
            price: p.price, // Unified price field
            duration: p.duration, // 'monthly' or 'yearly'
            features: p.features,
            color: p.color || '#3B82F6',
            // Add hardcoded yearly price/discount if needed for display logic, 
            // but since we have strict duration plans now, we might simpler login.
          }));
          setSubscriptionPlans(mappedPlans);
        }

        if (data.billingHistory) {
          setBillingHistory(data.billingHistory);
        }
      }
    } catch (error) {
      console.error("Fetch subscription failed", error);
    }
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
  };

  const openUpgradeModal = (planId) => {
    setSelectedPlan(planId);
    setShowUpgradeModal(true);

    Animated.timing(modalSlideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeUpgradeModal = () => {
    Animated.timing(modalSlideAnim, {
      toValue: height,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowUpgradeModal(false);
    });
  };

  const handlePlanChange = async (planId) => {
    setIsLoading(true);

    try {
      const response = await post(endpoints.centers.subscription, {
        planId,
        billingCycle
      });

      setCurrentPlan(response.plan.toLowerCase());
      setCurrentSubscription(prev => ({
        ...prev,
        plan: response.plan,
        expiryDate: response.expiry
      }));

      closeUpgradeModal();

      Alert.alert(
        'Plan Updated!',
        `Your subscription has been updated to ${response.plan} plan.`,
        [{ text: 'OK', style: 'default' }]
      );

      // Refresh to get updated view if needed
      fetchSubscription();

    } catch (error) {
      Alert.alert('Update Failed', 'Please try again later.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAutoRenewal = () => {
    Alert.alert(
      'Auto Renewal',
      currentSubscription.autoRenewal ? 'Disable auto renewal?' : 'Enable auto renewal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: currentSubscription.autoRenewal ? 'Disable' : 'Enable',
          onPress: () => {
            // TODO: Toggle auto renewal via API
            currentSubscription.autoRenewal = !currentSubscription.autoRenewal;
            Alert.alert('Success', `Auto renewal ${currentSubscription.autoRenewal ? 'enabled' : 'disabled'}`);
          }
        }
      ]
    );
  };

  const handleCancelSubscription = () => {
    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel your subscription? This action cannot be undone and you will lose access to premium features.',
      [
        { text: 'Keep Subscription', style: 'cancel' },
        {
          text: 'Cancel Subscription',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Cancellation', 'Subscription cancellation will be implemented');
          }
        }
      ]
    );
  };

  const getPrice = (plan) => {
    return billingCycle === 'monthly' ? plan.monthlyPrice : Math.round(plan.yearlyPrice / 12);
  };

  const getTotalPrice = (plan) => {
    return billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getUsagePercentage = (used, limit) => {
    if (limit === '∞') return 0;
    return Math.min((used / limit) * 100, 100);
  };

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
            <Text className="text-primary text-lg font-semibold">Subscription</Text>
          </View>

          <TouchableOpacity
            className="w-10 h-10 bg-gray-100 rounded-2xl justify-center items-center"
            activeOpacity={0.7}
          >
            <Ionicons name="receipt-outline" size={20} color="#1A1B23" />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Current Plan Status */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideUpAnim }],
          }}
          className="mx-4 mt-4"
        >
          <View className="rounded-2xl overflow-hidden">
            <LinearGradient
              colors={['#00C851', '#00A843']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                borderRadius: 16,
                padding: 20,
              }}
            >
              <View className="flex-row items-center justify-between mb-4">
                <View>
                  <Text className="text-white text-2xl font-bold mb-1">
                    {currentSubscription.plan} Plan
                  </Text>
                  <Text className="text-white/80 text-sm">
                    Active since {formatDate(currentSubscription.startDate)}
                  </Text>
                </View>

                <View className="bg-white/20 px-3 py-1 rounded-full">
                  <Text className="text-white text-sm font-semibold">
                    {currentSubscription.status}
                  </Text>
                </View>
              </View>

              <View className="bg-white/10 rounded-xl p-3">
                <View className="flex-row justify-between items-center">
                  <Text className="text-white/80 text-sm">Next billing</Text>
                  <Text className="text-white text-base font-semibold">
                    ₹{currentSubscription.nextBillingAmount} on {formatDate(currentSubscription.nextBillingDate)}
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        </Animated.View>

        {/* Usage Statistics */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideUpAnim }],
          }}
          className="bg-white mx-4 mt-4 rounded-2xl p-4 shadow-sm shadow-black/5 border border-gray-100"
        >
          <Text className="text-primary text-lg font-bold mb-4">
            Usage This Month
          </Text>

          <View className="space-y-4">
            {/* Bookings Usage */}
            <View>
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-secondary text-sm">Bookings</Text>
                <Text className="text-primary text-sm font-medium">
                  {usageStats.bookingsThisMonth} / {usageStats.bookingLimit}
                </Text>
              </View>
              {usageStats.bookingLimit !== '∞' && (
                <View className="bg-gray-200 h-2 rounded-full">
                  <View
                    className="bg-accent h-2 rounded-full"
                    style={{ width: `${getUsagePercentage(usageStats.bookingsThisMonth, usageStats.bookingLimit)}%` }}
                  />
                </View>
              )}
            </View>

            {/* Staff Members */}
            <View>
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-secondary text-sm">Staff Members</Text>
                <Text className="text-primary text-sm font-medium">
                  {usageStats.staffMembers} / {usageStats.staffLimit}
                </Text>
              </View>
              {usageStats.staffLimit !== '∞' && (
                <View className="bg-gray-200 h-2 rounded-full">
                  <View
                    className="bg-accent h-2 rounded-full"
                    style={{ width: `${getUsagePercentage(usageStats.staffMembers, usageStats.staffLimit)}%` }}
                  />
                </View>
              )}
            </View>

            {/* Storage */}
            <View>
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-secondary text-sm">Storage</Text>
                <Text className="text-primary text-sm font-medium">
                  {usageStats.storageUsed} / {usageStats.storageLimit}
                </Text>
              </View>
              <View className="bg-gray-200 h-2 rounded-full">
                <View
                  className="bg-accent h-2 rounded-full"
                  style={{ width: '23%' }}
                />
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Billing Cycle Toggle */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideUpAnim }],
          }}
          className="mx-4 mt-6"
        >
          <Text className="text-primary text-lg font-bold mb-4">
            Available Plans
          </Text>

          <View className="bg-white rounded-2xl p-2 shadow-sm shadow-black/5 border border-gray-100 flex-row mb-4">
            <TouchableOpacity
              onPress={() => setBillingCycle('monthly')}
              className={`flex-1 py-3 rounded-xl ${billingCycle === 'monthly' ? 'bg-accent' : 'bg-transparent'
                }`}
              activeOpacity={0.8}
            >
              <Text className={`text-center font-semibold ${billingCycle === 'monthly' ? 'text-white' : 'text-secondary'
                }`}>
                Monthly
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setBillingCycle('yearly')}
              className={`flex-1 py-3 rounded-xl relative ${billingCycle === 'yearly' ? 'bg-accent' : 'bg-transparent'
                }`}
              activeOpacity={0.8}
            >
              <Text className={`text-center font-semibold ${billingCycle === 'yearly' ? 'text-white' : 'text-secondary'
                }`}>
                Yearly
              </Text>
              <View className="absolute -top-2 -right-2 bg-green-500 px-2 py-0.5 rounded-full">
                <Text className="text-white text-xs font-bold">
                  Save 17%
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Subscription Plans */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideUpAnim }],
          }}
          className="mx-4"
        >
          {subscriptionPlans.filter(p => p.duration === billingCycle).length > 0 ? (
            subscriptionPlans.filter(p => p.duration === billingCycle).map((plan, index) => (
              <View
                key={plan.id}
                className={`bg-white rounded-2xl p-6 mb-4 shadow-sm shadow-black/5 border-2 ${plan.name.toLowerCase() === currentPlan.toLowerCase()
                  ? 'border-accent bg-accent/5'
                  : 'border-gray-200'
                  } relative overflow-hidden`}
              >
                {plan.popular && (
                  <View className="absolute -top-2 left-4 bg-accent px-4 py-1 rounded-full">
                    <Text className="text-white text-xs font-semibold">
                      Most Popular
                    </Text>
                  </View>
                )}

                {plan.name.toLowerCase() === currentPlan.toLowerCase() && (
                  <View className="absolute -top-2 right-4 bg-green-500 px-4 py-1 rounded-full">
                    <Text className="text-white text-xs font-semibold">
                      Current Plan
                    </Text>
                  </View>
                )}

                {/* Plan Header */}
                <View className="mb-6">
                  <Text className="text-primary text-2xl font-bold mb-1">
                    {plan.name}
                  </Text>
                  <Text className="text-secondary text-sm mb-4">
                    {plan.subtitle}
                  </Text>

                  <View className="flex-row items-baseline">
                    <Text className="text-primary text-4xl font-black">
                      ₹{plan.price}
                    </Text>
                    <Text className="text-secondary text-base ml-2">
                      /{plan.duration}
                    </Text>
                  </View>
                </View>

                {/* Features */}
                <View className="mb-6">
                  <Text className="text-primary text-base font-semibold mb-3">
                    What's included:
                  </Text>
                  {plan.features.map((feature, featureIndex) => (
                    <View key={featureIndex} className="flex-row items-center mb-2">
                      <Ionicons name="checkmark-circle" size={16} color="#00C851" />
                      <Text className="text-secondary text-sm ml-3 flex-1">
                        {feature}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Action Button */}
                {plan.name.toLowerCase() === currentPlan.toLowerCase() ? (
                  <View className="bg-gray-100 rounded-2xl py-4 justify-center items-center">
                    <Text className="text-secondary text-base font-semibold">
                      Current Plan
                    </Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => openUpgradeModal(plan.id)}
                    activeOpacity={0.8}
                    className="rounded-2xl overflow-hidden"
                  >
                    <LinearGradient
                      colors={[plan.color, plan.color + '80']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{
                        borderRadius: 16,
                        paddingVertical: 16,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <Text className="text-white text-lg font-semibold">
                        Select {plan.name}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>
            ))
          ) : (
            <View className="items-center justify-center py-10 bg-white rounded-2xl border border-dashed border-gray-300">
              <Ionicons name="documents-outline" size={48} color="#D1D5DB" />
              <Text className="text-secondary text-base font-medium mt-3">
                No {billingCycle} plans available
              </Text>
              <Text className="text-gray-400 text-sm text-center px-6 mt-1">
                Please check back later or switch to a different billing cycle.
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Billing History */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideUpAnim }],
          }}
          className="mx-4 mt-6"
        >
          <Text className="text-primary text-lg font-bold mb-4">
            Billing History
          </Text>

          <View className="bg-white rounded-2xl shadow-sm shadow-black/5 border border-gray-100 overflow-hidden">
            {billingHistory.map((bill, index) => (
              <View
                key={bill.id}
                className={`p-4 flex-row items-center justify-between ${index !== billingHistory.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
              >
                <View className="flex-1">
                  <Text className="text-primary text-base font-medium mb-1">
                    {bill.plan}
                  </Text>
                  <Text className="text-secondary text-sm">
                    {formatDate(bill.date)} • {bill.method}
                  </Text>
                </View>

                <View className="items-end">
                  <Text className="text-primary text-lg font-bold">
                    ₹{bill.amount}
                  </Text>
                  <View className="bg-green-100 px-2 py-1 rounded-full">
                    <Text className="text-green-600 text-xs font-semibold">
                      {bill.status}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Settings */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideUpAnim }],
          }}
          className="mx-4 mt-6 mb-8"
        >
          <Text className="text-primary text-lg font-bold mb-4">
            Subscription Settings
          </Text>

          <View className="bg-white rounded-2xl shadow-sm shadow-black/5 border border-gray-100 overflow-hidden">
            <TouchableOpacity
              onPress={toggleAutoRenewal}
              className="p-4 flex-row items-center justify-between border-b border-gray-100"
              activeOpacity={0.7}
            >
              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-accent/10 rounded-2xl justify-center items-center mr-3">
                  <Ionicons name="refresh" size={18} color="#00C851" />
                </View>
                <View>
                  <Text className="text-primary text-base font-medium">
                    Auto Renewal
                  </Text>
                  <Text className="text-secondary text-sm">
                    {currentSubscription.autoRenewal ? 'Enabled' : 'Disabled'}
                  </Text>
                </View>
              </View>

              <View className={`w-6 h-6 rounded-full border-2 ${currentSubscription.autoRenewal ? 'border-accent bg-accent' : 'border-gray-300'
                } justify-center items-center`}>
                {currentSubscription.autoRenewal && (
                  <Ionicons name="checkmark" size={12} color="#ffffff" />
                )}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleCancelSubscription}
              className="p-4 flex-row items-center"
              activeOpacity={0.7}
            >
              <View className="w-10 h-10 bg-red-100 rounded-2xl justify-center items-center mr-3">
                <Ionicons name="close" size={18} color="#dc2626" />
              </View>
              <View>
                <Text className="text-red-600 text-base font-medium">
                  Cancel Subscription
                </Text>
                <Text className="text-secondary text-sm">
                  End your subscription
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Upgrade Modal */}
      <Modal
        visible={showUpgradeModal}
        transparent={true}
        animationType="none"
        onRequestClose={closeUpgradeModal}
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
                Confirm Plan Change
              </Text>
            </View>

            {selectedPlan && (
              <View>
                {/* Plan Summary */}
                <View className="bg-gray-50 rounded-2xl p-4 mb-6">
                  <Text className="text-primary text-base font-semibold mb-3">
                    Plan Summary
                  </Text>

                  <View className="space-y-2">
                    <View className="flex-row justify-between">
                      <Text className="text-secondary text-sm">New Plan</Text>
                      <Text className="text-primary text-sm font-medium">
                        {subscriptionPlans.find(p => p.id === selectedPlan)?.name}
                      </Text>
                    </View>

                    <View className="flex-row justify-between">
                      <Text className="text-secondary text-sm">Billing Cycle</Text>
                      <Text className="text-primary text-sm font-medium">
                        {billingCycle === 'monthly' ? 'Monthly' : 'Yearly'}
                      </Text>
                    </View>

                    <View className="flex-row justify-between">
                      <Text className="text-secondary text-sm">Amount</Text>
                      <Text className="text-primary text-lg font-bold">
                        ₹{subscriptionPlans.find(p => p.id === selectedPlan)?.price}
                        /{billingCycle === 'monthly' ? 'month' : 'year'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Action Buttons */}
                <View className="flex-row space-x-4">
                  <TouchableOpacity
                    onPress={closeUpgradeModal}
                    className="flex-1 bg-gray-200 rounded-2xl py-4 justify-center items-center"
                    activeOpacity={0.8}
                  >
                    <Text className="text-primary text-base font-semibold">
                      Cancel
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handlePlanChange(selectedPlan)}
                    disabled={isLoading}
                    activeOpacity={0.8}
                    className="flex-1 rounded-2xl overflow-hidden"
                  >
                    <LinearGradient
                      colors={isLoading ? ['#cccccc', '#999999'] : ['#00C851', '#00A843']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{
                        borderRadius: 16,
                        paddingVertical: 16,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <View className="flex-row items-center">
                        {isLoading ? (
                          <>
                            <View className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            <Text className="text-white text-base font-semibold">
                              Processing...
                            </Text>
                          </>
                        ) : (
                          <>
                            <Text className="text-white text-base font-semibold mr-2">
                              Confirm Change
                            </Text>
                            <Ionicons name="checkmark" size={20} color="#ffffff" />
                          </>
                        )}
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

export default SubscriptionScreen;