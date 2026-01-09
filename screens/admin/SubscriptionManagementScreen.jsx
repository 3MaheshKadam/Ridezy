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
  TextInput,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import '../../global.css';

const { width, height } = Dimensions.get('window');

const SubscriptionManagementScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('owner'); // owner, driver, carwash
  const [showAddPlanModal, setShowAddPlanModal] = useState(false);
  const [showEditPlanModal, setShowEditPlanModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  // New Plan Form State
  const [planName, setPlanName] = useState('');
  const [planPrice, setPlanPrice] = useState('');
  const [planDuration, setPlanDuration] = useState('monthly');
  const [planDescription, setPlanDescription] = useState('');
  const [planFeatures, setPlanFeatures] = useState(['']);
  const [isActive, setIsActive] = useState(true);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(30)).current;
  const modalSlideAnim = useRef(new Animated.Value(height)).current;

  // Mock subscription plans data
  const [ownerPlans, setOwnerPlans] = useState([
    {
      id: '1',
      name: 'Basic Plan',
      price: 299,
      duration: 'monthly',
      description: 'Perfect for occasional car wash needs',
      features: ['2 car washes per month', 'Basic wash only', 'No detailing', 'Standard support'],
      subscribers: 45,
      revenue: 13455,
      isActive: true,
      color: '#3B82F6',
    },
    {
      id: '2',
      name: 'Premium Plan',
      price: 599,
      duration: 'monthly',
      description: 'Best value for regular car care',
      features: ['4 car washes per month', 'Premium wash included', 'Interior cleaning', 'Priority support', '10% discount on detailing'],
      subscribers: 78,
      revenue: 46722,
      isActive: true,
      color: '#8B5CF6',
      popular: true,
    },
    {
      id: '3',
      name: 'Elite Plan',
      price: 999,
      duration: 'monthly',
      description: 'Ultimate car care package',
      features: ['Unlimited car washes', 'Premium wash & detailing', 'Free interior cleaning', '24/7 priority support', 'Free pickup & drop', '20% discount on ceramic coating'],
      subscribers: 32,
      revenue: 31968,
      isActive: true,
      color: '#F59E0B',
    },
  ]);

  const [driverPlans, setDriverPlans] = useState([
    {
      id: '4',
      name: 'Starter Plan',
      price: 199,
      duration: 'monthly',
      description: 'Get started with driver services',
      features: ['5% platform commission', 'Up to 50 trips/month', 'Basic analytics', 'Standard support'],
      subscribers: 34,
      revenue: 6766,
      isActive: true,
      color: '#10B981',
    },
    {
      id: '5',
      name: 'Professional Plan',
      price: 399,
      duration: 'monthly',
      description: 'For active professional drivers',
      features: ['3% platform commission', 'Unlimited trips', 'Advanced analytics', 'Priority booking', 'Marketing support'],
      subscribers: 56,
      revenue: 22344,
      isActive: true,
      color: '#8B5CF6',
      popular: true,
    },
  ]);

  const [carwashPlans, setCarwashPlans] = useState([
    {
      id: '6',
      name: 'Basic Center Plan',
      price: 999,
      duration: 'monthly',
      description: 'Essential tools for your car wash business',
      features: ['10% platform commission', 'Up to 100 bookings/month', 'Basic dashboard', 'Email support'],
      subscribers: 12,
      revenue: 11988,
      isActive: true,
      color: '#3B82F6',
    },
    {
      id: '7',
      name: 'Business Plan',
      price: 1999,
      duration: 'monthly',
      description: 'Advanced features for growing centers',
      features: ['7% platform commission', 'Unlimited bookings', 'Advanced analytics', 'Customer management', 'Marketing tools', 'Priority support'],
      subscribers: 18,
      revenue: 35982,
      isActive: true,
      color: '#8B5CF6',
      popular: true,
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

  const openAddPlanModal = () => {
    resetForm();
    setShowAddPlanModal(true);
    Animated.timing(modalSlideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeAddPlanModal = () => {
    Animated.timing(modalSlideAnim, {
      toValue: height,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowAddPlanModal(false);
      resetForm();
    });
  };

  const openEditPlanModal = (plan) => {
    setSelectedPlan(plan);
    setPlanName(plan.name);
    setPlanPrice(plan.price.toString());
    setPlanDuration(plan.duration);
    setPlanDescription(plan.description);
    setPlanFeatures(plan.features);
    setIsActive(plan.isActive);
    
    setShowEditPlanModal(true);
    Animated.timing(modalSlideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeEditPlanModal = () => {
    Animated.timing(modalSlideAnim, {
      toValue: height,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowEditPlanModal(false);
      setSelectedPlan(null);
      resetForm();
    });
  };

  const resetForm = () => {
    setPlanName('');
    setPlanPrice('');
    setPlanDuration('monthly');
    setPlanDescription('');
    setPlanFeatures(['']);
    setIsActive(true);
  };

  const addFeature = () => {
    setPlanFeatures([...planFeatures, '']);
  };

  const updateFeature = (index, value) => {
    const newFeatures = [...planFeatures];
    newFeatures[index] = value;
    setPlanFeatures(newFeatures);
  };

  const removeFeature = (index) => {
    if (planFeatures.length > 1) {
      const newFeatures = planFeatures.filter((_, i) => i !== index);
      setPlanFeatures(newFeatures);
    }
  };

  const handleCreatePlan = async () => {
    if (!planName || !planPrice || !planDescription) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }

    const filteredFeatures = planFeatures.filter(f => f.trim() !== '');
    if (filteredFeatures.length === 0) {
      Alert.alert('Missing Features', 'Please add at least one feature.');
      return;
    }

    try {
      // TODO: API call to create plan
      await new Promise(resolve => setTimeout(resolve, 1000));

      const newPlan = {
        id: Date.now().toString(),
        name: planName,
        price: parseFloat(planPrice),
        duration: planDuration,
        description: planDescription,
        features: filteredFeatures,
        subscribers: 0,
        revenue: 0,
        isActive: isActive,
        color: '#10B981',
      };

      // Add to appropriate list based on active tab
      if (activeTab === 'owner') {
        setOwnerPlans([...ownerPlans, newPlan]);
      } else if (activeTab === 'driver') {
        setDriverPlans([...driverPlans, newPlan]);
      } else {
        setCarwashPlans([...carwashPlans, newPlan]);
      }

      closeAddPlanModal();
      Alert.alert('Success', 'Subscription plan created successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to create plan. Please try again.');
    }
  };

  const handleUpdatePlan = async () => {
    if (!planName || !planPrice || !planDescription) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }

    const filteredFeatures = planFeatures.filter(f => f.trim() !== '');
    if (filteredFeatures.length === 0) {
      Alert.alert('Missing Features', 'Please add at least one feature.');
      return;
    }

    try {
      // TODO: API call to update plan
      await new Promise(resolve => setTimeout(resolve, 1000));

      const updatedPlan = {
        ...selectedPlan,
        name: planName,
        price: parseFloat(planPrice),
        duration: planDuration,
        description: planDescription,
        features: filteredFeatures,
        isActive: isActive,
      };

      // Update in appropriate list
      if (activeTab === 'owner') {
        setOwnerPlans(ownerPlans.map(p => p.id === selectedPlan.id ? updatedPlan : p));
      } else if (activeTab === 'driver') {
        setDriverPlans(driverPlans.map(p => p.id === selectedPlan.id ? updatedPlan : p));
      } else {
        setCarwashPlans(carwashPlans.map(p => p.id === selectedPlan.id ? updatedPlan : p));
      }

      closeEditPlanModal();
      Alert.alert('Success', 'Plan updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update plan. Please try again.');
    }
  };

  const handleDeletePlan = (plan) => {
    Alert.alert(
      'Delete Plan',
      `Are you sure you want to delete "${plan.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // TODO: API call to delete plan
              await new Promise(resolve => setTimeout(resolve, 1000));

              if (activeTab === 'owner') {
                setOwnerPlans(ownerPlans.filter(p => p.id !== plan.id));
              } else if (activeTab === 'driver') {
                setDriverPlans(driverPlans.filter(p => p.id !== plan.id));
              } else {
                setCarwashPlans(carwashPlans.filter(p => p.id !== plan.id));
              }

              Alert.alert('Deleted', 'Plan deleted successfully.');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete plan.');
            }
          },
        },
      ]
    );
  };

  const renderPlanCard = (plan) => (
    <View
      key={plan.id}
      className="bg-white rounded-2xl p-4 mb-4 shadow-sm shadow-black/5 border-2 border-gray-100"
    >
      {plan.popular && (
        <View className="absolute -top-2 left-4 bg-accent px-3 py-1 rounded-full z-10">
          <Text className="text-white text-xs font-bold">Popular</Text>
        </View>
      )}

      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-1">
          <View className="flex-row items-center mb-2">
            <View
              className="w-10 h-10 rounded-xl justify-center items-center mr-3"
              style={{ backgroundColor: `${plan.color}15` }}
            >
              <MaterialIcons name="card-membership" size={20} color={plan.color} />
            </View>
            <View className="flex-1">
              <Text className="text-primary text-lg font-bold">{plan.name}</Text>
              <Text className="text-secondary text-xs">{plan.description}</Text>
            </View>
          </View>
        </View>
        <View
          className={`px-2 py-1 rounded-full ${
            plan.isActive ? 'bg-green-50' : 'bg-gray-100'
          }`}
        >
          <Text
            className={`text-xs font-semibold ${
              plan.isActive ? 'text-green-600' : 'text-gray-500'
            }`}
          >
            {plan.isActive ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>

      {/* Pricing */}
      <View className="bg-gray-50 rounded-xl p-3 mb-3">
        <View className="flex-row items-end justify-between">
          <View>
            <Text className="text-secondary text-xs mb-1">Price</Text>
            <View className="flex-row items-end">
              <Text className="text-primary text-2xl font-bold">₹{plan.price}</Text>
              <Text className="text-secondary text-sm ml-1 mb-1">/{plan.duration}</Text>
            </View>
          </View>
          <View className="items-end">
            <Text className="text-secondary text-xs mb-1">Subscribers</Text>
            <Text className="text-primary text-xl font-bold">{plan.subscribers}</Text>
          </View>
        </View>
      </View>

      {/* Features */}
      <View className="mb-3">
        <Text className="text-primary text-sm font-semibold mb-2">Features:</Text>
        {plan.features.slice(0, 3).map((feature, index) => (
          <View key={index} className="flex-row items-center mb-1">
            <Ionicons name="checkmark-circle" size={14} color="#00C851" />
            <Text className="text-secondary text-xs ml-2 flex-1">{feature}</Text>
          </View>
        ))}
        {plan.features.length > 3 && (
          <Text className="text-accent text-xs mt-1">
            +{plan.features.length - 3} more features
          </Text>
        )}
      </View>

      {/* Revenue */}
      <View className="border-t border-gray-100 pt-3 mb-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-secondary text-xs">Monthly Revenue</Text>
          <Text className="text-accent text-base font-bold">
            ₹{plan.revenue.toLocaleString('en-IN')}
          </Text>
        </View>
      </View>

      {/* Actions */}
      <View className="flex-row space-x-3">
        <TouchableOpacity
          onPress={() => openEditPlanModal(plan)}
          className="flex-1 bg-blue-50 rounded-xl py-3 flex-row justify-center items-center"
          activeOpacity={0.8}
        >
          <Ionicons name="create" size={16} color="#3B82F6" />
          <Text className="text-blue-600 text-sm font-semibold ml-2">Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleDeletePlan(plan)}
          className="flex-1 bg-red-50 rounded-xl py-3 flex-row justify-center items-center"
          activeOpacity={0.8}
        >
          <Ionicons name="trash" size={16} color="#dc2626" />
          <Text className="text-red-600 text-sm font-semibold ml-2">Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const getCurrentPlans = () => {
    switch (activeTab) {
      case 'owner':
        return ownerPlans;
      case 'driver':
        return driverPlans;
      case 'carwash':
        return carwashPlans;
      default:
        return [];
    }
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case 'owner':
        return 'Car Owner Plans';
      case 'driver':
        return 'Driver Plans';
      case 'carwash':
        return 'Car Wash Center Plans';
      default:
        return '';
    }
  };

  const renderPlanFormModal = (isEdit = false) => (
    <Modal
      visible={isEdit ? showEditPlanModal : showAddPlanModal}
      transparent={true}
      animationType="none"
      onRequestClose={isEdit ? closeEditPlanModal : closeAddPlanModal}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <Animated.View
          style={{
            transform: [{ translateY: modalSlideAnim }],
          }}
          className="bg-white rounded-t-3xl p-6 max-h-[90%]"
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            <View className="items-center mb-6">
              <View className="w-12 h-1 bg-gray-300 rounded-full mb-4" />
              <Text className="text-primary text-xl font-bold">
                {isEdit ? 'Edit Plan' : `Create New ${getTabTitle()}`}
              </Text>
            </View>

            {/* Plan Name */}
            <View className="mb-4">
              <Text className="text-primary text-sm font-semibold mb-2">
                Plan Name *
              </Text>
              <View className="bg-gray-50 rounded-2xl p-4">
                <TextInput
                  value={planName}
                  onChangeText={setPlanName}
                  placeholder="e.g., Premium Plan"
                  placeholderTextColor="#6C757D"
                  className="text-primary text-base"
                />
              </View>
            </View>

            {/* Price and Duration */}
            <View className="flex-row space-x-3 mb-4">
              <View className="flex-1">
                <Text className="text-primary text-sm font-semibold mb-2">
                  Price (₹) *
                </Text>
                <View className="bg-gray-50 rounded-2xl p-4">
                  <TextInput
                    value={planPrice}
                    onChangeText={setPlanPrice}
                    placeholder="299"
                    placeholderTextColor="#6C757D"
                    keyboardType="numeric"
                    className="text-primary text-base"
                  />
                </View>
              </View>

              <View className="flex-1">
                <Text className="text-primary text-sm font-semibold mb-2">
                  Duration *
                </Text>
                <View className="bg-gray-50 rounded-2xl p-4">
                  <TouchableOpacity
                    onPress={() => {
                      Alert.alert('Select Duration', '', [
                        { text: 'Monthly', onPress: () => setPlanDuration('monthly') },
                        { text: 'Quarterly', onPress: () => setPlanDuration('quarterly') },
                        { text: 'Yearly', onPress: () => setPlanDuration('yearly') },
                      ]);
                    }}
                  >
                    <Text className="text-primary text-base capitalize">
                      {planDuration}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Description */}
            <View className="mb-4">
              <Text className="text-primary text-sm font-semibold mb-2">
                Description *
              </Text>
              <View className="bg-gray-50 rounded-2xl p-4">
                <TextInput
                  value={planDescription}
                  onChangeText={setPlanDescription}
                  placeholder="Brief description of the plan"
                  placeholderTextColor="#6C757D"
                  multiline
                  numberOfLines={2}
                  textAlignVertical="top"
                  className="text-primary text-base"
                />
              </View>
            </View>

            {/* Features */}
            <View className="mb-4">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-primary text-sm font-semibold">
                  Features *
                </Text>
                <TouchableOpacity
                  onPress={addFeature}
                  className="bg-accent/10 px-3 py-1 rounded-full"
                  activeOpacity={0.8}
                >
                  <Text className="text-accent text-xs font-semibold">+ Add</Text>
                </TouchableOpacity>
              </View>

              {planFeatures.map((feature, index) => (
                <View key={index} className="flex-row items-center mb-2">
                  <View className="flex-1 bg-gray-50 rounded-2xl p-4 mr-2">
                    <TextInput
                      value={feature}
                      onChangeText={(value) => updateFeature(index, value)}
                      placeholder={`Feature ${index + 1}`}
                      placeholderTextColor="#6C757D"
                      className="text-primary text-base"
                    />
                  </View>
                  {planFeatures.length > 1 && (
                    <TouchableOpacity
                      onPress={() => removeFeature(index)}
                      className="w-10 h-10 bg-red-50 rounded-xl justify-center items-center"
                      activeOpacity={0.8}
                    >
                      <Ionicons name="trash" size={18} color="#dc2626" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>

            {/* Active Status */}
            <View className="bg-gray-50 rounded-2xl p-4 mb-6">
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-primary text-sm font-semibold mb-1">
                    Plan Status
                  </Text>
                  <Text className="text-secondary text-xs">
                    {isActive ? 'Plan is active and visible to users' : 'Plan is inactive'}
                  </Text>
                </View>
                <Switch
                  value={isActive}
                  onValueChange={setIsActive}
                  trackColor={{ false: '#D1D5DB', true: '#00C851' }}
                  thumbColor="#ffffff"
                />
              </View>
            </View>

            {/* Action Buttons */}
            <View className="flex-row space-x-4">
              <TouchableOpacity
                onPress={isEdit ? closeEditPlanModal : closeAddPlanModal}
                className="flex-1 bg-gray-200 rounded-2xl py-4 justify-center items-center"
                activeOpacity={0.8}
              >
                <Text className="text-primary text-base font-semibold">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={isEdit ? handleUpdatePlan : handleCreatePlan}
                activeOpacity={0.8}
                className="flex-1 rounded-2xl overflow-hidden"
              >
                <LinearGradient
                  colors={['#00C851', '#00A843']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    borderRadius: 16,
                    paddingVertical: 16,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Text className="text-white text-base font-semibold">
                    {isEdit ? 'Update Plan' : 'Create Plan'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );

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
        <View className="flex-row items-center justify-between mb-4">
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
            onPress={openAddPlanModal}
            className="w-10 h-10 bg-accent/10 rounded-2xl justify-center items-center"
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={24} color="#00C851" />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Tabs */}
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideUpAnim }],
        }}
        className="bg-white px-6 py-3"
      >
        <View className="flex-row bg-gray-100 rounded-2xl p-1">
          <TouchableOpacity
            onPress={() => setActiveTab('owner')}
            className={`flex-1 py-2 rounded-xl ${
              activeTab === 'owner' ? 'bg-white' : ''
            }`}
            activeOpacity={0.8}
          >
            <Text
              className={`text-xs font-semibold text-center ${
                activeTab === 'owner' ? 'text-primary' : 'text-secondary'
              }`}
            >
              Car Owners
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('driver')}
            className={`flex-1 py-2 rounded-xl ${
              activeTab === 'driver' ? 'bg-white' : ''
            }`}
            activeOpacity={0.8}
          >
            <Text
              className={`text-xs font-semibold text-center ${
                activeTab === 'driver' ? 'text-primary' : 'text-secondary'
              }`}
            >
              Drivers
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('carwash')}
            className={`flex-1 py-2 rounded-xl ${
              activeTab === 'carwash' ? 'bg-white' : ''
            }`}
            activeOpacity={0.8}
          >
            <Text
              className={`text-xs font-semibold text-center ${
                activeTab === 'carwash' ? 'text-primary' : 'text-secondary'
              }`}
            >
              Car Wash
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Plans List */}
      <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideUpAnim }],
          }}
        >
          <Text className="text-primary text-base font-bold mb-4">
            {getTabTitle()}
          </Text>

          {getCurrentPlans().length === 0 ? (
            <View className="items-center justify-center py-20">
              <View className="w-24 h-24 bg-gray-100 rounded-full justify-center items-center mb-4">
                <MaterialIcons name="card-membership" size={40} color="#6C757D" />
              </View>
              <Text className="text-secondary text-base mb-2">No plans created yet</Text>
              <TouchableOpacity
                onPress={openAddPlanModal}
                className="bg-accent/10 px-4 py-2 rounded-xl"
                activeOpacity={0.8}
              >
                <Text className="text-accent text-sm font-semibold">
                  Create First Plan
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            getCurrentPlans().map(renderPlanCard)
          )}
        </Animated.View>
      </ScrollView>

      {/* Add Plan Modal */}
      {renderPlanFormModal(false)}

      {/* Edit Plan Modal */}
      {renderPlanFormModal(true)}
    </View>
  );
};

export default SubscriptionManagementScreen;