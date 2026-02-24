import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  StatusBar,
  Alert,
  Modal,
  Switch,
  Linking,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useUser } from '../../context/UserContext';
import { get, patch, post } from '../../lib/api';
import { endpoints, BASE_URL } from '../../config/apiConfig';
import MapView, { Marker } from 'react-native-maps';
import { reverseGeocode } from '../../lib/locationService';

const { width, height } = Dimensions.get('window');

const ProfileScreen = ({ navigation }) => {
  const { user } = useUser();

  const [userProfile, setUserProfile] = useState({
    name: user?.name || 'Guest User',
    email: user?.email || 'guest@example.com',
    phone: user?.phone || '+91 00000 00000',
    address: user?.address || 'Address not set',
    avatar: '👨‍💼',
    photo: null, // real profile photo URL
    roles: [user?.role?.toLowerCase() || 'carOwner'],
    primaryRole: user?.role?.toLowerCase() || 'carOwner',
    rating: 0,
    totalTrips: 0,
    totalEarnings: 0,
    memberSince: '2023',
    verified: true,
  });
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [editMode, setEditMode] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  // Map State
  const [showMapModal, setShowMapModal] = useState(false);
  const [mapRegion, setMapRegion] = useState({
    latitude: 18.5204, // Default Pune
    longitude: 73.8567,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });
  const [selectedLocation, setSelectedLocation] = useState(null);

  const handleMapPress = async (event) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setSelectedLocation({ latitude, longitude });

    // Optional: Auto fetch address on tap
    const locationData = await reverseGeocode(latitude, longitude);
    if (locationData && locationData.address) {
      setUserProfile(prev => ({ ...prev, address: locationData.address }));
    }
  };

  const confirmMapLocation = () => {
    setShowMapModal(false);
    // Address is already updated in handleMapPress
  };

  const [notifications, setNotifications] = useState(true);
  const [locationTracking, setLocationTracking] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  // Image preview modal for documents
  const [previewModal, setPreviewModal] = useState({ visible: false, url: null, label: '' });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(30)).current;
  const modalSlideAnim = useRef(new Animated.Value(height)).current;

  // Document state — RC & Insurance fetched from registered vehicle
  // Label, backend field key, and live URL from vehicle data
  const [documentStatus, setDocumentStatus] = useState({
    vehicleRC: { label: 'Vehicle RC', uploaded: false, verified: false, url: null },
    insurance: { label: 'Insurance', uploaded: false, verified: false, url: null },
  });

  // Load vehicle docs into profile doc state
  const loadVehicleDocuments = async () => {
    try {
      const res = await get(endpoints.vehicles.list);
      const vehicles = res?.vehicles || res || [];
      if (vehicles.length > 0) {
        const firstVehicle = vehicles[0];
        setDocumentStatus(prev => ({
          ...prev,
          vehicleRC: {
            ...prev.vehicleRC,
            uploaded: !!firstVehicle.rcDocumentUrl,
            verified: !!firstVehicle.isApproved,
            url: firstVehicle.rcDocumentUrl || null,
          },
          insurance: {
            ...prev.insurance,
            uploaded: !!firstVehicle.insuranceUrl,
            verified: !!firstVehicle.isApproved,
            url: firstVehicle.insuranceUrl || null,
          },
        }));
      }
    } catch (e) {
      console.log('Vehicle doc fetch error:', e);
    }
  };

  // Safe URL opener — shows images in-app, opens PDFs in browser
  const openDocumentUrl = async (url, label) => {
    if (!url) {
      Alert.alert('No Document', 'No document URL found for this item.');
      return;
    }
    // Resolve relative path to absolute URL
    const fullUrl = url.startsWith('/') ? `${BASE_URL}${url}` : url;
    // Check if it's an image
    const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(fullUrl);
    if (isImage) {
      // Show in-app preview modal
      setPreviewModal({ visible: true, url: fullUrl, label: label || 'Document' });
    } else {
      // For PDFs or unknown types, open in browser
      try {
        const supported = await Linking.canOpenURL(fullUrl);
        if (supported) {
          await Linking.openURL(fullUrl);
        } else {
          Alert.alert('Cannot Open', `Unable to open:\n${fullUrl}`);
        }
      } catch (err) {
        Alert.alert('Error', 'Something went wrong while opening the document.');
      }
    }
  };

  // Open existing doc URL in browser, or launch DocumentPicker to (re)upload
  const handleDocumentAction = async (docType, status) => {
    if (status.verified && status.url) {
      // View existing doc
      Alert.alert(
        status.label,
        'What would you like to do?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'View Document', onPress: () => openDocumentUrl(status.url, status.label) },
          { text: 'Replace', onPress: () => pickAndUploadDocument(docType) },
        ]
      );
    } else if (status.uploaded && status.url) {
      // Under review — allow view or replace
      Alert.alert(
        `${status.label} — Under Review`,
        'Your document is being reviewed by our team.',
        [
          { text: 'OK', style: 'cancel' },
          { text: 'View', onPress: () => openDocumentUrl(status.url, status.label) },
          { text: 'Replace', onPress: () => pickAndUploadDocument(docType) },
        ]
      );
    } else {
      // Not yet uploaded
      pickAndUploadDocument(docType);
    }
  };

  const pickAndUploadDocument = async (docType) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      const formDataPayload = new FormData();
      formDataPayload.append('file', {
        uri: file.uri,
        name: file.name,
        type: file.mimeType || 'application/octet-stream',
      });

      setIsLoading(true);
      const response = await post(endpoints.common.upload, formDataPayload);
      const fileUrl = response?.url || response?.fileUrl || response?.secure_url;

      if (!fileUrl) throw new Error('Upload failed - no URL returned');

      setDocumentStatus(prev => ({
        ...prev,
        [docType]: {
          ...prev[docType],
          uploaded: true,
          verified: false,
          url: fileUrl,
        }
      }));

      Alert.alert('Uploaded!', `${documentStatus[docType]?.label || docType} submitted for review.`);
    } catch (err) {
      console.error('Upload error:', err);
      Alert.alert('Upload Failed', 'Could not upload document. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const menuItems = [
    {
      id: 'trips',
      title: 'My Trips',
      subtitle: `${userProfile.totalTrips} completed`,
      icon: 'car',
      iconLibrary: 'Ionicons',
      onPress: () => navigation.navigate('OwnerTrips'),
    },
    {
      id: 'earnings',
      title: 'Earnings',
      subtitle: `₹${userProfile.totalEarnings} total`,
      icon: 'wallet',
      iconLibrary: 'Ionicons',
      showForRoles: ['driver'],
      onPress: () => navigation.navigate('DriverEarnings'),
    },
    {
      id: 'documents',
      title: 'Documents',
      subtitle: 'Manage your documents',
      icon: 'document-text',
      iconLibrary: 'Ionicons',
      onPress: () => openDocumentModal(),
    },
    {
      id: 'vehicles',
      title: 'My Vehicles',
      subtitle: 'Add or manage vehicles',
      icon: 'car-sport',
      iconLibrary: 'Ionicons',
      showForRoles: ['carowner', 'driver'],
      onPress: () => Alert.alert('Coming Soon', 'Vehicle management will be available in the next update.'),
    },
    {
      id: 'support',
      title: 'Help & Support',
      subtitle: 'Get help or contact us',
      icon: 'help-circle',
      iconLibrary: 'Ionicons',
      onPress: () => navigation.navigate('Support'),
    },
  ];

  useEffect(() => {
    startAnimations();
    loadUserProfile();
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

  const loadUserProfile = async () => {
    try {
      const [authData, statsData] = await Promise.all([
        get(endpoints.auth.me),
        get(endpoints.user.stats)
      ]);

      if (authData && authData.user) {
        setUserProfile(prev => ({
          ...prev,
          name: authData.user.full_name || authData.user.name || prev.name,
          email: authData.user.email || prev.email,
          phone: authData.user.phone || prev.phone,
          address: authData.user.address || prev.address,
          primaryRole: authData.user.role?.toLowerCase() || prev.primaryRole,
          memberSince: authData.user.createdAt ? new Date(authData.user.createdAt).getFullYear().toString() : prev.memberSince,
          photo: authData.user.photo || authData.user.profilePhoto || null,
        }));
      }

      if (statsData && statsData.stats) {
        setUserProfile(prev => ({
          ...prev,
          rating: statsData.stats.rating || prev.rating,
          totalTrips: statsData.stats.totalTrips || prev.totalTrips,
          totalEarnings: statsData.stats.earnings || prev.totalEarnings,
        }));
      }

      // Fetch vehicle docs separately
      loadVehicleDocuments();
    } catch (error) {
      console.log('Profile load error:', error);
    }
  };

  const pickAndUploadProfilePhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setUploadingPhoto(true);
      try {
        const formPayload = new FormData();
        formPayload.append('file', {
          uri: asset.uri,
          name: 'profile_photo.jpg',
          type: 'image/jpeg',
        });

        const response = await fetch(`${BASE_URL}/api${endpoints.common.upload}`, {
          method: 'POST',
          body: formPayload,
          // Do NOT set Content-Type manually — React Native sets it with the multipart boundary automatically
        });

        const uploadResult = await response.json();
        const photoUrl = uploadResult?.url || asset.uri;

        // Save to backend
        await patch('/auth/profile', { photo: photoUrl });

        // Update local state
        setUserProfile(prev => ({ ...prev, photo: photoUrl }));
        Alert.alert('Success', 'Profile photo updated!');
      } catch (err) {
        console.error('Photo upload failed:', err);
        Alert.alert('Error', 'Failed to upload photo. Please try again.');
      } finally {
        setUploadingPhoto(false);
      }
    }
  };

  const handleSaveProfile = async () => {
    setIsLoading(true);

    try {
      const payload = {
        name: userProfile.name,
        email: userProfile.email,
        address: userProfile.address,
      };
      // We use a new endpoint for updating user profile
      await patch('/auth/profile', payload);

      setEditMode(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const openRoleModal = () => {
    setShowRoleModal(true);
    Animated.timing(modalSlideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeRoleModal = () => {
    Animated.timing(modalSlideAnim, {
      toValue: height,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowRoleModal(false);
    });
  };

  const openDocumentModal = () => {
    setShowDocumentModal(true);
    Animated.timing(modalSlideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeDocumentModal = () => {
    Animated.timing(modalSlideAnim, {
      toValue: height,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowDocumentModal(false);
    });
  };

  const handleRoleAdd = (role) => {
    if (!userProfile.roles.includes(role)) {
      setUserProfile(prev => ({
        ...prev,
        roles: [...prev.roles, role]
      }));
      Alert.alert('Role Added', `You can now access ${role} features!`);
    }
    closeRoleModal();
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            // TODO: Clear user session
            navigation.replace('Welcome');
          }
        }
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: () => Alert.alert('Account Deletion', 'Account deletion process will be implemented')
        }
      ]
    );
  };

  const getFilteredMenuItems = () => {
    return menuItems.filter(item => {
      if (item.showForRoles) {
        return item.showForRoles.some(role => userProfile.roles.includes(role));
      }
      return true;
    });
  };

  const getRoleDisplayName = (role) => {
    const roleNames = {
      carOwner: 'Car Owner',
      driver: 'Driver',
      carWashCenter: 'Car Wash Center',
      admin: 'Admin'
    };
    return roleNames[role] || role;
  };

  const renderIcon = (item) => {
    const IconComponent = item.iconLibrary === 'MaterialIcons' ? MaterialIcons : Ionicons;
    return <IconComponent name={item.icon} size={24} color="#6C757D" />;
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
            <Text className="text-primary text-lg font-semibold">Profile</Text>
          </View>

          <TouchableOpacity
            onPress={() => setEditMode(!editMode)}
            className={`w-10 h-10 rounded-2xl justify-center items-center ${editMode ? 'bg-accent/10' : 'bg-gray-100'
              }`}
            activeOpacity={0.7}
          >
            <Ionicons
              name={editMode ? "checkmark" : "create"}
              size={20}
              color={editMode ? "#00C851" : "#1A1B23"}
            />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideUpAnim }],
          }}
          className="bg-white mx-4 mt-4 rounded-2xl p-6 shadow-sm shadow-black/5 border border-gray-100"
        >
          <View className="items-center mb-6">
            {/* Avatar */}
            <TouchableOpacity
              onPress={pickAndUploadProfilePhoto}
              disabled={uploadingPhoto}
              style={{ width: 96, height: 96, borderRadius: 48, overflow: 'hidden', marginBottom: 16, backgroundColor: '#F0FFF4', justifyContent: 'center', alignItems: 'center' }}
              activeOpacity={0.8}
            >
              {userProfile.photo ? (
                <Image
                  source={{ uri: userProfile.photo.startsWith('/') ? `${BASE_URL}${userProfile.photo}` : userProfile.photo }}
                  style={{ width: 96, height: 96, borderRadius: 48 }}
                  resizeMode="cover"
                />
              ) : (
                <Text style={{ fontSize: 48 }}>{userProfile.avatar}</Text>
              )}
              {/* Camera overlay */}
              <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.35)', height: 28, justifyContent: 'center', alignItems: 'center' }}>
                {uploadingPhoto
                  ? <Text style={{ color: 'white', fontSize: 10 }}>...</Text>
                  : <Ionicons name="camera" size={14} color="white" />}
              </View>
            </TouchableOpacity>

            {/* Name */}
            {editMode ? (
              <TextInput
                value={userProfile.name}
                onChangeText={(text) => setUserProfile(prev => ({ ...prev, name: text }))}
                className="text-primary text-2xl font-bold text-center bg-gray-50 rounded-xl px-4 py-2 mb-2"
                placeholder="Enter your name"
              />
            ) : (
              <Text className="text-primary text-2xl font-bold mb-2">
                {userProfile.name}
              </Text>
            )}

            {/* Role Display */}
            <View className="flex-row items-center mb-3">
              <View className="bg-accent/10 px-3 py-1 rounded-full">
                <Text className="text-accent text-sm font-semibold">
                  {getRoleDisplayName(userProfile.primaryRole)}
                </Text>
              </View>

              {userProfile.roles.length > 1 && (
                <TouchableOpacity
                  onPress={openRoleModal}
                  className="bg-primary/10 px-3 py-1 rounded-full ml-2"
                  activeOpacity={0.7}
                >
                  <Text className="text-primary text-sm font-semibold">
                    +{userProfile.roles.length - 1} more
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Verification Status */}
            <View className="flex-row items-center">
              <Ionicons
                name={userProfile.verified ? "checkmark-circle" : "time"}
                size={16}
                color={userProfile.verified ? "#00C851" : "#F59E0B"}
              />
              <Text className={`text-sm font-medium ml-1 ${userProfile.verified ? 'text-green-600' : 'text-yellow-600'
                }`}>
                {userProfile.verified ? 'Verified Account' : 'Verification Pending'}
              </Text>
            </View>
          </View>

          {/* Stats */}
          <View className="flex-row justify-around border-t border-gray-100 pt-4">
            <View className="items-center">
              <Text className="text-primary text-xl font-bold">
                {userProfile.rating}
              </Text>
              <Text className="text-secondary text-sm">Rating</Text>
            </View>

            <View className="items-center">
              <Text className="text-primary text-xl font-bold">
                {userProfile.totalTrips}
              </Text>
              <Text className="text-secondary text-sm">Trips</Text>
            </View>

            <View className="items-center">
              <Text className="text-primary text-xl font-bold">
                {userProfile.memberSince}
              </Text>
              <Text className="text-secondary text-sm">Member Since</Text>
            </View>
          </View>
        </Animated.View>

        {/* Contact Information */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideUpAnim }],
          }}
          className="bg-white mx-4 mt-4 rounded-2xl p-4 shadow-sm shadow-black/5 border border-gray-100"
        >
          <Text className="text-primary text-lg font-bold mb-4">
            Contact Information
          </Text>

          {/* Email */}
          <View className="mb-4">
            <Text className="text-secondary text-sm font-medium mb-2">
              Email Address
            </Text>
            {editMode ? (
              <TextInput
                value={userProfile.email}
                onChangeText={(text) => setUserProfile(prev => ({ ...prev, email: text }))}
                className="bg-gray-50 rounded-xl px-4 py-3 text-primary text-base"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            ) : (
              <Text className="text-primary text-base font-medium">
                {userProfile.email}
              </Text>
            )}
          </View>

          {/* Phone */}
          <View>
            <Text className="text-secondary text-sm font-medium mb-2">
              Phone Number
            </Text>
            {editMode ? (
              <TextInput
                value={userProfile.phone}
                onChangeText={(text) => setUserProfile(prev => ({ ...prev, phone: text }))}
                className="bg-gray-50 rounded-xl px-4 py-3 text-primary text-base"
                keyboardType="phone-pad"
                editable={false} // Phone usually not editable directly
              />
            ) : (
              <Text className="text-primary text-base font-medium">
                {userProfile.phone}
              </Text>
            )}
          </View>

          {/* Address */}
          <View className="mt-4">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-secondary text-sm font-medium">
                Address
              </Text>
              {editMode && (
                <TouchableOpacity onPress={() => setShowMapModal(true)}>
                  <Text className="text-accent text-sm font-semibold">Select on Map</Text>
                </TouchableOpacity>
              )}
            </View>

            {editMode ? (
              <TextInput
                value={userProfile.address}
                onChangeText={(text) => setUserProfile(prev => ({ ...prev, address: text }))}
                className="bg-gray-50 rounded-xl px-4 py-3 text-primary text-base"
                placeholder="Enter your address"
                multiline
              />
            ) : (
              <Text className="text-primary text-base font-medium">
                {userProfile.address}
              </Text>
            )}
          </View>
        </Animated.View>

        {/* Map Modal */}
        <Modal
          visible={showMapModal}
          animationType="slide"
          onRequestClose={() => setShowMapModal(false)}
        >
          <View className="flex-1 bg-white">
            <View className="absolute top-12 left-4 z-10">
              <TouchableOpacity
                onPress={() => setShowMapModal(false)}
                className="bg-white p-3 rounded-full shadow-lg"
              >
                <Ionicons name="arrow-back" size={24} color="#1A1B23" />
              </TouchableOpacity>
            </View>

            <MapView
              className="flex-1"
              initialRegion={mapRegion}
              onPress={handleMapPress}
            >
              {selectedLocation && (
                <Marker coordinate={selectedLocation} />
              )}
            </MapView>

            <View className="absolute bottom-10 left-6 right-6">
              <View className="bg-white p-4 rounded-2xl shadow-xl mb-4">
                <Text className="text-xs text-secondary mb-1">Selected Location</Text>
                <Text className="text-primary font-medium" numberOfLines={2}>
                  {userProfile.address || "Tap map to select location"}
                </Text>
              </View>
              <TouchableOpacity
                onPress={confirmMapLocation}
                className="bg-accent py-4 rounded-xl items-center shadow-lg"
              >
                <Text className="text-white font-bold text-lg">Confirm Location</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Quick Settings */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideUpAnim }],
          }}
          className="bg-white mx-4 mt-4 rounded-2xl p-4 shadow-sm shadow-black/5 border border-gray-100"
        >
          <Text className="text-primary text-lg font-bold mb-4">
            Preferences
          </Text>

          <View className="space-y-4">
            {/* Notifications */}
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-primary text-base font-medium">
                  Push Notifications
                </Text>
                <Text className="text-secondary text-sm">
                  Receive updates about trips and offers
                </Text>
              </View>
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: '#f3f4f6', true: '#dcfce7' }}
                thumbColor={notifications ? '#00C851' : '#9ca3af'}
                ios_backgroundColor="#f3f4f6"
              />
            </View>

            {/* Location Tracking */}
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-primary text-base font-medium">
                  Location Tracking
                </Text>
                <Text className="text-secondary text-sm">
                  Allow location access for better service
                </Text>
              </View>
              <Switch
                value={locationTracking}
                onValueChange={setLocationTracking}
                trackColor={{ false: '#f3f4f6', true: '#dcfce7' }}
                thumbColor={locationTracking ? '#00C851' : '#9ca3af'}
                ios_backgroundColor="#f3f4f6"
              />
            </View>
          </View>
        </Animated.View>

        {/* Menu Items */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideUpAnim }],
          }}
          className="bg-white mx-4 mt-4 rounded-2xl shadow-sm shadow-black/5 border border-gray-100 overflow-hidden"
        >
          {getFilteredMenuItems().map((item, index) => (
            <TouchableOpacity
              key={item.id}
              onPress={item.onPress}
              activeOpacity={0.7}
              className={`p-4 flex-row items-center ${index !== getFilteredMenuItems().length - 1 ? 'border-b border-gray-100' : ''
                }`}
            >
              <View className="w-10 h-10 bg-gray-100 rounded-2xl justify-center items-center mr-4">
                {renderIcon(item)}
              </View>

              <View className="flex-1">
                <Text className="text-primary text-base font-medium mb-1">
                  {item.title}
                </Text>
                <Text className="text-secondary text-sm">
                  {item.subtitle}
                </Text>
              </View>

              <Ionicons name="chevron-forward" size={20} color="#6C757D" />
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* Add Role Button */}
        {!userProfile.roles.includes('driver') && (
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideUpAnim }],
            }}
            className="mx-4 mt-4"
          >
            <TouchableOpacity
              onPress={openRoleModal}
              activeOpacity={0.8}
              className="rounded-2xl overflow-hidden"
            >
              <LinearGradient
                colors={['#00C851', '#00A843']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  borderRadius: 16,
                  paddingVertical: 16,
                  paddingHorizontal: 24,
                }}
              >
                <View className="flex-row items-center justify-center">
                  <Ionicons name="add-circle" size={20} color="#ffffff" />
                  <Text className="text-white text-lg font-semibold ml-2">
                    Become a Driver
                  </Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Logout & Delete Account */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideUpAnim }],
          }}
          className="mx-4 mt-4 mb-6"
        >
          <TouchableOpacity
            onPress={handleLogout}
            className="bg-white rounded-2xl py-4 px-6 shadow-sm shadow-black/5 border border-gray-200 mb-3"
            activeOpacity={0.8}
          >
            <View className="flex-row justify-center items-center">
              <Ionicons name="log-out-outline" size={20} color="#dc2626" />
              <Text className="text-red-600 text-base font-semibold ml-2">
                Logout
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleDeleteAccount}
            className="bg-white rounded-2xl py-4 px-6 shadow-sm shadow-black/5 border border-red-200"
            activeOpacity={0.8}
          >
            <View className="flex-row justify-center items-center">
              <Ionicons name="trash-outline" size={20} color="#dc2626" />
              <Text className="text-red-600 text-base font-semibold ml-2">
                Delete Account
              </Text>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Save Profile Button (Edit Mode) */}
        {editMode && (
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideUpAnim }],
            }}
            className="mx-4 mb-6"
          >
            <TouchableOpacity
              onPress={handleSaveProfile}
              disabled={isLoading}
              activeOpacity={0.8}
              className="rounded-2xl overflow-hidden"
            >
              <LinearGradient
                colors={isLoading ? ['#cccccc', '#999999'] : ['#00C851', '#00A843']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  borderRadius: 16,
                  paddingVertical: 16,
                  paddingHorizontal: 24,
                }}
              >
                <View className="flex-row items-center justify-center">
                  {isLoading ? (
                    <>
                      <View className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      <Text className="text-white text-lg font-semibold">
                        Saving...
                      </Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="checkmark" size={20} color="#ffffff" />
                      <Text className="text-white text-lg font-semibold ml-2">
                        Save Changes
                      </Text>
                    </>
                  )}
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}
      </ScrollView>

      {/* Role Management Modal */}
      <Modal
        visible={showRoleModal}
        transparent={true}
        animationType="none"
        onRequestClose={closeRoleModal}
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
                Add Role
              </Text>
            </View>

            <View className="space-y-3 mb-6">
              <TouchableOpacity
                onPress={() => handleRoleAdd('driver')}
                className="bg-white rounded-2xl p-4 border-2 border-gray-200 shadow-sm shadow-black/5"
                activeOpacity={0.8}
              >
                <View className="flex-row items-center">
                  <View className="w-12 h-12 bg-accent/10 rounded-2xl justify-center items-center mr-4">
                    <Ionicons name="person" size={24} color="#00C851" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-primary text-lg font-semibold mb-1">
                      Become a Driver
                    </Text>
                    <Text className="text-secondary text-sm">
                      Start earning by providing ride services
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#6C757D" />
                </View>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={closeRoleModal}
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

      {/* Document Modal */}
      <Modal
        visible={showDocumentModal}
        transparent={true}
        animationType="none"
        onRequestClose={closeDocumentModal}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <Animated.View
            style={{
              transform: [{ translateY: modalSlideAnim }],
            }}
            className="bg-white rounded-t-3xl p-6 max-h-[80%]"
          >
            <View className="items-center mb-6">
              <View className="w-12 h-1 bg-gray-300 rounded-full mb-4" />
              <Text className="text-primary text-xl font-bold">
                Documents
              </Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {Object.entries(documentStatus).map(([docType, status]) => (
                <View
                  key={docType}
                  className="bg-gray-50 rounded-2xl p-4 mb-3 flex-row items-center justify-between"
                >
                  <View className="flex-1">
                    <Text className="text-primary text-base font-medium mb-1">
                      {status.label}
                    </Text>
                    <View className="flex-row items-center">
                      <Ionicons
                        name={status.verified ? "checkmark-circle" : status.uploaded ? "time" : "cloud-upload-outline"}
                        size={16}
                        color={status.verified ? "#00C851" : status.uploaded ? "#F59E0B" : "#6C757D"}
                      />
                      <Text className={`text-sm font-medium ml-2 ${status.verified ? 'text-green-600' : status.uploaded ? 'text-yellow-600' : 'text-secondary'
                        }`}>
                        {status.verified ? 'Verified ✓' : status.uploaded ? 'Under Review' : 'Not Uploaded'}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={() => handleDocumentAction(docType, status)}
                    className={`px-4 py-2 rounded-xl ${status.verified ? 'bg-green-100' : status.uploaded ? 'bg-yellow-100' : 'bg-accent/10'
                      }`}
                    activeOpacity={0.8}
                  >
                    <Text className={`text-sm font-semibold ${status.verified ? 'text-green-600' : status.uploaded ? 'text-yellow-700' : 'text-accent'
                      }`}>
                      {status.verified ? 'View / Replace' : status.uploaded ? 'Update' : 'Upload'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity
              onPress={closeDocumentModal}
              className="bg-gray-200 rounded-2xl py-4 justify-center items-center mt-4"
              activeOpacity={0.8}
            >
              <Text className="text-primary text-base font-semibold">
                Close
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

      {/* In-App Document Image Preview Modal */}
      <Modal
        visible={previewModal.visible}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setPreviewModal(p => ({ ...p, visible: false }))}
      >
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          {/* Header */}
          <View style={{
            paddingTop: 48,
            paddingBottom: 12,
            paddingHorizontal: 16,
            backgroundColor: '#111',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <Text style={{ color: '#fff', fontSize: 17, fontWeight: '600', flex: 1 }} numberOfLines={1}>
              {previewModal.label}
            </Text>
            <TouchableOpacity
              onPress={() => setPreviewModal(p => ({ ...p, visible: false }))}
              style={{ padding: 8 }}
              activeOpacity={0.8}
            >
              <Ionicons name="close" size={26} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Image fills the rest of the screen */}
          <ScrollView
            contentContainerStyle={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
            maximumZoomScale={4}
            minimumZoomScale={1}
          >
            {previewModal.url ? (
              <Image
                source={{ uri: previewModal.url }}
                style={{ width: width, height: height * 0.8 }}
                resizeMode="contain"
              />
            ) : (
              <Text style={{ color: '#fff' }}>No image URL</Text>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View >
  );
};

export default ProfileScreen;