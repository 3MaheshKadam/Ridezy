import React, { useState, useEffect } from 'react';
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
    Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { get, patch } from '../../lib/api';
import { endpoints, BASE_URL } from '../../config/apiConfig';
import '../../global.css';
import { useUser } from '../../context/UserContext';

const EditDriverProfileScreen = ({ navigation }) => {
    const { updateProfile } = useUser();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Profile State
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        avatar: '', // URL string
        experience: '',
        vehicleModel: '',
        vehicleNumber: '',
        license: '',
        aadhaar: ''
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            // Fetch User details for basic info
            const userData = await get(endpoints.auth.me);
            // Fetch Driver Stats for Documents
            const statsData = await get(endpoints.drivers.stats);

            if (userData && userData.user) {
                const u = userData.user;
                const dProfile = statsData?.driverProfile || {};

                setFormData({
                    fullName: u.full_name || u.name || '',
                    email: u.email || '',
                    phone: u.phone || '',
                    avatar: u.avatar || '',
                    experience: '5',
                    vehicleModel: u.vehicle?.model || '',
                    vehicleNumber: u.vehicle?.plateNumber || '',
                    // Documents
                    license: dProfile.licenseUrl || '',
                    aadhaar: dProfile.documents?.aadharCard || ''
                });
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.fullName || !formData.phone) {
            Alert.alert('Error', 'Name and Phone are required');
            return;
        }

        setSaving(true);
        try {
            // 1. Upload Avatar if it's a local URI (not http)
            let avatarUrl = formData.avatar;

            if (avatarUrl && !avatarUrl.startsWith('http')) {
                // It's a local URI, upload it
                avatarUrl = await uploadImage(avatarUrl);
            }

            // 2. Upload Documents if local
            let licenseUrl = formData.license;
            if (licenseUrl && !licenseUrl.startsWith('http')) {
                licenseUrl = await uploadImage(licenseUrl);
            }

            let aadhaarUrl = formData.aadhaar;
            if (aadhaarUrl && !aadhaarUrl.startsWith('http')) {
                aadhaarUrl = await uploadImage(aadhaarUrl);
            }

            // 3. Update Profile (User + Driver Docs)
            const response = await patch(endpoints.auth.profile, {
                full_name: formData.fullName,
                phone: formData.phone,
                avatar: avatarUrl,
                license: licenseUrl,
                aadhaar: aadhaarUrl,
            });

            if (response.success) {
                // Update Global Context immediately
                updateProfile({
                    full_name: formData.fullName,
                    name: formData.fullName, // Ensure both variants are set if used
                    phone: formData.phone,
                    avatar: avatarUrl
                });

                Alert.alert('Success', 'Profile updated successfully', [
                    { text: 'OK', onPress: () => navigation.goBack() }
                ]);
            } else {
                throw new Error(response.error || 'Update failed');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', error.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const uploadImage = async (uri) => {
        const formData = new FormData();
        const filename = uri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image`;

        formData.append('file', {
            uri,
            name: filename,
            type
        });

        // Use standard upload endpoint
        // We know BASE_URL from config, but api function handles base url
        // Just need to hit endpoints.common.upload
        const response = await fetch(`${BASE_URL}/api/upload`, {
            method: 'POST',
            body: formData,
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        const data = await response.json();
        if (!data.url && !data.secure_url) throw new Error('Image upload failed');

        // Handle relative URL
        const uplUrl = data.url || data.secure_url;
        const finalUrl = uplUrl.startsWith('http') ? uplUrl : `${BASE_URL}${uplUrl}`;
        return finalUrl;
    };

    const pickImage = async (field) => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            // aspect: [1, 1], // Removed aspect for documents mainly
            quality: 0.5,
        });

        if (!result.canceled) {
            setFormData(prev => ({ ...prev, [field]: result.assets[0].uri }));
        }
    };

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-gray-50">
                <ActivityIndicator size="large" color="#00C851" />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 bg-gray-50"
        >
            <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />

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

                {/* Avatar Section */}
                <View className="items-center mb-8">
                    <TouchableOpacity onPress={() => pickImage('avatar')} activeOpacity={0.8}>
                        <View className="w-24 h-24 bg-gray-200 rounded-full justify-center items-center mb-3 overflow-hidden border-4 border-white shadow-sm relative">
                            {formData.avatar ? (
                                <Image
                                    source={{ uri: formData.avatar.startsWith('http') ? formData.avatar : formData.avatar }}
                                    className="w-full h-full"
                                    resizeMode="cover"
                                />
                            ) : (
                                <Ionicons name="person" size={40} color="#9CA3AF" />
                            )}
                            <View className="absolute bottom-0 bg-black/30 w-full h-8 justify-center items-center">
                                <Ionicons name="camera" size={12} color="white" />
                            </View>
                        </View>
                    </TouchableOpacity>
                    <Text className="text-secondary text-xs">Tap to change photo</Text>
                </View>

                {/* Form Fields */}
                <View className="space-y-4 mb-8">
                    <View>
                        <Text className="text-secondary text-sm mb-1 font-medium ml-1">Full Name</Text>
                        <TextInput
                            className="bg-white border border-gray-200 rounded-xl p-4 text-primary text-base font-medium"
                            value={formData.fullName}
                            onChangeText={(t) => setFormData(prev => ({ ...prev, fullName: t }))}
                            placeholder="Your Name"
                        />
                    </View>

                    <View>
                        <Text className="text-secondary text-sm mb-1 font-medium ml-1">Phone Number</Text>
                        <TextInput
                            className="bg-white border border-gray-200 rounded-xl p-4 text-primary text-base font-medium"
                            value={formData.phone}
                            onChangeText={(t) => setFormData(prev => ({ ...prev, phone: t }))}
                            placeholder="+91..."
                            keyboardType="phone-pad"
                        />
                    </View>

                    <View>
                        <Text className="text-secondary text-sm mb-1 font-medium ml-1">Email (Read Only)</Text>
                        <TextInput
                            className="bg-gray-100 border border-gray-200 rounded-xl p-4 text-gray-500 text-base font-medium"
                            value={formData.email}
                            editable={false}
                        />
                    </View>

                    {/* Documents Section */}
                    <Text className="text-lg font-bold text-gray-800 mt-4 mb-2">Documents</Text>

                    <View>
                        <Text className="text-secondary text-sm mb-2 font-medium ml-1">Driving License</Text>
                        <TouchableOpacity onPress={() => pickImage('license')} className="bg-white border border-gray-200 rounded-xl p-2 h-40 justify-center items-center border-dashed">
                            {formData.license ? (
                                <Image
                                    source={{ uri: formData.license.startsWith('http') ? formData.license : formData.license }}
                                    className="w-full h-full rounded-lg"
                                    resizeMode="contain"
                                />
                            ) : (
                                <View className="items-center">
                                    <Ionicons name="cloud-upload" size={32} color="#9CA3AF" />
                                    <Text className="text-gray-400 text-xs mt-2">Tap to upload License</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>

                    <View>
                        <Text className="text-secondary text-sm mb-2 font-medium ml-1">Aadhaar Card</Text>
                        <TouchableOpacity onPress={() => pickImage('aadhaar')} className="bg-white border border-gray-200 rounded-xl p-2 h-40 justify-center items-center border-dashed">
                            {formData.aadhaar ? (
                                <Image
                                    source={{ uri: formData.aadhaar.startsWith('http') ? formData.aadhaar : formData.aadhaar }}
                                    className="w-full h-full rounded-lg"
                                    resizeMode="contain"
                                />
                            ) : (
                                <View className="items-center">
                                    <Ionicons name="cloud-upload" size={32} color="#9CA3AF" />
                                    <Text className="text-gray-400 text-xs mt-2">Tap to upload Aadhaar</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>

                </View>

                {/* Save Button */}
                <TouchableOpacity
                    onPress={handleSave}
                    disabled={saving}
                    className="mb-10 rounded-2xl overflow-hidden shadow-lg shadow-green-200"
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
        </KeyboardAvoidingView>
    );
};

export default EditDriverProfileScreen;
