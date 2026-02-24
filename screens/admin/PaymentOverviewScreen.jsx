import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
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

const PaymentOverviewScreen = ({ navigation }) => {
  // --- State Management ---
  const [selectedPeriod, setSelectedPeriod] = useState('month'); // week, month, year
  const [refreshing, setRefreshing] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(30)).current;

  // Mock payment data (In production, this would come from an API)
  const [paymentData] = useState({
    totalRevenue: 1245680,
    todayRevenue: 28450,
    weekRevenue: 156780,
    monthRevenue: 645890,
    yearRevenue: 5678900,
    pendingPayments: 45600,
    ownerRevenue: 567890,
    driverRevenue: 345670,
    carwashRevenue: 332120,
    activeSubscriptions: 256,
    expiringThisMonth: 45,
    renewalRate: 85.5,
  });

  const [transactions] = useState([
    { id: '1', type: 'subscription', source: 'owner', userName: 'Amit Sharma', planName: 'Premium Plan', amount: 599, date: new Date().toISOString(), status: 'completed', paymentMethod: 'UPI', transactionId: 'TXN1234567890' },
    { id: '2', type: 'subscription', source: 'carwash', userName: 'Sparkle Auto Wash', planName: 'Business Plan', amount: 1999, date: new Date(Date.now() - 3600000).toISOString(), status: 'completed', paymentMethod: 'Card', transactionId: 'TXN1234567891' },
    { id: '3', type: 'renewal', source: 'driver', userName: 'Rajesh Kumar', planName: 'Professional Plan', amount: 399, date: new Date(Date.now() - 86400000).toISOString(), status: 'completed', paymentMethod: 'Wallet', transactionId: 'TXN1234567892' },
    { id: '4', type: 'subscription', source: 'owner', userName: 'Suresh Patel', planName: 'Starter Plan', amount: 199, date: new Date(Date.now() - 172800000).toISOString(), status: 'pending', paymentMethod: 'UPI', transactionId: 'TXN1234567893' },
  ]);

  useEffect(() => {
    animateScreen();
  }, []);

  const animateScreen = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(slideUpAnim, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true })
    ]).start();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setRefreshing(false);
  };

  const getSourceIcon = (source) => {
    switch (source) {
      case 'owner': return { icon: 'person', color: '#4F46E5', bg: '#EEF2FF' };
      case 'driver': return { icon: 'car-sport', color: '#8B5CF6', bg: '#F5F3FF' };
      case 'carwash': return { icon: 'local-car-wash', color: '#3B82F6', bg: '#EFF6FF' };
      default: return { icon: 'cash', color: '#64748B', bg: '#F8FAFC' };
    }
  };

  const formatCurrency = (amount) => `₹${amount.toLocaleString('en-IN')}`;

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Header */}
      <View className="px-6 pt-14 pb-4 bg-white">
        <View className="flex-row items-center justify-between mb-6">
          <TouchableOpacity onPress={() => navigation.goBack()} className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 justify-center items-center">
            <Ionicons name="chevron-back" size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text className="text-slate-900 text-2xl font-black">Payments</Text>
          <TouchableOpacity className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 justify-center items-center">
            <Ionicons name="download-outline" size={20} color="#0F172A" />
          </TouchableOpacity>
        </View>

        {/* Main Revenue Card */}
        <GlassCard className="p-8 relative">
          <LinearGradient
            colors={['#4F46E5', '#3730A3']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            className="absolute inset-0 opacity-10"
          />
          <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Total Platform Revenue</Text>
          <View className="flex-row items-baseline mb-4">
            <Text className="text-slate-900 text-4xl font-black">{formatCurrency(paymentData.totalRevenue)}</Text>
            <View className="bg-emerald-50 px-2 py-1 rounded-lg ml-3">
              <Text className="text-emerald-600 text-[10px] font-black">+12.5%</Text>
            </View>
          </View>

          <View className="flex-row bg-slate-50 p-1 rounded-2xl">
            {['week', 'month', 'year'].map(p => (
              <TouchableOpacity
                key={p} onPress={() => setSelectedPeriod(p)}
                className={`flex-1 py-2 rounded-xl items-center ${selectedPeriod === p ? 'bg-white shadow-sm' : ''}`}
              >
                <Text className={`text-[10px] font-black uppercase ${selectedPeriod === p ? 'text-indigo-600' : 'text-slate-400'}`}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </GlassCard>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideUpAnim }] }}>

          {/* Stats Grid */}
          <View className="flex-row space-x-4 mb-8">
            <GlassCard className="flex-1 p-5">
              <View className="w-10 h-10 bg-emerald-50 rounded-2xl justify-center items-center mb-3">
                <Ionicons name="stats-chart" size={18} color="#10B981" />
              </View>
              <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Active Plans</Text>
              <Text className="text-slate-900 text-xl font-black">{paymentData.activeSubscriptions}</Text>
            </GlassCard>
            <GlassCard className="flex-1 p-5">
              <View className="w-10 h-10 bg-amber-50 rounded-2xl justify-center items-center mb-3">
                <Ionicons name="time" size={18} color="#F59E0B" />
              </View>
              <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Expiring</Text>
              <Text className="text-slate-900 text-xl font-black">{paymentData.expiringThisMonth}</Text>
            </GlassCard>
          </View>

          {/* Revenue Breakdown */}
          <Text className="text-slate-900 text-lg font-black mb-4 ml-1">Revenue Breakdown</Text>
          <GlassCard className="p-6 mb-8">
            {[
              { label: 'Car Owners', amount: paymentData.ownerRevenue, color: '#4F46E5', icon: 'person' },
              { label: 'Drivers', amount: paymentData.driverRevenue, color: '#8B5CF6', icon: 'car-sport' },
              { label: 'Car Wash', amount: paymentData.carwashRevenue, color: '#3B82F6', icon: 'local-car-wash' }
            ].map((item, idx) => (
              <View key={idx} className={`flex-row items-center ${idx < 2 ? 'mb-6 border-b border-slate-50 pb-6' : ''}`}>
                <View className={`w-12 h-12 rounded-2xl justify-center items-center mr-4`} style={{ backgroundColor: `${item.color}15` }}>
                  {item.icon === 'local-car-wash' ?
                    <MaterialIcons name={item.icon} size={20} color={item.color} /> :
                    <Ionicons name={item.icon} size={20} color={item.color} />
                  }
                </View>
                <View className="flex-1">
                  <Text className="text-slate-900 font-black text-sm">{item.label}</Text>
                  <View className="flex-row items-center mt-1">
                    <View className="flex-1 h-1.5 bg-slate-50 rounded-full overflow-hidden mr-3">
                      <View className="h-full rounded-full" style={{ width: `${(item.amount / paymentData.totalRevenue) * 100}%`, backgroundColor: item.color }} />
                    </View>
                    <Text className="text-slate-500 font-bold text-[10px]">{((item.amount / paymentData.totalRevenue) * 100).toFixed(0)}%</Text>
                  </View>
                </View>
                <Text className="text-slate-900 font-black ml-4">{formatCurrency(item.amount)}</Text>
              </View>
            ))}
          </GlassCard>

          {/* Recent Transactions */}
          <View className="flex-row items-center justify-between mb-4 px-1">
            <Text className="text-slate-900 text-lg font-black">Recent Activity</Text>
            <TouchableOpacity><Text className="text-indigo-600 font-black text-xs">View All</Text></TouchableOpacity>
          </View>
          <GlassCard className="px-5 py-2">
            {transactions.map((t, i) => {
              const source = getSourceIcon(t.source);
              return (
                <TouchableOpacity key={t.id} onPress={() => { setSelectedTransaction(t); setShowTransactionModal(true); }}>
                  <View className={`flex-row items-center py-4 ${i < transactions.length - 1 ? 'border-b border-slate-50' : ''}`}>
                    <View className="w-12 h-12 rounded-2xl justify-center items-center mr-4" style={{ backgroundColor: source.bg }}>
                      {source.icon === 'local-car-wash' ?
                        <MaterialIcons name={source.icon} size={20} color={source.color} /> :
                        <Ionicons name={source.icon} size={20} color={source.color} />
                      }
                    </View>
                    <View className="flex-1">
                      <Text className="text-slate-900 font-black text-sm" numberOfLines={1}>{t.userName}</Text>
                      <Text className="text-slate-400 font-bold text-[10px] tracking-wide uppercase">{t.planName}</Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-slate-900 font-black text-sm">{formatCurrency(t.amount)}</Text>
                      <Text className={`text-[10px] font-black uppercase mt-1 ${t.status === 'completed' ? 'text-emerald-500' : 'text-amber-500'}`}>{t.status}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </GlassCard>
        </Animated.View>
      </ScrollView>

      {/* Transaction Details Modal */}
      <Modal visible={showTransactionModal} transparent animationType="slide">
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-white rounded-t-[40px] p-8 pb-12">
            <View className="w-16 h-1 bg-slate-200 rounded-full self-center mb-8" />
            {selectedTransaction && (
              <View>
                <View className="items-center mb-8">
                  <View className={`w-20 h-20 rounded-[32px] justify-center items-center mb-4 ${selectedTransaction.status === 'completed' ? 'bg-emerald-50' : 'bg-amber-50'}`}>
                    <Ionicons
                      name={selectedTransaction.status === 'completed' ? 'checkmark-circle' : 'time'}
                      size={48} color={selectedTransaction.status === 'completed' ? '#10B981' : '#F59E0B'}
                    />
                  </View>
                  <Text className="text-slate-900 text-3xl font-black">{formatCurrency(selectedTransaction.amount)}</Text>
                  <Text className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-1">{selectedTransaction.status}</Text>
                </View>

                <View className="bg-slate-50 rounded-[32px] p-6 mb-8">
                  <View className="space-y-4">
                    {[
                      { label: 'Customer', value: selectedTransaction.userName },
                      { label: 'Plan', value: selectedTransaction.planName },
                      { label: 'Method', value: selectedTransaction.paymentMethod },
                      { label: 'Ref ID', value: selectedTransaction.transactionId },
                      { label: 'Date', value: new Date(selectedTransaction.date).toLocaleDateString() }
                    ].map((row, idx) => (
                      <View key={idx} className="flex-row justify-between">
                        <Text className="text-slate-500 font-bold text-xs">{row.label}</Text>
                        <Text className="text-slate-900 font-black text-xs">{row.value}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                <TouchableOpacity onPress={() => setShowTransactionModal(false)} className="bg-indigo-600 py-4 rounded-3xl items-center shadow-lg shadow-indigo-200">
                  <Text className="text-white font-black">Close Details</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default PaymentOverviewScreen;