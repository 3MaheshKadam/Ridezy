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
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import '../../global.css';

import { get, post } from '../../lib/api';
import { endpoints } from '../../config/apiConfig';

const { width, height } = Dimensions.get('window');

const DriverApprovalScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('pending'); // pending, approved, rejected
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(30)).current;
  const modalSlideAnim = useRef(new Animated.Value(height)).current;

  // State for data
  const [pendingDrivers, setPendingDrivers] = useState([]);
  const [approvedDrivers, setApprovedDrivers] = useState([]);
  const [rejectedDrivers, setRejectedDrivers] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await get(endpoints.admin.approvals);
      // Assuming generic endpoint returns all. Filter for DRIVER.
      const data = response || [];
      // Mock filter for now. In real implementation, backend might filter or return structured data.
      const drivers = data.filter(item => item.type === 'DRIVER' || item.licenseNumber); // Heuristic

      setPendingDrivers(drivers.filter(d => d.status === 'PENDING_APPROVAL' || d.status === 'PENDING'));
      setApprovedDrivers(drivers.filter(d => d.status === 'ACTIVE' || d.status === 'APPROVED'));
      setRejectedDrivers(drivers.filter(d => d.status === 'REJECTED'));

    } catch (error) {
      console.log('Error fetching driver approvals:', error);
      setPendingDrivers([
        {
          id: '1',
          name: 'Rajesh Kumar (Demo)',
          photo: '👨‍💼',
          phone: '+91 98765 43210',
          email: 'rajesh.kumar@email.com',
          address: 'Camp Area',
          status: 'PENDING',
          registeredDate: '2025-01-10',
          licenseNumber: 'MH2720150012345',
          vehicleModel: 'Honda City',
          vehicleNumber: 'MH 27 AB 1234',
          experience: '8 years',
          emergencyContact: {
            name: 'Sunita Kumar',
            relation: 'Wife',
            phone: '+91 87654 32109',
          },
          documents: {
            license: 'driving_license.pdf',
          }
        }
      ]);
    }
  };

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

  const openDetailsModal = (driver) => {
    setSelectedDriver(driver);
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
      setSelectedDriver(null);
    });
  };

  const openRejectModal = (driver) => {
    setSelectedDriver(driver);
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
      setSelectedDriver(null);
    });
  };

  const handleApprove = async (driver) => {
    Alert.alert(
      'Approve Driver',
      `Are you sure you want to approve "${driver.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            try {
              // API call to approve driver
              await post(endpoints.admin.approve, { id: driver.id, type: 'DRIVER', action: 'APPROVE' });

              // Remove from pending
              setPendingDrivers(prev => prev.filter(d => d.id !== driver.id));

              // Add to approved
              setApprovedDrivers(prev => [
                ...prev,
                {
                  ...driver,
                  approvedDate: new Date().toISOString().split('T')[0],
                  status: 'APPROVED',
                  rating: 0,
                  totalTrips: 0,
                },
              ]);

              closeDetailsModal();
              Alert.alert('Success', 'Driver approved successfully!');
            } catch (error) {
              Alert.alert('Error', 'Failed to approve driver. Please try again.');
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
      // API call to reject driver
      await post(endpoints.admin.approve, { id: selectedDriver.id, type: 'DRIVER', action: 'REJECT', reason: rejectionReason });

      // Remove from pending
      setPendingDrivers(prev => prev.filter(d => d.id !== selectedDriver.id));

      // Add to rejected
      setRejectedDrivers(prev => [
        ...prev,
        {
          ...selectedDriver,
          rejectedDate: new Date().toISOString().split('T')[0],
          reason: rejectionReason,
          status: 'REJECTED'
        },
      ]);

      closeRejectModal();
      Alert.alert('Rejected', 'Driver application has been rejected.');
    } catch (error) {
      Alert.alert('Error', 'Failed to reject driver. Please try again.');
    }
  };

  const renderPendingCard = (driver) => (
    <TouchableOpacity
      key={driver.id}
      onPress={() => openDetailsModal(driver)}
      className="bg-white rounded-2xl p-4 mb-4 shadow-sm shadow-black/5"
      activeOpacity={0.8}
    >
      <View className="flex-row items-start mb-3">
        <View className="w-14 h-14 bg-purple-50 rounded-2xl justify-center items-center mr-3">
          <Text className="text-3xl">{driver.photo}</Text>
        </View>
        <View className="flex-1">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-primary text-lg font-bold flex-1">
              {driver.name}
            </Text>
            <View className="bg-yellow-50 px-2 py-1 rounded-full">
              <Text className="text-yellow-600 text-xs font-semibold">Pending</Text>
            </View>
          </View>
          <View className="flex-row items-center mb-1">
            <Ionicons name="car-sport" size={12} color="#8B5CF6" />
            <Text className="text-secondary text-sm ml-1">
              {driver.vehicleModel} • {driver.vehicleNumber}
            </Text>
          </View>
          <Text className="text-secondary text-xs">
            Registered: {new Date(driver.registeredDate).toLocaleDateString()}
          </Text>
        </View>
      </View>

      <View className="border-t border-gray-100 pt-3">
        <View className="flex-row items-center mb-2">
          <Ionicons name="briefcase" size={14} color="#6C757D" />
          <Text className="text-secondary text-xs ml-2">
            Experience: {driver.experience}
          </Text>
          <View className="mx-2 w-1 h-1 bg-gray-400 rounded-full" />
          <Ionicons name="card" size={14} color="#6C757D" />
          <Text className="text-secondary text-xs ml-1">
            {driver.licenseNumber}
          </Text>
        </View>
        <View className="flex-row items-center">
          <Ionicons name="call" size={14} color="#6C757D" />
          <Text className="text-secondary text-xs ml-2">{driver.phone}</Text>
        </View>
      </View>

      <View className="flex-row mt-4 space-x-3">
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            handleApprove(driver);
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
            openRejectModal(driver);
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

  const renderApprovedCard = (driver) => (
    <View
      key={driver.id}
      className="bg-white rounded-2xl p-4 mb-4 shadow-sm shadow-black/5"
    >
      <View className="flex-row items-start">
        <View className="w-14 h-14 bg-green-50 rounded-2xl justify-center items-center mr-3">
          <Text className="text-3xl">{driver.photo}</Text>
        </View>
        <View className="flex-1">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-primary text-lg font-bold flex-1">
              {driver.name}
            </Text>
            <View className="bg-green-50 px-2 py-1 rounded-full">
              <Text className="text-green-600 text-xs font-semibold">Active</Text>
            </View>
          </View>
          <View className="flex-row items-center mb-1">
            <Ionicons name="car-sport" size={12} color="#10B981" />
            <Text className="text-secondary text-sm ml-1">
              {driver.vehicleModel} • {driver.vehicleNumber}
            </Text>
          </View>
          <Text className="text-secondary text-xs">
            Approved: {new Date(driver.approvedDate).toLocaleDateString()}
          </Text>
        </View>
      </View>

      <View className="border-t border-gray-100 mt-3 pt-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View className="bg-yellow-50 px-2 py-1 rounded-full mr-2">
              <View className="flex-row items-center">
                <Ionicons name="star" size={12} color="#F59E0B" />
                <Text className="text-yellow-600 text-xs font-semibold ml-1">
                  {driver.rating || 'New'}
                </Text>
              </View>
            </View>
            <Text className="text-secondary text-xs">
              {driver.totalTrips} trips
            </Text>
          </View>
          <View className="flex-row items-center">
            <Ionicons name="call" size={14} color="#6C757D" />
            <Text className="text-secondary text-xs ml-1">{driver.phone}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderRejectedCard = (driver) => (
    <View
      key={driver.id}
      className="bg-white rounded-2xl p-4 mb-4 shadow-sm shadow-black/5"
    >
      <View className="flex-row items-start">
        <View className="w-14 h-14 bg-red-50 rounded-2xl justify-center items-center mr-3">
          <Text className="text-3xl">{driver.photo}</Text>
        </View>
        <View className="flex-1">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-primary text-lg font-bold flex-1">
              {driver.name}
            </Text>
            <View className="bg-red-50 px-2 py-1 rounded-full">
              <Text className="text-red-600 text-xs font-semibold">Rejected</Text>
            </View>
          </View>
          <View className="flex-row items-center mb-1">
            <Ionicons name="car-sport" size={12} color="#dc2626" />
            <Text className="text-secondary text-sm ml-1">
              {driver.vehicleModel}
            </Text>
          </View>
          <Text className="text-secondary text-xs">
            Rejected: {new Date(driver.rejectedDate).toLocaleDateString()}
          </Text>
        </View>
      </View>

      <View className="bg-red-50 rounded-xl p-3 mt-3">
        <Text className="text-red-800 text-xs font-semibold mb-1">
          Rejection Reason:
        </Text>
        <Text className="text-red-600 text-xs">{driver.reason}</Text>
      </View>
    </View>
  );

  const getCurrentList = () => {
    switch (activeTab) {
      case 'pending':
        return pendingDrivers;
      case 'approved':
        return approvedDrivers;
      case 'rejected':
        return rejectedDrivers;
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
            <Text className="text-primary text-lg font-semibold">Driver Approvals</Text>
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
            placeholder="Search drivers..."
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
            className={`flex-1 py-2 rounded-xl ${activeTab === 'pending' ? 'bg-white' : ''
              }`}
            activeOpacity={0.8}
          >
            <View className="items-center">
              <Text
                className={`text-sm font-semibold ${activeTab === 'pending' ? 'text-primary' : 'text-secondary'
                  }`}
              >
                Pending
              </Text>
              {pendingDrivers.length > 0 && (
                <View className="absolute -top-1 -right-1 bg-yellow-500 w-5 h-5 rounded-full justify-center items-center">
                  <Text className="text-white text-xs font-bold">
                    {pendingDrivers.length}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('approved')}
            className={`flex-1 py-2 rounded-xl ${activeTab === 'approved' ? 'bg-white' : ''
              }`}
            activeOpacity={0.8}
          >
            <Text
              className={`text-sm font-semibold text-center ${activeTab === 'approved' ? 'text-primary' : 'text-secondary'
                }`}
            >
              Approved
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('rejected')}
            className={`flex-1 py-2 rounded-xl ${activeTab === 'rejected' ? 'bg-white' : ''
              }`}
            activeOpacity={0.8}
          >
            <Text
              className={`text-sm font-semibold text-center ${activeTab === 'rejected' ? 'text-primary' : 'text-secondary'
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
                <Ionicons name="car-sport" size={40} color="#6C757D" />
              </View>
              <Text className="text-secondary text-base">
                No {activeTab} drivers
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
                <Text className="text-primary text-xl font-bold">Driver Details</Text>
              </View>

              {selectedDriver && (
                <>
                  {/* Profile */}
                  <View className="items-center mb-6">
                    <View className="w-24 h-24 bg-purple-50 rounded-3xl justify-center items-center mb-3">
                      <Text className="text-5xl">{selectedDriver.photo}</Text>
                    </View>
                    <Text className="text-primary text-xl font-bold mb-1">
                      {selectedDriver.name}
                    </Text>
                    <Text className="text-secondary text-sm">
                      {selectedDriver.experience} Experience
                    </Text>
                  </View>

                  {/* Personal Info */}
                  <View className="bg-gray-50 rounded-2xl p-4 mb-4">
                    <Text className="text-primary text-base font-bold mb-3">
                      Personal Information
                    </Text>
                    <View className="space-y-2">
                      <View className="flex-row justify-between">
                        <Text className="text-secondary text-sm">Phone</Text>
                        <Text className="text-primary text-sm font-medium">
                          {selectedDriver.phone}
                        </Text>
                      </View>
                      <View className="flex-row justify-between">
                        <Text className="text-secondary text-sm">Email</Text>
                        <Text className="text-primary text-sm font-medium">
                          {selectedDriver.email}
                        </Text>
                      </View>
                      <View className="flex-row justify-between">
                        <Text className="text-secondary text-sm">Date of Birth</Text>
                        <Text className="text-primary text-sm font-medium">
                          {new Date(selectedDriver.dateOfBirth).toLocaleDateString()}
                        </Text>
                      </View>
                      <View className="flex-row justify-between">
                        <Text className="text-secondary text-sm">Gender</Text>
                        <Text className="text-primary text-sm font-medium">
                          {selectedDriver.gender}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* License Details */}
                  <View className="bg-gray-50 rounded-2xl p-4 mb-4">
                    <Text className="text-primary text-base font-bold mb-3">
                      License Details
                    </Text>
                    <View className="space-y-2">
                      <View className="flex-row justify-between">
                        <Text className="text-secondary text-sm">License No.</Text>
                        <Text className="text-primary text-sm font-medium">
                          {selectedDriver.licenseNumber}
                        </Text>
                      </View>
                      <View className="flex-row justify-between">
                        <Text className="text-secondary text-sm">Expiry Date</Text>
                        <Text className="text-primary text-sm font-medium">
                          {new Date(selectedDriver.licenseExpiry).toLocaleDateString()}
                        </Text>
                      </View>
                      <View className="flex-row justify-between">
                        <Text className="text-secondary text-sm">Experience</Text>
                        <Text className="text-primary text-sm font-medium">
                          {selectedDriver.experience}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Vehicle Details */}
                  <View className="bg-gray-50 rounded-2xl p-4 mb-4">
                    <Text className="text-primary text-base font-bold mb-3">
                      Vehicle Details
                    </Text>
                    <View className="space-y-2">
                      <View className="flex-row justify-between">
                        <Text className="text-secondary text-sm">Type</Text>
                        <Text className="text-primary text-sm font-medium">
                          {selectedDriver.vehicleType}
                        </Text>
                      </View>
                      <View className="flex-row justify-between">
                        <Text className="text-secondary text-sm">Model</Text>
                        <Text className="text-primary text-sm font-medium">
                          {selectedDriver.vehicleModel}
                        </Text>
                      </View>
                      <View className="flex-row justify-between">
                        <Text className="text-secondary text-sm">Number</Text>
                        <Text className="text-primary text-sm font-medium">
                          {selectedDriver.vehicleNumber}
                        </Text>
                      </View>
                      <View className="flex-row justify-between">
                        <Text className="text-secondary text-sm">Color</Text>
                        <Text className="text-primary text-sm font-medium">
                          {selectedDriver.vehicleColor}
                        </Text>
                      </View>
                      <View className="flex-row justify-between">
                        <Text className="text-secondary text-sm">Year</Text>
                        <Text className="text-primary text-sm font-medium">
                          {selectedDriver.vehicleYear}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Documents */}
                  <View className="bg-gray-50 rounded-2xl p-4 mb-4">
                    <Text className="text-primary text-base font-bold mb-3">
                      Documents Submitted
                    </Text>
                    <View className="space-y-2">
                      {Object.entries(selectedDriver.documents)
                        .filter(([key, value]) => {
                          // Filter 1: Must be a valid/allowed document type
                          const isAllowed = ['drivingLicense', 'aadharCard', 'panCard', 'photo'].includes(key);
                          // Filter 2: Must have a valid URL
                          const hasValue = !!value;
                          return isAllowed && hasValue;
                        })
                        .map(([key, value]) => (
                          <View key={key} className="flex-row items-center justify-between">
                            <View className="flex-row items-center flex-1">
                              <Ionicons name="document-text" size={16} color="#8B5CF6" />
                              <Text className="text-secondary text-sm ml-2 capitalize">
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                              </Text>
                            </View>
                            <TouchableOpacity
                              onPress={() => Linking.openURL(value)}
                              className="bg-purple-50 px-3 py-1 rounded-full"
                              activeOpacity={0.8}
                            >
                              <Text className="text-purple-600 text-xs font-semibold">
                                View
                              </Text>
                            </TouchableOpacity>
                          </View>
                        ))}
                    </View>
                  </View>

                  {/* Emergency Contact */}
                  <View className="bg-gray-50 rounded-2xl p-4 mb-6">
                    <Text className="text-primary text-base font-bold mb-3">
                      Emergency Contact
                    </Text>
                    <View className="space-y-2">
                      <View className="flex-row justify-between">
                        <Text className="text-secondary text-sm">Name</Text>
                        <Text className="text-primary text-sm font-medium">
                          {selectedDriver.emergencyContact.name}
                        </Text>
                      </View>
                      <View className="flex-row justify-between">
                        <Text className="text-secondary text-sm">Relation</Text>
                        <Text className="text-primary text-sm font-medium">
                          {selectedDriver.emergencyContact.relation}
                        </Text>
                      </View>
                      <View className="flex-row justify-between">
                        <Text className="text-secondary text-sm">Phone</Text>
                        <Text className="text-primary text-sm font-medium">
                          {selectedDriver.emergencyContact.phone}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Address */}
                  <View className="bg-gray-50 rounded-2xl p-4 mb-6">
                    <Text className="text-primary text-base font-bold mb-3">
                      Address
                    </Text>
                    <Text className="text-secondary text-sm">
                      {selectedDriver.address}
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
                      onPress={() => handleApprove(selectedDriver)}
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
                          Approve Driver
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
              Please provide a reason for rejecting this driver application:
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

export default DriverApprovalScreen;