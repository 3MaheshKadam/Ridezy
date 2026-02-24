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
    Switch
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useUser } from '../../context/UserContext';
import { get, patch } from '../../lib/api';
import { endpoints, BASE_URL } from '../../config/apiConfig';
import { useFocusEffect } from '@react-navigation/native';

const CenterProfileScreen = ({ navigation }) => {
    const { user, logout } = useUser();
    const [centerProfile, setCenterProfile] = useState({
        name: user?.name || 'My Car Wash',
        address: user?.address || 'Location not set',
        logo: null,
        rating: 0,
        totalReviews: 0,
        subscriptionPlan: 'Basic',
    });

    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [isOnline, setIsOnline] = useState(true);
    const [isTogglingStatus, setIsTogglingStatus] = useState(false);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideUpAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        startAnimations();
    }, []);

    useFocusEffect(
        React.useCallback(() => {
            fetchProfileData();
        }, [])
    );

    const fetchProfileData = async () => {
        try {
            const data = await get(endpoints.centers.dashboard);
            if (data && data.dashboardData && data.dashboardData.profile) {
                setCenterProfile(prev => ({ ...prev, ...data.dashboardData.profile }));
            }
        } catch (error) {
            console.log('Error fetching center profile:', error);
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
                    onPress: () => {
                        // navigation.replace('Welcome') handled by context usually, or manual nav
                        navigation.reset({
                            index: 0,
                            routes: [{ name: 'Welcome' }],
                        });
                    }
                }
            ]
        );
    };

    const menuGroups = [
        {
            title: 'Business Management',
            items: [
                {
                    id: 'edit_profile',
                    title: 'Business Profile',
                    subtitle: 'Edit name, address, logo',
                    icon: 'storefront-outline',
                    iconLibrary: 'Ionicons',
                    color: '#3B82F6',
                    onPress: () => navigation.navigate('EditCenterProfile'),
                },
                {
                    id: 'services',
                    title: 'Services & Pricing',
                    subtitle: 'Manage wash packages',
                    icon: 'list-circle-outline',
                    iconLibrary: 'Ionicons',
                    color: '#00C851',
                    onPress: () => navigation.navigate('ServiceManagement'),
                },
                {
                    id: 'staff',
                    title: 'Staff Management',
                    subtitle: 'Manage employees',
                    icon: 'people-outline',
                    iconLibrary: 'Ionicons',
                    color: '#F59E0B',
                    onPress: () => navigation.navigate('StaffManagement'),
                },
            ]
        },
        {
            title: 'Account & Settings',
            items: [
                {
                    id: 'subscription',
                    title: 'Subscription Plan',
                    subtitle: `${centerProfile.subscriptionPlan} Plan`,
                    icon: 'card-outline',
                    iconLibrary: 'Ionicons',
                    color: '#8B5CF6',
                    onPress: () => navigation.navigate('Subscriptions'),
                },
                {
                    id: 'support',
                    title: 'Help & Support',
                    subtitle: 'FAQs, Contact Us',
                    icon: 'help-circle-outline',
                    iconLibrary: 'Ionicons',
                    color: '#6C757D',
                    onPress: () => Alert.alert('Support', 'Support screen coming soon'),
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
                    {/* Logo/Avatar */}
                    <View className="mb-4 relative">
                        <View className="w-24 h-24 bg-gray-100 rounded-full justify-center items-center overflow-hidden border-4 border-white shadow-sm">
                            {centerProfile.logo ? (
                                <Image
                                    source={{ uri: centerProfile.logo.startsWith('/') ? `${BASE_URL}${centerProfile.logo}` : centerProfile.logo }}
                                    style={{ width: 96, height: 96, borderRadius: 48 }}
                                    resizeMode="cover"
                                />
                            ) : (
                                <Ionicons name="business" size={40} color="#9CA3AF" />
                            )}
                        </View>
                        <View className="absolute bottom-0 right-0 bg-green-500 w-6 h-6 rounded-full border-2 border-white" />
                    </View>

                    <Text className="text-2xl font-bold text-primary text-center mb-1">
                        {centerProfile.name}
                    </Text>
                    <Text className="text-secondary text-sm text-center mb-4 px-8" numberOfLines={1}>
                        {centerProfile.address}
                    </Text>

                    {/* Quick Stats Row */}
                    <View className="flex-row items-center bg-gray-50 px-4 py-2 rounded-full border border-gray-100">
                        <Ionicons name="star" size={16} color="#F59E0B" style={{ marginRight: 4 }} />
                        <Text className="text-primary font-bold mr-1">{centerProfile.rating}</Text>
                        <Text className="text-secondary text-xs mr-3">({centerProfile.totalReviews} reviews)</Text>
                        <View className="w-[1px] h-4 bg-gray-300 mr-3" />
                        <Text className="text-accent font-semibold text-xs">{centerProfile.subscriptionPlan}</Text>
                    </View>
                </View>
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
                                    <Text className="text-primary font-semibold">Accepting Bookings</Text>
                                    <Text className="text-secondary text-xs">Toggle center availability</Text>
                                </View>
                            </View>
                            <Switch
                                value={isOnline}
                                onValueChange={async (val) => {
                                    setIsOnline(val);
                                    try {
                                        await patch(endpoints.centers.profile, { status: val ? 'open' : 'closed' });
                                    } catch (err) {
                                        console.error('Failed to update center status:', err);
                                        setIsOnline(!val); // revert on failure
                                    }
                                }}
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
                                    <Text className="text-secondary text-xs">Booking alerts & updates</Text>
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
                                            style={{ backgroundColor: item.color + '15' }} // 10% opacity
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
        </View>
    );
};

export default CenterProfileScreen;
