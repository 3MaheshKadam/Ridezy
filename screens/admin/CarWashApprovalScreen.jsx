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
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import '../../global.css';

const { width, height } = Dimensions.get('window');

const CarWashApprovalScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('pending'); // pending, approved, rejected
  const [selectedCenter, setSelectedCenter] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(30)).current;
  const modalSlideAnim = useRef(new Animated.Value(height)).current;

  // Mock data - Replace with API call
  const [pendingCenters, setPendingCenters] = useState([
    {
      id: '1',
      name: 'Sparkle Auto Wash',
      ownerName: 'Rajesh Sharma',
      phone: '+91 98765 43210',
      email: 'rajesh@sparkleauto.com',
      address: 'Shop No. 15, MG Road, Amravati, Maharashtra 444601',
      location: { latitude: 20.9334, longitude: 77.7756 },
      registeredDate: '2025-01-10',
      businessLicense: 'WB2025001234',
      gstNumber: 'GSTN1234567890',
      services: ['Basic Wash', 'Premium Wash', 'Interior Cleaning', 'Detailing'],
      operatingHours: '8:00 AM - 8:00 PM',
      images: ['📷', '📷', '📷'],
      documents: {
        license: 'license.pdf',
        gst: 'gst_certificate.pdf',
        identity: 'aadhar.pdf',
      },
      pricing: {
        basic: 200,
        premium: 400,
        interior: 600,
        detailing: 1500,
      },
    },
    {
      id: '2',
      name: 'Premium Car Care',
      ownerName: 'Amit Patel',
      phone: '+91 87654 32109',
      email: 'amit@premiumcare.com',
      address: 'Plot 23, Industrial Area, Amravati, Maharashtra 444605',
      location: { latitude: 20.9434, longitude: 77.7656 },
      registeredDate: '2025-01-09',
      businessLicense: 'WB2025001235',
      gstNumber: 'GSTN0987654321',
      services: ['Basic Wash', 'Premium Wash', 'Ceramic Coating'],
      operatingHours: '7:00 AM - 9:00 PM',
      images: ['📷', '📷'],
      documents: {
        license: 'license.pdf',
        gst: 'gst_certificate.pdf',
        identity: 'pan.pdf',
      },
      pricing: {
        basic: 250,
        premium: 450,
        ceramic: 5000,
      },
    },
  ]);

  const [approvedCenters, setApprovedCenters] = useState([
    {
      id: '3',
      name: 'Elite Wash Station',
      ownerName: 'Suresh Kumar',
      phone: '+91 76543 21098',
      email: 'suresh@elitewash.com',
      address: 'Near Railway Station, Amravati',
      approvedDate: '2025-01-05',
      status: 'active',
    },
  ]);

  const [rejectedCenters, setRejectedCenters] = useState([
    {
      id: '4',
      name: 'Quick Wash Hub',
      ownerName: 'Prakash Singh',
      phone: '+91 65432 10987',
      email: 'prakash@quickwash.com',
      address: 'Camp Area, Amravati',
      rejectedDate: '2025-01-03',
      reason: 'Incomplete documentation - Missing GST certificate',
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

  const openDetailsModal = (center) => {
    setSelectedCenter(center);
    setShowDetailsModal(true);
    Animated.timing(modalSlideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeDetailsModal = () => {
    Animated.timing(modalSlideAnim, {
      toValue: height,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowDetailsModal(false);
      setSelectedCenter(null);
    });
  };

  const openRejectModal = (center) => {
    setSelectedCenter(center);
    closeDetailsModal();
    setTimeout(() => {
      setShowRejectModal(true);
      Animated.timing(modalSlideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }, 300);
  };

  const closeRejectModal = () => {
    Animated.timing(modalSlideAnim, {
      toValue: height,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowRejectModal(false);
      setRejectionReason('');
      setSelectedCenter(null);
    });
  };

  const handleApprove = async (center) => {
    Alert.alert(
      'Approve Car Wash Center',
      `Are you sure you want to approve "${center.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            try {
              // TODO: API call to approve center
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              // Remove from pending
              setPendingCenters(prev => prev.filter(c => c.id !== center.id));
              
              // Add to approved
              setApprovedCenters(prev => [
                ...prev,
                {
                  ...center,
                  approvedDate: new Date().toISOString().split('T')[0],
                  status: 'active',
                },
              ]);
              
              closeDetailsModal();
              Alert.alert('Success', 'Car wash center approved successfully!');
            } catch (error) {
              Alert.alert('Error', 'Failed to approve center. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      Alert.alert('Required', 'Please provide a reason for rejection.');
      return;
    }

    try {
      // TODO: API call to reject center
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Remove from pending
      setPendingCenters(prev => prev.filter(c => c.id !== selectedCenter.id));
      
      // Add to rejected
      setRejectedCenters(prev => [
        ...prev,
        {
          ...selectedCenter,
          rejectedDate: new Date().toISOString().split('T')[0],
          reason: rejectionReason,
        },
      ]);
      
      closeRejectModal();
      Alert.alert('Rejected', 'Car wash center has been rejected.');
    } catch (error) {
      Alert.alert('Error', 'Failed to reject center. Please try again.');
    }
  };

  const renderPendingCard = (center) => (
    <TouchableOpacity
      key={center.id}
      onPress={() => openDetailsModal(center)}
      className="bg-white rounded-2xl p-4 mb-4 shadow-sm shadow-black/5"
      activeOpacity={0.8}
    >
      <View className="flex-row items-start mb-3">
        <View className="w-14 h-14 bg-blue-50 rounded-2xl justify-center items-center mr-3">
          <MaterialIcons name="car-wash" size={28} color="#3B82F6" />
        </View>
        <View className="flex-1">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-primary text-lg font-bold flex-1">
              {center.name}
            </Text>
            <View className="bg-yellow-50 px-2 py-1 rounded-full">
              <Text className="text-yellow-600 text-xs font-semibold">Pending</Text>
            </View>
          </View>
          <Text className="text-secondary text-sm mb-1">
            Owner: {center.ownerName}
          </Text>
          <Text className="text-secondary text-xs">
            Registered: {new Date(center.registeredDate).toLocaleDateString()}
          </Text>
        </View>
      </View>

      <View className="border-t border-gray-100 pt-3">
        <View className="flex-row items-center mb-2">
          <Ionicons name="location" size={14} color="#6C757D" />
          <Text className="text-secondary text-xs ml-2 flex-1" numberOfLines={1}>
            {center.address}
          </Text>
        </View>
        <View className="flex-row items-center">
          <Ionicons name="call" size={14} color="#6C757D" />
          <Text className="text-secondary text-xs ml-2">{center.phone}</Text>
        </View>
      </View>

      <View className="flex-row mt-4 space-x-3">
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            handleApprove(center);
          }}
          className="flex-1 bg-accent/10 rounded-xl py-3 flex-row justify-center items-center"
          activeOpacity={0.8}
        >
          <Ionicons name="checkmark-circle" size={18} color="#00C851" />
          <Text className="text-accent text-sm font-semibold ml-2">Approve</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            openRejectModal(center);
          }}
          className="flex-1 bg-red-50 rounded-xl py-3 flex-row justify-center items-center"
          activeOpacity={0.8}
        >
          <Ionicons name="close-circle" size={18} color="#dc2626" />
          <Text className="text-red-600 text-sm font-semibold ml-2">Reject</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderApprovedCard = (center) => (
    <View
      key={center.id}
      className="bg-white rounded-2xl p-4 mb-4 shadow-sm shadow-black/5"
    >
      <View className="flex-row items-start">
        <View className="w-14 h-14 bg-green-50 rounded-2xl justify-center items-center mr-3">
          <MaterialIcons name="car-wash" size={28} color="#10B981" />
        </View>
        <View className="flex-1">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-primary text-lg font-bold flex-1">
              {center.name}
            </Text>
            <View className="bg-green-50 px-2 py-1 rounded-full">
              <Text className="text-green-600 text-xs font-semibold">Active</Text>
            </View>
          </View>
          <Text className="text-secondary text-sm mb-1">
            Owner: {center.ownerName}
          </Text>
          <Text className="text-secondary text-xs">
            Approved: {new Date(center.approvedDate).toLocaleDateString()}
          </Text>
        </View>
      </View>

      <View className="border-t border-gray-100 mt-3 pt-3">
        <View className="flex-row items-center mb-2">
          <Ionicons name="location" size={14} color="#6C757D" />
          <Text className="text-secondary text-xs ml-2 flex-1" numberOfLines={1}>
            {center.address}
          </Text>
        </View>
        <View className="flex-row items-center">
          <Ionicons name="call" size={14} color="#6C757D" />
          <Text className="text-secondary text-xs ml-2">{center.phone}</Text>
        </View>
      </View>
    </View>
  );

  const renderRejectedCard = (center) => (
    <View
      key={center.id}
      className="bg-white rounded-2xl p-4 mb-4 shadow-sm shadow-black/5"
    >
      <View className="flex-row items-start">
        <View className="w-14 h-14 bg-red-50 rounded-2xl justify-center items-center mr-3">
          <MaterialIcons name="car-wash" size={28} color="#dc2626" />
        </View>
        <View className="flex-1">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-primary text-lg font-bold flex-1">
              {center.name}
            </Text>
            <View className="bg-red-50 px-2 py-1 rounded-full">
              <Text className="text-red-600 text-xs font-semibold">Rejected</Text>
            </View>
          </View>
          <Text className="text-secondary text-sm mb-1">
            Owner: {center.ownerName}
          </Text>
          <Text className="text-secondary text-xs">
            Rejected: {new Date(center.rejectedDate).toLocaleDateString()}
          </Text>
        </View>
      </View>

      <View className="bg-red-50 rounded-xl p-3 mt-3">
        <Text className="text-red-800 text-xs font-semibold mb-1">
          Rejection Reason:
        </Text>
        <Text className="text-red-600 text-xs">{center.reason}</Text>
      </View>
    </View>
  );

  const getCurrentList = () => {
    switch (activeTab) {
      case 'pending':
        return pendingCenters;
      case 'approved':
        return approvedCenters;
      case 'rejected':
        return rejectedCenters;
      default:
        return [];
    }
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
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="w-10 h-10 bg-gray-100 rounded-2xl justify-center items-center"
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={20} color="#1A1B23" />
          </TouchableOpacity>
          
          <View className="flex-1 items-center">
            <Text className="text-primary text-lg font-semibold">Car Wash Approvals</Text>
          </View>
          
          <TouchableOpacity
            className="w-10 h-10 bg-gray-100 rounded-2xl justify-center items-center"
            activeOpacity={0.7}
          >
            <Ionicons name="filter" size={20} color="#1A1B23" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View className="bg-gray-50 rounded-2xl p-4 flex-row items-center">
          <Ionicons name="search" size={20} color="#6C757D" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search car wash centers..."
            placeholderTextColor="#6C757D"
            className="flex-1 ml-3 text-primary text-base"
          />
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
            onPress={() => setActiveTab('pending')}
            className={`flex-1 py-2 rounded-xl ${
              activeTab === 'pending' ? 'bg-white' : ''
            }`}
            activeOpacity={0.8}
          >
            <View className="items-center">
              <Text
                className={`text-sm font-semibold ${
                  activeTab === 'pending' ? 'text-primary' : 'text-secondary'
                }`}
              >
                Pending
              </Text>
              {pendingCenters.length > 0 && (
                <View className="absolute -top-1 -right-1 bg-yellow-500 w-5 h-5 rounded-full justify-center items-center">
                  <Text className="text-white text-xs font-bold">
                    {pendingCenters.length}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => setActiveTab('approved')}
            className={`flex-1 py-2 rounded-xl ${
              activeTab === 'approved' ? 'bg-white' : ''
            }`}
            activeOpacity={0.8}
          >
            <Text
              className={`text-sm font-semibold text-center ${
                activeTab === 'approved' ? 'text-primary' : 'text-secondary'
              }`}
            >
              Approved
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => setActiveTab('rejected')}
            className={`flex-1 py-2 rounded-xl ${
              activeTab === 'rejected' ? 'bg-white' : ''
            }`}
            activeOpacity={0.8}
          >
            <Text
              className={`text-sm font-semibold text-center ${
                activeTab === 'rejected' ? 'text-primary' : 'text-secondary'
              }`}
            >
              Rejected
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* List */}
      <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideUpAnim }],
          }}
        >
          {getCurrentList().length === 0 ? (
            <View className="items-center justify-center py-20">
              <View className="w-24 h-24 bg-gray-100 rounded-full justify-center items-center mb-4">
                <MaterialIcons name="car-wash" size={40} color="#6C757D" />
              </View>
              <Text className="text-secondary text-base">
                No {activeTab} centers
              </Text>
            </View>
          ) : (
            <>
              {activeTab === 'pending' && getCurrentList().map(renderPendingCard)}
              {activeTab === 'approved' && getCurrentList().map(renderApprovedCard)}
              {activeTab === 'rejected' && getCurrentList().map(renderRejectedCard)}
            </>
          )}
        </Animated.View>
      </ScrollView>

      {/* Details Modal */}
      <Modal
        visible={showDetailsModal}
        transparent={true}
        animationType="none"
        onRequestClose={closeDetailsModal}
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
                <Text className="text-primary text-xl font-bold">Center Details</Text>
              </View>

              {selectedCenter && (
                <>
                  {/* Basic Info */}
                  <View className="bg-gray-50 rounded-2xl p-4 mb-4">
                    <Text className="text-primary text-base font-bold mb-3">
                      Basic Information
                    </Text>
                    <View className="space-y-2">
                      <View className="flex-row justify-between">
                        <Text className="text-secondary text-sm">Center Name</Text>
                        <Text className="text-primary text-sm font-medium">
                          {selectedCenter.name}
                        </Text>
                      </View>
                      <View className="flex-row justify-between">
                        <Text className="text-secondary text-sm">Owner</Text>
                        <Text className="text-primary text-sm font-medium">
                          {selectedCenter.ownerName}
                        </Text>
                      </View>
                      <View className="flex-row justify-between">
                        <Text className="text-secondary text-sm">Phone</Text>
                        <Text className="text-primary text-sm font-medium">
                          {selectedCenter.phone}
                        </Text>
                      </View>
                      <View className="flex-row justify-between">
                        <Text className="text-secondary text-sm">Email</Text>
                        <Text className="text-primary text-sm font-medium">
                          {selectedCenter.email}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Business Details */}
                  <View className="bg-gray-50 rounded-2xl p-4 mb-4">
                    <Text className="text-primary text-base font-bold mb-3">
                      Business Details
                    </Text>
                    <View className="space-y-2">
                      <View className="flex-row justify-between">
                        <Text className="text-secondary text-sm">License No.</Text>
                        <Text className="text-primary text-sm font-medium">
                          {selectedCenter.businessLicense}
                        </Text>
                      </View>
                      <View className="flex-row justify-between">
                        <Text className="text-secondary text-sm">GST Number</Text>
                        <Text className="text-primary text-sm font-medium">
                          {selectedCenter.gstNumber}
                        </Text>
                      </View>
                      <View className="flex-row justify-between">
                        <Text className="text-secondary text-sm">Operating Hours</Text>
                        <Text className="text-primary text-sm font-medium">
                          {selectedCenter.operatingHours}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Services */}
                  <View className="bg-gray-50 rounded-2xl p-4 mb-4">
                    <Text className="text-primary text-base font-bold mb-3">
                      Services Offered
                    </Text>
                    <View className="flex-row flex-wrap">
                      {selectedCenter.services.map((service, index) => (
                        <View
                          key={index}
                          className="bg-accent/10 px-3 py-2 rounded-full mr-2 mb-2"
                        >
                          <Text className="text-accent text-xs font-medium">
                            {service}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Location */}
                  <View className="bg-gray-50 rounded-2xl p-4 mb-6">
                    <Text className="text-primary text-base font-bold mb-3">
                      Location
                    </Text>
                    <Text className="text-secondary text-sm">
                      {selectedCenter.address}
                    </Text>
                  </View>

                  {/* Action Buttons */}
                  <View className="flex-row space-x-4">
                    <TouchableOpacity
                      onPress={closeDetailsModal}
                      className="flex-1 bg-gray-200 rounded-2xl py-4 justify-center items-center"
                      activeOpacity={0.8}
                    >
                      <Text className="text-primary text-base font-semibold">
                        Close
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      onPress={() => handleApprove(selectedCenter)}
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
                          Approve
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>

      {/* Reject Modal */}
      <Modal
        visible={showRejectModal}
        transparent={true}
        animationType="none"
        onRequestClose={closeRejectModal}
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
              <Text className="text-primary text-xl font-bold">Reject Application</Text>
            </View>

            <Text className="text-secondary text-sm mb-4">
              Please provide a reason for rejecting this car wash center application:
            </Text>

            <View className="bg-gray-50 rounded-2xl p-4 mb-6">
              <TextInput
                value={rejectionReason}
                onChangeText={setRejectionReason}
                placeholder="Enter rejection reason..."
                placeholderTextColor="#6C757D"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                className="text-primary text-base"
              />
            </View>

            <View className="flex-row space-x-4">
              <TouchableOpacity
                onPress={closeRejectModal}
                className="flex-1 bg-gray-200 rounded-2xl py-4 justify-center items-center"
                activeOpacity={0.8}
              >
                <Text className="text-primary text-base font-semibold">Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={handleReject}
                className="flex-1 bg-red-500 rounded-2xl py-4 justify-center items-center"
                activeOpacity={0.8}
              >
                <Text className="text-white text-base font-semibold">
                  Reject Application
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

export default CarWashApprovalScreen;