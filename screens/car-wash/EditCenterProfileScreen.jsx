import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    StatusBar,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Modal,
    Dimensions,
    Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import * as ImagePicker from 'expo-image-picker';
import { get, patch } from '../../lib/api';
import { reverseGeocode } from '../../lib/locationService';
import { endpoints } from '../../config/apiConfig';
import '../../global.css';

const { width, height } = Dimensions.get('window');

const EditCenterProfileScreen = ({ navigation }) => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Profile State
    const [formData, setFormData] = useState({
        businessName: '',
        contactPhone: '',
        description: '',
        logo: '', // URL string for now
        address: '',
        location: { lat: 18.5204, lng: 73.8567 }
    });

    // Map State
    const [showMapModal, setShowMapModal] = useState(false);
    const [tempLocation, setTempLocation] = useState(null);
    const [tempAddress, setTempAddress] = useState('');

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const data = await get(endpoints.centers.dashboard);
            if (data && data.dashboardData && data.dashboardData.profile) {
                const p = data.dashboardData.profile;
                // The dashboard endpoint returns flattened profile data, 
                // but we might need to hit the specific profile endpoint if dashboard doesn't have all fields.
                // Let's assume for now we use the values we have, or re-fetch from a dedicated GET profile if needed.
                // Actually, let's hit endpoints.centers.profile? Currently that's just PATCH.
                // We'll rely on dashboard data matching our needs for now, or just use what's available.
                // Wait, dashboard data might not have 'contactPhone' yet as I just added it.
                // I should probably add a GET to /api/centers/profile or just ensure dashboard returns it.
                // For now, let's use what we have and default to empty.

                // Actually, to be safe, let's modify the GET dashboard to return the new fields if I haven't already.
                // I checked dashboard route, it returns `centerProfile` object mixed with user data. 
                // It should return the new fields if they exist in DB.

                setFormData({
                    businessName: p.name || '',
                    contactPhone: p.contactPhone || '',
                    description: p.description || '',
                    logo: p.logo || '',
                    address: p.address || '',
                    location: {
                        lat: data.dashboardData.profile.location?.lat || 18.5204,
                        lng: data.dashboardData.profile.location?.lng || 73.8567
                    }
                });

                // If we really want full raw profile, we might need a dedicated GET,
                // but let's try this first.
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.businessName) {
            Alert.alert('Error', 'Business Name is required');
            return;
        }

        setSaving(true);
        try {
            await patch(endpoints.centers.profile, {
                businessName: formData.businessName,
                contactPhone: formData.contactPhone,
                description: formData.description,
                logo: formData.logo,
                location: {
                    address: formData.address,
                    lat: formData.location.lat,
                    lng: formData.location.lng
                }
            });

            Alert.alert('Success', 'Profile updated successfully', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const handleLocationSelect = async (e) => {
        const { latitude, longitude } = e.nativeEvent.coordinate;
        setTempLocation({ lat: latitude, lng: longitude });

        // Reverse Geocode
        const data = await reverseGeocode(latitude, longitude);
        if (data && data.address) {
            setTempAddress(data.address);
        }
    };

    const confirmLocation = () => {
        if (tempLocation) {
            setFormData(prev => ({
                ...prev,
                location: tempLocation,
                address: tempAddress || prev.address
            }));
            setShowMapModal(false);
        }
    };

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-gray-50">
                <ActivityIndicator size="large" color="#00C851" />
            </View>
        );
    }

    const pickImage = async () => {
        // No permissions request is necessary for launching the image library
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
            base64: true, // Optional: if backend expects base64, otherwise use uri for upload
        });

        console.log(result);

        if (!result.canceled) {
            // IF backend supports Base64 direct save:
            // const base64Img = `data:image/jpeg;base64,${result.assets[0].base64}`;
            // setFormData(prev => ({ ...prev, logo: base64Img }));

            // For now, using URI - Backend might need to upload this first.
            // Since we don't have a rigid file upload flow yet, we'll try setting the URI 
            // (Note: Local URIs won't persist across devices unless uploaded)
            // Ideally: Upload to /api/upload -> get URL -> setFormData(url)

            // Assuming for now User can also just paste URL. 
            // We will set the URI for preview.
            setFormData(prev => ({ ...prev, logo: result.assets[0].uri }));
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 bg-gray-50"
        >
            <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />

            <View className="flex-1">
                {/* Header */}
                <View className="bg-white pt-12 pb-4 px-6 shadow-sm shadow-black/5 z-10 flex-row items-center justify-between">
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        className="w-10 h-10 bg-gray-100 rounded-2xl justify-center items-center"
                    >
                        <Ionicons name="chevron-back" size={20} color="#1A1B23" />
                    </TouchableOpacity>
                    <Text className="text-primary text-lg font-semibold">Edit Profile</Text>
                    <View className="w-10" />
                </View>

                <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>

                    {/* Logo Section */}
                    <View className="items-center mb-8">
                        <TouchableOpacity onPress={pickImage} activeOpacity={0.8}>
                            <View className="w-24 h-24 bg-gray-200 rounded-full justify-center items-center mb-3 overflow-hidden border-4 border-white shadow-sm relative">
                                {formData.logo ? (
                                    <Image
                                        source={{ uri: formData.logo }}
                                        className="w-full h-full"
                                        resizeMode="cover"
                                    />
                                ) : (
                                    <Ionicons name="image-outline" size={40} color="#9CA3AF" />
                                )}

                                <View className="absolute bottom-0 bg-black/30 w-full h-8 justify-center items-center">
                                    <Ionicons name="camera" size={12} color="white" />
                                </View>
                            </View>
                        </TouchableOpacity>

                        <Text className="text-secondary text-xs mb-2">Tap to change logo</Text>

                        <TextInput
                            className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm text-primary text-center"
                            placeholder="Or paste Logo URL here"
                            value={formData.logo}
                            onChangeText={(t) => setFormData(prev => ({ ...prev, logo: t }))}
                        />
                    </View>

                    {/* Form Fields */}
                    <View className="space-y-4 mb-8">
                        <View>
                            <Text className="text-secondary text-sm mb-1 font-medium ml-1">Business Name</Text>
                            <TextInput
                                className="bg-white border border-gray-200 rounded-xl p-4 text-primary text-base font-medium"
                                value={formData.businessName}
                                onChangeText={(t) => setFormData(prev => ({ ...prev, businessName: t }))}
                                placeholder="My Car Wash"
                            />
                        </View>

                        <View>
                            <Text className="text-secondary text-sm mb-1 font-medium ml-1">Contact Phone</Text>
                            <TextInput
                                className="bg-white border border-gray-200 rounded-xl p-4 text-primary text-base font-medium"
                                value={formData.contactPhone}
                                onChangeText={(t) => setFormData(prev => ({ ...prev, contactPhone: t }))}
                                placeholder="+91 98765 43210"
                                keyboardType="phone-pad"
                            />
                        </View>

                        <View>
                            <Text className="text-secondary text-sm mb-1 font-medium ml-1">Description</Text>
                            <TextInput
                                className="bg-white border border-gray-200 rounded-xl p-4 text-primary text-base font-medium min-h-[100]"
                                value={formData.description}
                                onChangeText={(t) => setFormData(prev => ({ ...prev, description: t }))}
                                placeholder="Tell customers about your services..."
                                multiline
                                textAlignVertical="top"
                            />
                        </View>

                        <View>
                            <Text className="text-secondary text-sm mb-1 font-medium ml-1">Address</Text>
                            <TouchableOpacity
                                onPress={() => {
                                    setTempLocation(formData.location);
                                    setTempAddress(formData.address);
                                    setShowMapModal(true);
                                }}
                                className="bg-white border border-gray-200 rounded-xl p-4 flex-row items-center justify-between"
                            >
                                <View className="flex-1 mr-2">
                                    <Text className="text-primary text-base" numberOfLines={2}>
                                        {formData.address || 'Set Location on Map'}
                                    </Text>
                                </View>
                                <Ionicons name="map-outline" size={24} color="#00C851" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Save Button */}
                    <TouchableOpacity
                        onPress={handleSave}
                        disabled={saving}
                        className="mb-10 rounded-2xl overflow-hidden shadow-lg shadow-accent/20"
                    >
                        <LinearGradient
                            colors={['#00C851', '#00A843']}
                            className="py-4 items-center"
                        >
                            {saving ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text className="text-white font-bold text-lg">Save Changes</Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </ScrollView>
            </View>

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
                            <Ionicons name="close" size={24} color="#1A1B23" />
                        </TouchableOpacity>
                    </View>

                    <MapView
                        provider={PROVIDER_DEFAULT}
                        style={{ flex: 1 }}
                        initialRegion={{
                            latitude: formData.location?.lat || 18.5204,
                            longitude: formData.location?.lng || 73.8567,
                            latitudeDelta: 0.01,
                            longitudeDelta: 0.01,
                        }}
                        onPress={handleLocationSelect}
                    >
                        {(tempLocation || formData.location) && (
                            <Marker
                                coordinate={{
                                    latitude: tempLocation ? tempLocation.lat : formData.location.lat,
                                    longitude: tempLocation ? tempLocation.lng : formData.location.lng,
                                }}
                            />
                        )}
                    </MapView>

                    <View className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 shadow-2xl">
                        <Text className="text-secondary text-sm mb-1 font-medium">Selected Location</Text>
                        <Text className="text-primary text-lg font-bold mb-4">
                            {tempAddress || formData.address || 'Tap on map to select'}
                        </Text>

                        <TouchableOpacity
                            onPress={confirmLocation}
                            className="bg-accent rounded-xl py-4 items-center"
                        >
                            <Text className="text-white font-bold text-base">Confirm Location</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

        </KeyboardAvoidingView>
    );
};

export default EditCenterProfileScreen;
