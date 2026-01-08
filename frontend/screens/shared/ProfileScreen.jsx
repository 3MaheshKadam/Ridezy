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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import '../../global.css';
import { useUser } from '../../context/UserContext';

const { width, height } = Dimensions.get('window');

const ProfileScreen = ({ navigation }) => {
  const { user } = useUser();

  const [userProfile, setUserProfile] = useState({
    name: user?.name || 'Guest User',
    email: user?.email || 'guest@example.com',
    phone: user?.phone || '+91 00000 00000',
    avatar: '👨‍💼',
    roles: [user?.role?.toLowerCase() || 'carOwner'],
    primaryRole: user?.role?.toLowerCase() || 'carOwner',
    rating: 4.8,
    totalTrips: 24,
    totalEarnings: 12500,
    memberSince: '2023',
    verified: true,
  });

  const [editMode, setEditMode] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [locationTracking, setLocationTracking] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(30)).current;
  const modalSlideAnim = useRef(new Animated.Value(height)).current;

  // Document verification status
  const documentStatus = {
    drivingLicense: { uploaded: true, verified: true },
    aadharCard: { uploaded: true, verified: true },
    vehicleRC: { uploaded: false, verified: false },
    insurance: { uploaded: false, verified: false },
  };

  const menuItems = [
    {
      id: 'trips',
      title: 'My Trips',
      subtitle: `${userProfile.totalTrips} completed`,
      icon: 'car',
      iconLibrary: 'Ionicons',
      onPress: () => Alert.alert('My Trips', 'Trip history will be shown here'),
    },
    {
      id: 'earnings',
      title: 'Earnings',
      subtitle: `₹${userProfile.totalEarnings} total`,
      icon: 'wallet',
      iconLibrary: 'Ionicons',
      showForRoles: ['driver'],
      onPress: () => Alert.alert('Earnings', 'Earnings details will be shown here'),
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
      onPress: () => Alert.alert('My Vehicles', 'Vehicle management will be shown here'),
    },
    {
      id: 'payment',
      title: 'Payment Methods',
      subtitle: 'Cards, wallets & more',
      icon: 'card',
      iconLibrary: 'Ionicons',
      onPress: () => Alert.alert('Payment Methods', 'Payment management will be shown here'),
    },
    {
      id: 'referral',
      title: 'Refer & Earn',
      subtitle: 'Invite friends, earn rewards',
      icon: 'gift',
      iconLibrary: 'Ionicons',
      onPress: () => Alert.alert('Refer & Earn', 'Referral program details will be shown here'),
    },
    {
      id: 'support',
      title: 'Help & Support',
      subtitle: 'Get help or contact us',
      icon: 'help-circle',
      iconLibrary: 'Ionicons',
      onPress: () => navigation.navigate('Support'),
    },
    {
      id: 'settings',
      title: 'Settings',
      subtitle: 'Privacy, notifications & more',
      icon: 'settings',
      iconLibrary: 'Ionicons',
      onPress: () => Alert.alert('Settings', 'Settings will be shown here'),
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
    // TODO: Load user profile from AsyncStorage/API
    try {
      // const profile = await getUserProfile();
      // setUserProfile(profile);
    } catch (error) {
      console.log('Profile load error:', error);
    }
  };

  const handleSaveProfile = async () => {
    setIsLoading(true);

    try {
      // TODO: Update user profile via API
      await new Promise(resolve => setTimeout(resolve, 1000));

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
              className="w-24 h-24 bg-accent/10 rounded-3xl justify-center items-center mb-4"
              activeOpacity={0.8}
            >
              <Text className="text-5xl">{userProfile.avatar}</Text>
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
              />
            ) : (
              <Text className="text-primary text-base font-medium">
                {userProfile.phone}
              </Text>
            )}
          </View>
        </Animated.View>

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
                      {docType.replace(/([A-Z])/g, ' $1').trim()}
                    </Text>
                    <View className="flex-row items-center">
                      <Ionicons
                        name={status.verified ? "checkmark-circle" : status.uploaded ? "time" : "close-circle"}
                        size={16}
                        color={status.verified ? "#00C851" : status.uploaded ? "#F59E0B" : "#dc2626"}
                      />
                      <Text className={`text-sm font-medium ml-2 ${status.verified ? 'text-green-600' : status.uploaded ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                        {status.verified ? 'Verified' : status.uploaded ? 'Under Review' : 'Not Uploaded'}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={() => Alert.alert('Document Upload', `Upload ${docType} functionality will be implemented`)}
                    className={`px-4 py-2 rounded-xl ${status.verified ? 'bg-green-100' : 'bg-accent/10'
                      }`}
                    activeOpacity={0.8}
                  >
                    <Text className={`text-sm font-semibold ${status.verified ? 'text-green-600' : 'text-accent'
                      }`}>
                      {status.verified ? 'View' : status.uploaded ? 'Update' : 'Upload'}
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
    </View>
  );
};

export default ProfileScreen;