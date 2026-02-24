import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Animated,
    StatusBar,
    Alert,
    Image,
    Switch,
    Modal,
    Linking,
    Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useUser } from '../../context/UserContext';
import { get, post } from '../../lib/api';
import { endpoints, BASE_URL } from '../../config/apiConfig';
import { useDriverStatus } from '../../hooks/useDriverStatus';

const DriverProfileScreen = ({ navigation }) => {
    const { user, logout } = useUser();
    const { isOnline, toggleStatus: toggleOnlineStatus, fetchStatus: fetchDriverStatus } = useDriverStatus();
    const { width, height } = Dimensions.get('window');
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [showDocsModal, setShowDocsModal] = useState(false);
    // Image preview state
    const [previewModal, setPreviewModal] = useState({ visible: false, url: null, label: '' });
    const [isUploading, setIsUploading] = useState(false);

    // Local state for profile data
    const [driverProfile, setDriverProfile] = useState({
        name: user?.name || user?.fullName || 'Driver Name',
        phone: user?.phone || 'Phone Number',
        avatar: user?.avatar || '👨‍💼',
        rating: 5.0,
        totalTrips: 0,
        memberSince: user?.createdAt ? new Date(user.createdAt).getFullYear().toString() : '2024',
        vehicleName: user?.vehicle?.model || 'Vehicle Model',
        vehicleNumber: user?.vehicle?.plateNumber || 'Vehicle Number',
        verificationStatus: user?.status === 'active' ? 'Verified' : 'Pending',
        documents: {}
    });

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideUpAnim = useRef(new Animated.Value(30)).current;

    // Sync local state when global user context updates
    useEffect(() => {
        if (user) {
            setDriverProfile(prev => ({
                ...prev,
                name: user.name || user.fullName || prev.name,
                phone: user.phone || prev.phone,
                avatar: user.avatar || prev.avatar,
                vehicleName: user.vehicle?.model || prev.vehicleName,
                vehicleNumber: user.vehicle?.plateNumber || prev.vehicleNumber,
            }));
        }
    }, [user]);

    useEffect(() => {
        startAnimations();
        fetchProfileStats();
        fetchDriverStatus();

        // Refresh on focus (returning from edit)
        const unsubscribe = navigation.addListener('focus', () => {
            fetchProfileStats();
            // Also refresh User context if possible, but stats might be sufficient if we use stats for display
            // Actually, we use 'driverProfile' state here. 
            // Let's make sure we also update the basic info from local user if context updated?
            // Or just refetch everything user-related?
            // Simple approach: Refetch stats which we populate.
            // AND we might need to refresh the base UserContext if that's what we are displaying.
        });
        return unsubscribe;
    }, [fetchDriverStatus, navigation]);

    const fetchProfileStats = async () => {
        try {
            const [statsData, userData] = await Promise.all([
                get(endpoints.drivers.stats),
                get(endpoints.auth.me)
            ]);

            if (userData && userData.user) {
                setDriverProfile(prev => ({
                    ...prev,
                    name: userData.user.full_name || userData.user.name,
                    phone: userData.user.phone,
                    avatar: userData.user.avatar || '👨‍💼',
                }));
            }

            if (statsData?.driverProfile) {
                const dp = statsData.driverProfile;
                setDriverProfile(prev => ({
                    ...prev,
                    rating: dp.rating || 5.0,
                    totalTrips: dp.totalTrips || 0,
                    documents: {
                        drivingLicense: dp.licenseUrl,
                        aadharCard: dp.documents?.aadharCard,
                        panCard: dp.documents?.panCard,
                        photo: userData?.user?.avatar || dp.documents?.photo
                    }
                }));
            }
        } catch (error) {
            console.log('Error fetching driver profile:', error);
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

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        await logout();
                        navigation.reset({
                            index: 0,
                            routes: [{ name: 'Welcome' }],
                        });
                    }
                }
            ]
        );
    };

    const formatDocName = (key) => {
        return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    };

    // Open image in-app, PDF in browser
    const openDocumentUrl = async (url, label) => {
        if (!url) return;
        const fullUrl = url.startsWith('/') ? `${BASE_URL}${url}` : url;
        const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(fullUrl);
        if (isImage) {
            setPreviewModal({ visible: true, url: fullUrl, label: label || 'Document' });
        } else {
            try {
                const supported = await Linking.canOpenURL(fullUrl);
                if (supported) await Linking.openURL(fullUrl);
                else Alert.alert('Cannot Open', `Unable to open: ${fullUrl}`);
            } catch {
                Alert.alert('Error', 'Something went wrong opening the document.');
            }
        }
    };

    // Pick a file and upload it to the server, then update local driverProfile state
    const pickAndUploadDocument = async (docKey, label) => {
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

            setIsUploading(true);
            const response = await post(endpoints.common.upload, formDataPayload);
            const fileUrl = response?.url || response?.fileUrl || response?.secure_url;
            if (!fileUrl) throw new Error('Upload failed - no URL returned');

            // Update local document state
            setDriverProfile(prev => ({
                ...prev,
                documents: {
                    ...prev.documents,
                    [docKey]: fileUrl,
                }
            }));

            Alert.alert('Uploaded!', `${label} submitted for review.`);
        } catch (err) {
            console.error('Upload error:', err);
            Alert.alert('Upload Failed', 'Could not upload document. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    const allowedDocuments = {
        drivingLicense: 'Driving License',
        aadharCard: 'Aadhar Card',
        photo: 'Profile Photo'
    };


    const menuGroups = [
        {
            title: 'Work & Earnings',
            items: [
                {
                    id: 'trips',
                    title: 'My Trips',
                    subtitle: 'History & details',
                    icon: 'map-outline',
                    iconLibrary: 'Ionicons',
                    color: '#3B82F6',
                    onPress: () => navigation.navigate('DriverTrips'),
                },
                {
                    id: 'earnings',
                    title: 'Earnings',
                    subtitle: 'Payouts & statements',
                    icon: 'wallet-outline',
                    iconLibrary: 'Ionicons',
                    color: '#F59E0B',
                    onPress: () => navigation.navigate('DriverEarnings'),
                },
            ]
        },
        {
            title: 'Account & Assets',
            items: [
                // REMOVED 'Vehicle Details' as requested
                {
                    id: 'documents',
                    title: 'Documents',
                    subtitle: 'License, RC, Insurance',
                    icon: 'document-text-outline',
                    iconLibrary: 'Ionicons',
                    color: '#8B5CF6',
                    onPress: () => setShowDocsModal(true),
                },
                {
                    id: 'support',
                    title: 'Help & Support',
                    subtitle: 'FAQs, Contact Us',
                    icon: 'help-circle-outline',
                    iconLibrary: 'Ionicons',
                    color: '#6C757D',
                    onPress: () => navigation.navigate('Support'),
                },
            ]
        }
    ];

    return (
        <View className="flex-1 bg-gray-50">
            <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />

            {/* Header with Background */}
            <View className="bg-white pb-6 pt-12 rounded-b-3xl shadow-sm shadow-black/5 z-10">
                <View className="items-center px-6">
                    {/* Avatar */}
                    <View className="mb-4 relative">
                        <View className="w-24 h-24 bg-accent/10 rounded-full justify-center items-center overflow-hidden border-4 border-white shadow-sm">
                            {driverProfile.avatar && (driverProfile.avatar.startsWith('http') || driverProfile.avatar.startsWith('file')) ? (
                                <Image
                                    source={{ uri: driverProfile.avatar }}
                                    className="w-full h-full"
                                    resizeMode="cover"
                                />
                            ) : (
                                <Text className="text-4xl">{driverProfile.avatar || '👨‍💼'}</Text>
                            )}
                        </View>
                        {/* Online Indicator Badge */}
                        <View className={`absolute bottom-0 right-0 w-6 h-6 rounded-full border-2 border-white ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                    </View>

                    <Text className="text-2xl font-bold text-primary text-center mb-1">
                        {driverProfile.name}
                    </Text>
                    <Text className="text-secondary text-sm text-center mb-4 px-8">
                        {driverProfile.phone}
                    </Text>

                    {/* Quick Stats Row */}
                    <View className="flex-row items-center bg-gray-50 px-4 py-2 rounded-full border border-gray-100">
                        <Ionicons name="star" size={16} color="#F59E0B" style={{ marginRight: 4 }} />
                        <Text className="text-primary font-bold mr-1">{driverProfile.rating}</Text>
                        <Text className="text-secondary text-xs mr-3">Rating</Text>

                        <View className="w-[1px] h-4 bg-gray-300 mr-3" />

                        <Ionicons name="map" size={16} color="#3B82F6" style={{ marginRight: 4 }} />
                        <Text className="text-primary font-bold mr-1">{driverProfile.totalTrips}</Text>
                        <Text className="text-secondary text-xs">Trips</Text>
                    </View>

                    {/* Member Since Badge or Vehicle Badge */}
                    <View className="mt-3 bg-blue-50 px-3 py-1 rounded-full">
                        <Text className="text-blue-600 text-xs font-semibold">
                            {user?.vehicle ? `${user.vehicle.make} ${user.vehicle.model} • ${user.vehicle.plateNumber}` : 'No Vehicle Assigned'}
                        </Text>
                    </View>
                </View>
                {/* Edit Profile Button - Absolute Positioned */}
                <TouchableOpacity
                    onPress={() => navigation.navigate('EditDriverProfile')}
                    className="absolute right-6 top-12 bg-gray-100 p-2 rounded-full"
                >
                    <Ionicons name="pencil" size={20} color="#374151" />
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 px-4 pt-6" showsVerticalScrollIndicator={false}>
                <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideUpAnim }] }}>

                    {/* Quick Toggle Settings */}
                    <View className="bg-white rounded-2xl p-4 shadow-sm shadow-black/5 border border-gray-100 mb-6">
                        <View className="flex-row items-center justify-between mb-4">
                            <View className="flex-row items-center">
                                <View className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${isOnline ? 'bg-green-100' : 'bg-gray-100'}`}>
                                    <Ionicons name="power" size={18} color={isOnline ? '#00C851' : '#6C757D'} />
                                </View>
                                <View>
                                    <Text className="text-primary font-semibold">Go Online</Text>
                                    <Text className="text-secondary text-xs">Receive trip requests</Text>
                                </View>
                            </View>
                            <Switch
                                value={isOnline}
                                onValueChange={toggleOnlineStatus}
                                trackColor={{ false: '#E5E7EB', true: '#A7F3D0' }}
                                thumbColor={isOnline ? '#00C851' : '#F4F4F5'}
                            />
                        </View>
                        <View className="w-full h-[1px] bg-gray-100 mb-4" />
                        <View className="flex-row items-center justify-between">
                            <View className="flex-row items-center">
                                <View className="w-8 h-8 bg-blue-100 rounded-full items-center justify-center mr-3">
                                    <Ionicons name="notifications" size={18} color="#3B82F6" />
                                </View>
                                <View>
                                    <Text className="text-primary font-semibold">Notifications</Text>
                                    <Text className="text-secondary text-xs">Trip alerts & offers</Text>
                                </View>
                            </View>
                            <Switch
                                value={notificationsEnabled}
                                onValueChange={setNotificationsEnabled}
                                trackColor={{ false: '#E5E7EB', true: '#BFDBFE' }}
                                thumbColor={notificationsEnabled ? '#3B82F6' : '#F4F4F5'}
                            />
                        </View>
                    </View>

                    {/* Menu Groups */}
                    {menuGroups.map((group, groupIndex) => (
                        <View key={groupIndex} className="mb-6">
                            <Text className="text-secondary text-xs font-bold uppercase tracking-wider mb-3 ml-2">
                                {group.title}
                            </Text>
                            <View className="bg-white rounded-2xl shadow-sm shadow-black/5 border border-gray-100 overflow-hidden">
                                {group.items.map((item, index) => (
                                    <TouchableOpacity
                                        key={item.id}
                                        onPress={item.onPress}
                                        activeOpacity={0.7}
                                        className={`p-4 flex-row items-center ${index !== group.items.length - 1 ? 'border-b border-gray-100' : ''
                                            }`}
                                    >
                                        <View
                                            className="w-10 h-10 rounded-xl justify-center items-center mr-4"
                                            style={{ backgroundColor: item.color + '15' }}
                                        >
                                            <Ionicons name={item.icon} size={22} color={item.color} />
                                        </View>

                                        <View className="flex-1">
                                            <Text className="text-primary text-base font-medium mb-0.5">
                                                {item.title}
                                            </Text>
                                            <Text className="text-secondary text-xs">
                                                {item.subtitle}
                                            </Text>
                                        </View>

                                        <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    ))}

                    {/* Logout Button */}
                    <TouchableOpacity
                        onPress={handleLogout}
                        className="bg-red-50 rounded-2xl p-4 flex-row items-center justify-center mb-10 border border-red-100"
                    >
                        <Ionicons name="log-out-outline" size={20} color="#DC2626" />
                        <Text className="text-red-600 font-bold ml-2">Log Out</Text>
                    </TouchableOpacity>

                </Animated.View>
            </ScrollView>

            {/* DOCUMENTS MODAL */}
            <Modal
                visible={showDocsModal}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowDocsModal(false)}
            >
                <View className="flex-1 bg-gray-50">
                    <View className="p-4 bg-white border-b border-gray-100 flex-row justify-between items-center">
                        <Text className="text-lg font-bold">My Documents</Text>
                        <TouchableOpacity onPress={() => setShowDocsModal(false)} className="bg-gray-100 p-2 rounded-full">
                            <Ionicons name="close" size={24} color="#374151" />
                        </TouchableOpacity>
                    </View>
                    <ScrollView className="p-4">
                        {Object.entries(allowedDocuments).map(([key, label]) => {
                            const url = driverProfile.documents[key];
                            const fullUrl = url ? (url.startsWith('/') ? `${BASE_URL}${url}` : url) : null;
                            const isImage = fullUrl && /\.(jpg|jpeg|png|webp|gif)$/i.test(fullUrl);

                            return (
                                <View key={key} className="bg-white rounded-2xl mb-4 shadow-sm border border-gray-100 overflow-hidden">
                                    {/* Label row */}
                                    <View className="flex-row items-center justify-between p-4 border-b border-gray-50">
                                        <View className="flex-row items-center">
                                            <Ionicons
                                                name={fullUrl ? 'checkmark-circle' : 'cloud-upload-outline'}
                                                size={20}
                                                color={fullUrl ? '#00C851' : '#9CA3AF'}
                                            />
                                            <Text className="text-gray-900 font-bold ml-2">{label}</Text>
                                        </View>
                                        <Text className={`text-xs font-semibold ${fullUrl ? 'text-green-600' : 'text-gray-400'}`}>
                                            {fullUrl ? 'Uploaded' : 'Not Uploaded'}
                                        </Text>
                                    </View>

                                    {/* Thumbnail if image */}
                                    {isImage && (
                                        <TouchableOpacity onPress={() => setPreviewModal({ visible: true, url: fullUrl, label })}>
                                            <Image
                                                source={{ uri: fullUrl }}
                                                style={{ width: '100%', height: 160 }}
                                                resizeMode="cover"
                                            />
                                            <View className="absolute bottom-2 right-2 bg-black/50 px-2 py-1 rounded-full flex-row items-center">
                                                <Ionicons name="expand-outline" size={12} color="#fff" />
                                                <Text className="text-white text-xs ml-1">Tap to expand</Text>
                                            </View>
                                        </TouchableOpacity>
                                    )}

                                    {/* Action buttons */}
                                    <View className="flex-row p-3 gap-2">
                                        {fullUrl && (
                                            <TouchableOpacity
                                                onPress={() => openDocumentUrl(url, label)}
                                                className="flex-1 bg-blue-50 border border-blue-100 py-2.5 rounded-xl items-center"
                                            >
                                                <Text className="text-blue-600 text-sm font-semibold">View</Text>
                                            </TouchableOpacity>
                                        )}
                                        <TouchableOpacity
                                            onPress={() => pickAndUploadDocument(key, label)}
                                            disabled={isUploading}
                                            className={`flex-1 py-2.5 rounded-xl items-center ${fullUrl ? 'bg-gray-100' : 'bg-primary'}`}
                                        >
                                            <Text className={`text-sm font-semibold ${fullUrl ? 'text-gray-700' : 'text-white'}`}>
                                                {isUploading ? 'Uploading...' : fullUrl ? 'Replace' : 'Upload'}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            );
                        })}
                        <View className="h-10" />
                    </ScrollView>
                </View>
            </Modal>

            {/* In-App Image Preview Modal */}
            <Modal
                visible={previewModal.visible}
                transparent={false}
                animationType="slide"
                onRequestClose={() => setPreviewModal(p => ({ ...p, visible: false }))}
            >
                <View style={{ flex: 1, backgroundColor: '#000' }}>
                    <View style={{ paddingTop: 48, paddingBottom: 12, paddingHorizontal: 16, backgroundColor: '#111', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={{ color: '#fff', fontSize: 17, fontWeight: '600', flex: 1 }} numberOfLines={1}>
                            {previewModal.label}
                        </Text>
                        <TouchableOpacity onPress={() => setPreviewModal(p => ({ ...p, visible: false }))} style={{ padding: 8 }}>
                            <Ionicons name="close" size={26} color="#fff" />
                        </TouchableOpacity>
                    </View>
                    <ScrollView contentContainerStyle={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
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

export default DriverProfileScreen;
