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
import { Ionicons } from '@expo/vector-icons';
import { useDriverSubscription } from '../../hooks/useDriverSubscription';

const { width, height } = Dimensions.get('window');

const DriverSubscription = ({ navigation }) => {
  const {
    plans: subscriptionPlans,
    currentSubscription,
    loading: isLoading,
    processing,
    subscribeToPlan,
    cancelSubscription,
    getDaysRemaining
  } = useDriverSubscription();

  // Unified State: If selectedPlan is not null, the modal is open.
  const [selectedPlan, setSelectedPlan] = useState(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(30)).current;
  const modalSlideAnim = useRef(new Animated.Value(height)).current;

  useEffect(() => {
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
  }, []);

  // --- Modal Logic ---
  const openPlanModal = (plan) => {
    setSelectedPlan(plan);
    Animated.spring(modalSlideAnim, {
      toValue: 0,
      useNativeDriver: true,
      damping: 20,
      stiffness: 100,
    }).start();
  };

  const closePlanModal = () => {
    Animated.timing(modalSlideAnim, {
      toValue: height,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setSelectedPlan(null);
    });
  };

  const handlePayment = async (method) => {
    if (!selectedPlan) return;

    const success = await subscribeToPlan(selectedPlan);
    if (success) {
      closePlanModal();
      Alert.alert('Welcome to Premium!', `You have successfully subscribed to the ${selectedPlan.name}.`);
    }
  };

  const handleCancelSubscription = () => {
    Alert.alert(
      'Cancel Subscription',
      'Are you sure? You will lose all premium benefits immediately.',
      [
        { text: 'Keep Plan', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            await cancelSubscription();
            Alert.alert('Subscription Cancelled', 'You are now on the Basic plan.');
          },
        },
      ]
    );
  };

  const formatCurrency = (amount) => `₹${amount.toLocaleString('en-IN')}`;

  const renderPlanCard = (plan) => {
    const isCurrentPlan = currentSubscription && String(currentSubscription.planId) === String(plan.id);
    const isUpgrade = currentSubscription &&
      subscriptionPlans.findIndex(p => String(p.id) === String(currentSubscription.planId)) <
      subscriptionPlans.findIndex(p => String(p.id) === String(plan.id));

    return (
      <TouchableOpacity
        key={plan.id}
        activeOpacity={0.9}
        onPress={() => !isCurrentPlan && openPlanModal(plan)}
        disabled={isCurrentPlan}
        className="mb-6"
      >
        <View className={`bg-white rounded-3xl overflow-hidden shadow-sm shadow-black/10 border-2 ${isCurrentPlan ? 'border-accent' : plan.popular ? 'border-purple-200' : 'border-gray-100'
          }`}>
          {/* Plan Badge */}
          {plan.popular && !isCurrentPlan && (
            <View className="bg-purple-100 py-2 px-4 items-center flex-row justify-center">
              <Ionicons name="star" size={14} color="#8B5CF6" />
              <Text className="text-purple-700 text-xs font-bold ml-1 uppercase tracking-wider">
                Most Popular
              </Text>
            </View>
          )}
          {isCurrentPlan && (
            <View className="bg-green-100 py-2 px-4 items-center flex-row justify-center">
              <Ionicons name="checkmark-circle" size={16} color="#059669" />
              <Text className="text-green-700 text-xs font-bold ml-1 uppercase tracking-wider">
                Current Plan
              </Text>
            </View>
          )}

          <View className="p-6">
            <View className="flex-row justify-between items-start mb-4">
              <View>
                <Text className="text-primary text-xl font-bold mb-1">{plan.name}</Text>
                <Text className="text-secondary text-xs">{plan.description}</Text>
              </View>
              <View className="w-12 h-12 rounded-xl justify-center items-center" style={{ backgroundColor: `${plan.color}15` }}>
                <Ionicons name="car-sport" size={24} color={plan.color} />
              </View>
            </View>

            <View className="flex-row items-baseline mb-6">
              <Text className="text-primary text-3xl font-extrabold">{formatCurrency(plan.price)}</Text>
              <Text className="text-secondary text-sm ml-1">/{plan.duration}</Text>
            </View>

            {/* Feature Teaser */}
            <View className="space-y-2 mb-4">
              <View className="flex-row items-center">
                <Ionicons name="flash" size={14} color="#F59E0B" />
                <Text className="text-secondary text-sm ml-2 font-medium">
                  {plan.commission}% Commission (Save Money)
                </Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="people" size={14} color="#3B82F6" />
                <Text className="text-secondary text-sm ml-2 font-medium">
                  Priority Booking Access
                </Text>
              </View>
            </View>

            {!isCurrentPlan && (
              <View className="h-12 rounded-xl flex-row justify-center items-center bg-gray-50 mt-2 border border-gray-100">
                <Text className="text-primary font-semibold">
                  {isUpgrade ? 'Tap to Upgrade' : 'View Details'}
                </Text>
              </View>
            )}

            {isCurrentPlan && (
              <View className="flex-row gap-2 mt-2">
                <TouchableOpacity
                  onPress={handleCancelSubscription}
                  className="flex-1 py-3 bg-red-50 rounded-xl items-center border border-red-100"
                >
                  <Text className="text-red-600 font-semibold text-sm">Cancel Plan</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

      {/* HEADER */}
      <View className="pt-12 pb-4 px-6 bg-white shadow-sm shadow-black/5 z-10">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={() => navigation.goBack()} className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center">
            <Ionicons name="close" size={20} color="#1F2937" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-gray-900">Subscription Plans</Text>
          <View className="w-10" />
        </View>
      </View>

      <ScrollView className="flex-1 px-4 pt-6" showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideUpAnim }] }}>
          {/* Subscription Status Card */}
          {currentSubscription?.status === 'active' && (
            <View className="bg-gray-900 rounded-3xl p-6 mb-8 relative overflow-hidden">
              <View className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full" />
              <View className="absolute -left-10 -bottom-10 w-32 h-32 bg-white/5 rounded-full" />

              <Text className="text-gray-400 text-xs font-semibold uppercase tracking-widest mb-2">My Subscription</Text>
              <Text className="text-white text-3xl font-bold mb-1">{currentSubscription.planName}</Text>
              <Text className="text-gray-400 text-sm mb-6">
                Valid until {new Date(currentSubscription.expiryDate).toLocaleDateString()}
              </Text>

              <View className="flex-row items-center bg-white/10 self-start px-4 py-2 rounded-full backdrop-blur-sm">
                <Ionicons name="time" size={16} color="#fff" />
                <Text className="text-white ml-2 font-bold">{getDaysRemaining()} Days Left</Text>
              </View>
            </View>
          )}

          <Text className="text-gray-900 text-xl font-bold mb-6 px-2">Available Plans</Text>

          {isLoading ? (
            <View className="py-20 items-center">
              <Text className="text-gray-400">Loading plans...</Text>
            </View>
          ) : (
            subscriptionPlans.map(renderPlanCard)
          )}

          <View className="h-20" />
        </Animated.View>
      </ScrollView>

      {/* UNIFIED PAYMENT MODAL */}
      {selectedPlan && (
        <View className="absolute inset-0 bg-black/60 z-50 justify-end">
          <TouchableOpacity
            activeOpacity={1}
            onPress={closePlanModal}
            className="absolute inset-0"
          />

          <Animated.View
            style={{ transform: [{ translateY: modalSlideAnim }] }}
            className="bg-white rounded-t-[32px] overflow-hidden"
          >
            {/* Modal Handle */}
            <View className="items-center pt-4 pb-2">
              <View className="w-12 h-1.5 bg-gray-200 rounded-full" />
            </View>

            <View className="p-6">
              {/* Plan Summary Header */}
              <View className="flex-row justify-between items-start mb-8">
                <View>
                  <Text className="text-gray-500 text-sm mb-1 uppercase font-bold tracking-wide">Selected Plan</Text>
                  <Text className="text-gray-900 text-2xl font-bold">{selectedPlan.name}</Text>
                  <Text className="text-gray-500">{selectedPlan.description}</Text>
                </View>
                <View className="items-end">
                  <Text className="text-gray-900 text-2xl font-bold">{formatCurrency(selectedPlan.price)}</Text>
                  <Text className="text-gray-400 text-xs">Full Access</Text>
                </View>
              </View>

              {/* Feature List (Compact) */}
              <View className="bg-gray-50 rounded-2xl p-4 mb-8 space-y-3">
                {selectedPlan.features.slice(0, 3).map((f, i) => (
                  <View key={i} className="flex-row items-center">
                    <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                    <Text className="text-gray-700 ml-3 text-sm font-medium flex-1">{f}</Text>
                  </View>
                ))}
              </View>

              {/* Payment Options */}
              <Text className="text-gray-900 font-bold mb-4 text-base">Select Payment Method</Text>

              <TouchableOpacity
                onPress={() => handlePayment('upi')}
                className="bg-purple-50 p-4 rounded-2xl flex-row items-center mb-3 border border-purple-100"
                activeOpacity={0.7}
                disabled={processing}
              >
                <View className="w-10 h-10 bg-purple-100 rounded-full items-center justify-center mr-4">
                  <Ionicons name="flash" size={20} color="#8B5CF6" />
                </View>
                <View className="flex-1">
                  <Text className="text-purple-900 font-bold text-base">Pay via UPI</Text>
                  <Text className="text-purple-600 text-xs">GooglePay, PhonePe, Paytm</Text>
                </View>
                {processing && <Text className="text-purple-600 font-bold">Wait...</Text>}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handlePayment('card')}
                className="bg-white p-4 rounded-2xl flex-row items-center border border-gray-200"
                activeOpacity={0.7}
                disabled={processing}
              >
                <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-4">
                  <Ionicons name="card" size={20} color="#6B7280" />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-900 font-bold text-base">Credit / Debit Card</Text>
                  <Text className="text-gray-500 text-xs">Visa, Mastercard</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Safe Area Spacer for Bottom Bar */}
            <View className="h-8 bg-white" />
          </Animated.View>
        </View>
      )}
    </View>
  );
};

export default DriverSubscription;