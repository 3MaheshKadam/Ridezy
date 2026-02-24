import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  ActivityIndicator,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { get, post, put, del } from '../../lib/api';
import { endpoints } from '../../config/apiConfig';

const { width, height } = Dimensions.get('window');

// Premium Glassmorphic Card
const GlassCard = ({ children, className = "", style = {} }) => (
  <View
    className={`bg-white/95 border border-slate-100 rounded-[32px] overflow-hidden ${className}`}
    style={{
      ...Platform.select({
        ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 15 },
        android: { elevation: 10 }
      }),
      ...style
    }}
  >
    {children}
  </View>
);

const SubscriptionManagementScreen = ({ navigation }) => {
  // --- State Management ---
  const [activeTab, setActiveTab] = useState('owner'); // owner, driver, carwash
  const [isLoading, setIsLoading] = useState(true);
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [planModalVisible, setPlanModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // --- Form State ---
  const [planName, setPlanName] = useState('');
  const [planPrice, setPlanPrice] = useState('');
  const [planDuration, setPlanDuration] = useState('monthly');
  const [planDescription, setPlanDescription] = useState('');
  const [planFeatures, setPlanFeatures] = useState(['']);
  const [isActive, setIsActive] = useState(true);

  // --- Animations ---
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    animateScreen();
    fetchPlans();
  }, []);

  const animateScreen = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(slideUpAnim, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true })
    ]).start();
  };

  // --- Data Actions ---
  const fetchPlans = async () => {
    setIsLoading(true);
    try {
      const response = await get(endpoints.admin.plans);
      if (response) {
        const plansWithDefaults = response.map(p => ({
          ...p,
          id: p._id,
          color: p.color || (p.role === 'DRIVER' ? '#8B5CF6' : p.role === 'CENTER' ? '#3B82F6' : '#4F46E5'),
          revenue: p.revenue || 0,
          subscribers: p.subscribers || 0,
        }));
        setPlans(plansWithDefaults);
      }
    } catch (error) {
      console.error("Fetch plans error:", error);
      Alert.alert("Error", "Could not load subscription plans");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePlan = async () => {
    if (!planName || !planPrice || !planDescription) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }

    const filteredFeatures = planFeatures.filter(f => f.trim() !== '');
    if (filteredFeatures.length === 0) {
      Alert.alert('Missing Features', 'Please add at least one feature.');
      return;
    }

    const role = activeTab === 'driver' ? 'DRIVER' : activeTab === 'carwash' ? 'CENTER' : 'OWNER';
    const payload = {
      name: planName,
      price: parseFloat(planPrice),
      duration: planDuration,
      description: planDescription,
      features: filteredFeatures,
      isActive: isActive,
      role: role,
    };

    try {
      if (isEditMode && selectedPlan) {
        payload._id = selectedPlan.id;
        await put(endpoints.admin.plans, payload);
        Alert.alert('Success', 'Plan updated successfully!');
      } else {
        payload.color = '#4F46E5';
        await post(endpoints.admin.plans, payload);
        Alert.alert('Success', 'Subscription plan created successfully!');
      }
      setPlanModalVisible(false);
      fetchPlans();
      resetForm();
    } catch (error) {
      Alert.alert('Error', 'Operation failed. Please try again.');
    }
  };

  const handleDeletePlan = (plan) => {
    Alert.alert(
      'Delete Plan',
      `Are you sure you want to delete "${plan.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await del(`${endpoints.admin.plans}?id=${plan.id}`);
              fetchPlans();
              Alert.alert('Deleted', 'Plan deleted successfully.');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete plan.');
            }
          },
        },
      ]
    );
  };

  const openModal = (plan = null) => {
    if (plan) {
      setIsEditMode(true);
      setSelectedPlan(plan);
      setPlanName(plan.name);
      setPlanPrice(plan.price.toString());
      setPlanDuration(plan.duration);
      setPlanDescription(plan.description);
      setPlanFeatures(plan.features);
      setIsActive(plan.isActive);
    } else {
      setIsEditMode(false);
      resetForm();
    }
    setPlanModalVisible(true);
  };

  const resetForm = () => {
    setPlanName('');
    setPlanPrice('');
    setPlanDuration('monthly');
    setPlanDescription('');
    setPlanFeatures(['']);
    setIsActive(true);
  };

  // --- Derived Data ---
  const filteredPlans = useMemo(() => {
    const role = activeTab === 'driver' ? 'DRIVER' : activeTab === 'carwash' ? 'CENTER' : 'OWNER';
    return plans.filter(p => {
      const pRole = (p.role || '').toUpperCase();
      if (role === 'OWNER') return pRole === 'OWNER' || pRole === '';
      return pRole === role;
    });
  }, [activeTab, plans]);

  // --- Components ---
  const renderPlanCard = (plan) => (
    <GlassCard key={plan.id} className="mb-6 p-6">
      <View className="flex-row justify-between items-start mb-4">
        <View className="flex-row items-center">
          <View className="w-12 h-12 rounded-2xl justify-center items-center mr-4" style={{ backgroundColor: `${plan.color}15` }}>
            <FontAwesome5 name="gem" size={20} color={plan.color} />
          </View>
          <View>
            <Text className="text-slate-900 text-lg font-black">{String(plan.name)}</Text>
            <Text className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{String(plan.duration)} PLAN</Text>
          </View>
        </View>
        <View className={`px-3 py-1 rounded-full ${plan.isActive ? 'bg-emerald-100' : 'bg-slate-100'}`}>
          <Text className={`text-[10px] font-black uppercase ${plan.isActive ? 'text-emerald-700' : 'text-slate-500'}`}>
            {plan.isActive ? 'Active' : 'Draft'}
          </Text>
        </View>
      </View>

      <View className="bg-slate-50 rounded-3xl p-5 mb-5 flex-row items-center justify-between">
        <View>
          <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Pricing</Text>
          <View className="flex-row items-baseline">
            <Text className="text-slate-900 text-2xl font-black">₹{plan.price}</Text>
            <Text className="text-slate-500 text-xs font-bold ml-1">/{plan.duration === 'yearly' ? 'yr' : 'mo'}</Text>
          </View>
        </View>
        <View className="h-8 w-[1px] bg-slate-200" />
        <View className="items-end">
          <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Users</Text>
          <Text className="text-slate-900 text-xl font-black">{plan.subscribers}</Text>
        </View>
      </View>

      <View className="mb-5">
        {plan.features.slice(0, 3).map((f, i) => (
          <View key={i} className="flex-row items-center mb-2">
            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
            <Text className="text-slate-600 text-xs font-bold ml-2" numberOfLines={1}>{f}</Text>
          </View>
        ))}
      </View>

      <View className="flex-row space-x-3">
        <TouchableOpacity
          onPress={() => openModal(plan)}
          className="flex-1 bg-indigo-50 py-3.5 rounded-2xl items-center flex-row justify-center"
        >
          <Ionicons name="create-outline" size={18} color="#4F46E5" />
          <Text className="text-indigo-600 font-black ml-2 text-xs">Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleDeletePlan(plan)}
          className="flex-1 bg-rose-50 py-3.5 rounded-2xl items-center flex-row justify-center"
        >
          <Ionicons name="trash-outline" size={18} color="#F43F5E" />
          <Text className="text-rose-600 font-black ml-2 text-xs">Delete</Text>
        </TouchableOpacity>
      </View>
    </GlassCard>
  );

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Header */}
      <View className="px-6 pt-14 pb-4 bg-white">
        <View className="flex-row items-center justify-between mb-6">
          <TouchableOpacity onPress={() => navigation.goBack()} className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 justify-center items-center">
            <Ionicons name="chevron-back" size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text className="text-slate-900 text-2xl font-black">Subscription</Text>
          <TouchableOpacity onPress={() => openModal()} className="w-12 h-12 rounded-2xl bg-indigo-600 justify-center items-center">
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View className="flex-row bg-slate-50 p-1.5 rounded-3xl mb-4">
          {['owner', 'driver', 'carwash'].map(tab => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              className={`flex-1 py-3 items-center rounded-2xl ${activeTab === tab ? 'bg-white shadow-sm' : ''}`}
            >
              <Text className={`text-[10px] font-black uppercase ${activeTab === tab ? 'text-indigo-600' : 'text-slate-400'}`}>
                {tab === 'carwash' ? 'Car Wash' : `${tab}s`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 justify-center items-center"><ActivityIndicator size="large" color="#4F46E5" /></View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideUpAnim }] }}>
            {filteredPlans.length === 0 ? (
              <View className="py-20 items-center">
                <Ionicons name="card-outline" size={64} color="#E2E8F0" />
                <Text className="text-slate-400 font-black text-lg mt-4">No Plans Found</Text>
                <TouchableOpacity onPress={() => openModal()} className="mt-4"><Text className="text-indigo-600 font-bold">Create your first plan</Text></TouchableOpacity>
              </View>
            ) : (
              filteredPlans.map(renderPlanCard)
            )}
          </Animated.View>
        </ScrollView>
      )}

      {/* Plan Form Modal */}
      <Modal visible={planModalVisible} transparent animationType="slide">
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-white rounded-t-[40px] p-8 pb-12 h-[90%]">
            <View className="w-16 h-1 bg-slate-200 rounded-full self-center mb-8" />
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text className="text-slate-900 text-2xl font-black mb-1">{isEditMode ? 'Edit Plan' : 'New Plan'}</Text>
              <Text className="text-slate-500 font-bold mb-8">Set up your subscription details below.</Text>

              <View className="space-y-6">
                <View>
                  <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2 ml-1">Plan Name</Text>
                  <TextInput
                    className="bg-slate-50 rounded-2xl p-4 text-slate-900 font-bold border border-slate-100"
                    placeholder="e.g. Platinum Access"
                    value={planName} onChangeText={setPlanName}
                  />
                </View>

                <View className="flex-row space-x-4">
                  <View className="flex-1">
                    <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2 ml-1">Price (₹)</Text>
                    <TextInput
                      className="bg-slate-50 rounded-2xl p-4 text-slate-900 font-bold border border-slate-100"
                      placeholder="999" keyboardType="numeric"
                      value={planPrice} onChangeText={setPlanPrice}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2 ml-1">Billing</Text>
                    <View className="flex-row bg-slate-50 rounded-2xl p-1 border border-slate-100">
                      {['monthly', 'yearly'].map(d => (
                        <TouchableOpacity
                          key={d} onPress={() => setPlanDuration(d)}
                          className={`flex-1 py-3 rounded-xl items-center ${planDuration === d ? 'bg-white shadow-sm' : ''}`}
                        >
                          <Text className={`text-[10px] font-black uppercase ${planDuration === d ? 'text-indigo-600' : 'text-slate-400'}`}>{d === 'monthly' ? 'MO' : 'YR'}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>

                <View>
                  <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2 ml-1">Description</Text>
                  <TextInput
                    className="bg-slate-50 rounded-2xl p-4 text-slate-900 font-bold border border-slate-100 h-24 text-left align-top"
                    placeholder="What's included in this plan?" multiline
                    value={planDescription} onChangeText={setPlanDescription}
                  />
                </View>

                <View>
                  <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2 ml-1">Features</Text>
                  {planFeatures.map((f, i) => (
                    <View key={i} className="flex-row items-center mb-3">
                      <TextInput
                        className="flex-1 bg-slate-50 rounded-2xl p-4 text-slate-900 font-bold border border-slate-100"
                        placeholder={`Feature ${i + 1}`}
                        value={f} onChangeText={(val) => {
                          const newF = [...planFeatures];
                          newF[i] = val;
                          setPlanFeatures(newF);
                        }}
                      />
                      <TouchableOpacity
                        onPress={() => setPlanFeatures(planFeatures.filter((_, idx) => idx !== i))}
                        className="ml-3 w-12 h-12 bg-rose-50 rounded-xl justify-center items-center"
                      >
                        <Ionicons name="close" size={20} color="#F43F5E" />
                      </TouchableOpacity>
                    </View>
                  ))}
                  <TouchableOpacity
                    onPress={() => setPlanFeatures([...planFeatures, ''])}
                    className="py-3 border-2 border-dashed border-slate-200 rounded-2xl items-center mt-2"
                  >
                    <Text className="text-slate-400 font-black text-xs">+ Add Another Feature</Text>
                  </TouchableOpacity>
                </View>

                <View className="bg-slate-50 rounded-[32px] p-6 flex-row items-center justify-between border border-slate-100">
                  <View>
                    <Text className="text-slate-900 font-black">Active Status</Text>
                    <Text className="text-slate-400 text-xs font-bold">Visible to users immediately</Text>
                  </View>
                  <Switch
                    value={isActive} onValueChange={setIsActive}
                    trackColor={{ false: '#E2E8F0', true: '#10B981' }}
                    thumbColor="#white"
                  />
                </View>
              </View>

              <View className="flex-row mt-10 space-x-4">
                <TouchableOpacity onPress={() => setPlanModalVisible(false)} className="flex-1 py-4 items-center"><Text className="text-slate-400 font-black">Cancel</Text></TouchableOpacity>
                <TouchableOpacity onPress={handleSavePlan} className="flex-[2] rounded-3xl overflow-hidden">
                  <LinearGradient colors={['#4F46E5', '#3730A3']} className="py-4 items-center">
                    <Text className="text-white font-black text-lg">{isEditMode ? 'Update Plan' : 'Create Plan'}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default SubscriptionManagementScreen;