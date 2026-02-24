import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Modal,
  ScrollView,
  Alert,
  Linking,
  TextInput,
  Animated,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { get, post } from '../../lib/api';
import { endpoints } from '../../config/apiConfig';

const { width } = Dimensions.get('window');

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

const CarWashApprovalScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('Pending');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [data, setData] = useState({ pending: [], approved: [], rejected: [] });
  const [selectedItem, setSelectedItem] = useState(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    animateScreen();
    fetchData();
  }, []);

  const animateScreen = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(slideUpAnim, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true })
    ]).start();
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await get(endpoints.admin.approvals);
      // Backend returns a flat array of all items
      const allItems = Array.isArray(response) ? response : [];
      console.log('[CarWash] Total items in response:', allItems.length);
      console.log('[CarWash] Types in response:', allItems.map(i => i.type));
      const centers = allItems.filter(i => i.type === 'CENTER');
      console.log('[CarWash] Centers found:', centers.length, centers.map(c => ({ name: c.name, status: c.status })));

      setData({
        // PENDING_ONBOARDING = registered but not yet approved by admin
        // PENDING_APPROVAL = submitted for review
        pending: centers.filter(i =>
          i.status === 'PENDING_ONBOARDING' ||
          i.status === 'PENDING_APPROVAL' ||
          i.status === 'PENDING'
        ),
        approved: centers.filter(i => i.status === 'ACTIVE' || i.status === 'APPROVED'),
        rejected: centers.filter(i => i.status === 'REJECTED'),
      });
    } catch (error) {
      console.error('Fetch error:', error);
      Alert.alert('Error', 'Unable to load approval data.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (item) => {
    if (!item || !item.id) return;
    setDetailsModalVisible(false);
    try {
      await post(endpoints.admin.approve, { id: item.id, action: 'APPROVE', type: 'CENTER' });
      Alert.alert('Success', 'Car wash center approved successfully.');
      fetchData();
    } catch (error) {
      Alert.alert('Error', error.message || 'Approval failed.');
    }
  };

  const handleReject = async () => {
    if (!selectedItem || !rejectionReason.trim()) {
      Alert.alert('Required', 'Please enter a rejection reason.');
      return;
    }
    try {
      await post(endpoints.admin.approve, {
        id: selectedItem.id,
        action: 'REJECT',
        type: 'CENTER',
        reason: rejectionReason
      });
      Alert.alert('Rejected', 'Registration has been rejected.');
      setRejectModalVisible(false);
      setRejectionReason('');
      fetchData();
    } catch (error) {
      Alert.alert('Error', error.message || 'Rejection failed.');
    }
  };

  const filteredData = useMemo(() => {
    const currentList = activeTab === 'Pending' ? data.pending :
      activeTab === 'Approved' ? data.approved : data.rejected;

    if (!searchQuery.trim()) return currentList;

    const query = searchQuery.toLowerCase();
    return currentList.filter(item =>
      (item.name && item.name.toLowerCase().includes(query)) ||
      (item.ownerName && item.ownerName.toLowerCase().includes(query))
    );
  }, [activeTab, data, searchQuery]);

  const renderCard = ({ item }) => {
    const isApproved = activeTab === 'Approved';
    const isRejected = activeTab === 'Rejected';

    return (
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideUpAnim }] }}>
        <TouchableOpacity activeOpacity={0.9} onPress={() => { setSelectedItem(item); setDetailsModalVisible(true); }}>
          <GlassCard className="mb-6 p-5">
            <View className="flex-row items-center mb-4">
              <View className={`w-14 h-14 rounded-2xl justify-center items-center mr-4 ${isApproved ? 'bg-emerald-50' : isRejected ? 'bg-rose-50' : 'bg-blue-50'
                }`}>
                <MaterialIcons
                  name="local-car-wash"
                  size={32}
                  color={isApproved ? '#10B981' : isRejected ? '#F43F5E' : '#3B82F6'}
                />
              </View>
              <View className="flex-1">
                <Text className="text-slate-900 text-lg font-black" numberOfLines={1}>
                  {String(item.name || item.centerName || 'N/A')}
                </Text>
                <Text className="text-slate-500 text-xs font-bold uppercase tracking-wider">
                  Owned by {String(item.ownerName || 'N/A')}
                </Text>
              </View>
              <View className={`px-3 py-1 rounded-full ${isApproved ? 'bg-emerald-100' : isRejected ? 'bg-rose-100' : 'bg-amber-100'
                }`}>
                <Text className={`text-[10px] font-black uppercase ${isApproved ? 'text-emerald-700' : isRejected ? 'text-rose-700' : 'text-amber-700'
                  }`}>
                  {activeTab}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center justify-between border-t border-slate-50 pt-4">
              <View className="flex-row items-center">
                <Ionicons name="location-outline" size={16} color="#94A3B8" />
                <Text className="text-slate-600 text-xs font-bold ml-2" numberOfLines={1}>{String(item.address || item.location || 'N/A')}</Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="calendar-outline" size={16} color="#94A3B8" />
                <Text className="text-slate-600 text-xs font-bold ml-2">
                  {item.registeredDate ? new Date(item.registeredDate).toLocaleDateString() : 'N/A'}
                </Text>
              </View>
            </View>

            {activeTab === 'Pending' && (
              <View className="flex-row mt-5 space-x-3">
                <TouchableOpacity
                  onPress={() => handleApprove(item)}
                  className="flex-1 overflow-hidden rounded-2xl"
                  activeOpacity={0.8}
                >
                  <LinearGradient colors={['#10B981', '#059669']} className="py-3 flex-row justify-center items-center">
                    <Ionicons name="checkmark-circle" size={18} color="white" />
                    <Text className="text-white font-black ml-2">Approve</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => { setSelectedItem(item); setRejectModalVisible(true); }}
                  className="flex-1 bg-slate-100 rounded-2xl py-3 flex-row justify-center items-center"
                  activeOpacity={0.8}
                >
                  <Ionicons name="close-circle" size={18} color="#64748B" />
                  <Text className="text-slate-600 font-black ml-2">Reject</Text>
                </TouchableOpacity>
              </View>
            )}
          </GlassCard>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <View className="px-6 pt-14 pb-4 bg-white">
        <View className="flex-row items-center justify-between mb-6">
          <TouchableOpacity onPress={() => navigation.goBack()} className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 justify-center items-center">
            <Ionicons name="chevron-back" size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text className="text-slate-900 text-2xl font-black">Car Wash</Text>
          <TouchableOpacity onPress={fetchData} className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 justify-center items-center">
            <Ionicons name="refresh" size={20} color="#0F172A" />
          </TouchableOpacity>
        </View>

        <View className="flex-row bg-slate-50 p-1.5 rounded-3xl mb-6">
          {['Pending', 'Approved', 'Rejected'].map(tab => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              className={`flex-1 py-3 items-center rounded-2xl ${activeTab === tab ? 'bg-white shadow-sm' : ''}`}
            >
              <Text className={`text-xs font-black uppercase ${activeTab === tab ? 'text-blue-600' : 'text-slate-400'}`}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View className="flex-row items-center bg-slate-50 px-4 rounded-2xl border border-slate-100">
          <Ionicons name="search" size={20} color="#94A3B8" />
          <TextInput
            placeholder={`Search ${activeTab.toLowerCase()} centers...`}
            className="flex-1 py-4 px-3 text-slate-900 font-bold text-sm"
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center"><ActivityIndicator size="large" color="#3B82F6" /></View>
      ) : (
        <FlatList
          data={filteredData}
          keyExtractor={item => String(item.id)}
          renderItem={renderCard}
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40 }}
          ListEmptyComponent={
            <View className="py-20 items-center">
              <Ionicons name="folder-open-outline" size={64} color="#E2E8F0" />
              <Text className="text-slate-400 font-black text-lg mt-4">No Centers Found</Text>
            </View>
          }
        />
      )}

      <Modal visible={detailsModalVisible} transparent animationType="slide">
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-white rounded-t-[40px] p-8 pb-12 h-[80%]">
            <View className="w-16 h-1 bg-slate-200 rounded-full self-center mb-8" />
            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedItem && (
                <View>
                  <View className="items-center mb-8">
                    <View className="w-20 h-20 bg-blue-50 rounded-3xl justify-center items-center mb-4">
                      <MaterialIcons name="business" size={48} color="#3B82F6" />
                    </View>
                    <Text className="text-slate-900 text-2xl font-black text-center">{String(selectedItem.name || selectedItem.centerName || 'N/A')}</Text>
                    <Text className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-1">{String(selectedItem.address || selectedItem.location || 'N/A')}</Text>
                  </View>

                  <View className="bg-slate-50 rounded-[32px] p-6 mb-6">
                    <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-4">Center Details</Text>
                    <View className="space-y-4">
                      <View className="flex-row justify-between">
                        <Text className="text-slate-500 font-bold text-sm">Owner</Text>
                        <Text className="text-slate-900 font-black text-sm">{String(selectedItem.ownerName || 'N/A')}</Text>
                      </View>
                      <View className="flex-row justify-between">
                        <Text className="text-slate-500 font-bold text-sm">Phone</Text>
                        <Text className="text-slate-900 font-black text-sm">{String(selectedItem.phone || 'N/A')}</Text>
                      </View>
                      <View className="flex-row justify-between">
                        <Text className="text-slate-500 font-bold text-sm">Capacity</Text>
                        <Text className="text-slate-900 font-black text-sm">{String(selectedItem.capacity || 'N/A')} Cars/Day</Text>
                      </View>
                    </View>
                  </View>

                  {activeTab === 'Pending' && (
                    <TouchableOpacity onPress={() => handleApprove(selectedItem)} className="rounded-3xl overflow-hidden mb-4">
                      <LinearGradient colors={['#10B981', '#059669']} className="py-4 items-center">
                        <Text className="text-white font-black text-lg">Approve Center</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={() => setDetailsModalVisible(false)} className="bg-slate-100 py-4 rounded-3xl items-center">
                    <Text className="text-slate-600 font-black">Close Details</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={rejectModalVisible} transparent animationType="slide">
        <View className="flex-1 bg-black/40 justify-end">
          <View className="bg-white rounded-t-[40px] p-8 pb-12">
            <View className="w-16 h-1 bg-slate-200 rounded-full self-center mb-8" />
            <Text className="text-slate-900 text-2xl font-black mb-2">Rejection Reason</Text>
            <TextInput
              className="bg-slate-50 rounded-3xl p-6 text-slate-900 h-32 text-left align-top font-bold border border-slate-100"
              placeholder="Reason for rejection..." multiline
              value={rejectionReason} onChangeText={setRejectionReason}
            />
            <View className="flex-row mt-8 space-x-4">
              <TouchableOpacity onPress={() => setRejectModalVisible(false)} className="flex-1 py-4 items-center"><Text className="text-slate-400 font-black">Cancel</Text></TouchableOpacity>
              <TouchableOpacity onPress={handleReject} className="flex-[2] rounded-3xl overflow-hidden">
                <LinearGradient colors={['#F43F5E', '#E11D48']} className="py-4 items-center">
                  <Text className="text-white font-black">Confirm Rejection</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default CarWashApprovalScreen;