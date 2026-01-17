import React, { useState, useRef, useEffect } from 'react';
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
    FlatList,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import '../../global.css';

import { post } from '../../lib/api';
import { endpoints } from '../../config/apiConfig';
import { useUser } from '../../context/UserContext';
import { searchLocations, reverseGeocode } from '../../lib/locationService';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';

const { width, height } = Dimensions.get('window');

const CarWashCenterRegistrationScreen = ({ navigation }) => {
    const { user, login } = useUser();
    const [activeStep, setActiveStep] = useState(1);
    const [formData, setFormData] = useState({
        businessName: '',
        address: '',
        contactPhone: '',
        registrationDoc: null,
        shopLicense: null,
    });
    const [isLoading, setIsLoading] = useState(false);

    // Location Search State
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const searchTimeout = useRef(null);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideUpAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
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
    }, []);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const pickDocument = async (type) => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'image/*'],
            });

            if (!result.canceled) {
                setFormData(prev => ({ ...prev, [type]: result.assets[0] }));
            }
        } catch (err) {
            console.log('Document picker error:', err);
        }
    };

    const validateStep1 = () => {
        if (!formData.businessName || !formData.address || !formData.contactPhone) {
            Alert.alert('Missing Info', 'Please fill in all business details and select a location.');
            return false;
        }
        return true;
    };

    const validateStep2 = () => {
        if (!formData.registrationDoc) {
            Alert.alert('Missing Document', 'Please upload your business registration document.');
            return false;
        }
        return true;
    };

    const handleLocationSearch = (text) => {
        setSearchQuery(text);
        if (searchTimeout.current) clearTimeout(searchTimeout.current);

        if (text.length > 2) {
            setIsSearching(true);
            searchTimeout.current = setTimeout(async () => {
                const results = await searchLocations(text);
                setSearchResults(results);
                setIsSearching(false);
            }, 500);
        } else {
            setSearchResults([]);
            setIsSearching(false);
        }
    };

    const handleSelectLocation = (location) => {
        setSelectedLocation(location);
        setFormData(prev => ({ ...prev, address: location.address }));
        setShowLocationModal(false);
        setSearchQuery('');
        setSearchResults([]);
    };

    const handleSubmit = async () => {
        if (!validateStep2()) return;

        setIsLoading(true);
        try {
            // Mock file upload handling (in real app, upload doc first and get URL)
            const payload = {
                businessName: formData.businessName,
                // Send structured location object supported by backend
                location: selectedLocation ? {
                    lat: selectedLocation.latitude,
                    lng: selectedLocation.longitude,
                    address: selectedLocation.address
                } : {
                    lat: 0,
                    lng: 0,
                    address: formData.address // Fallback
                },
                contactPhone: formData.contactPhone,
                registrationDocUrl: 'https://example.com/shop_act_mock.pdf', // Mock URL
            };

            await post(endpoints.onboarding.center, payload);

            Alert.alert(
                'Submission Successful',
                'Your center details have been submitted for verification.',
                [
                    {
                        text: 'Go to Dashboard',
                        onPress: () => {
                            if (user) {
                                login({ ...user, status: 'PENDING_APPROVAL' });
                            }
                            navigation.replace('CarWashTabs');
                        },
                    },
                ]
            );

        } catch (error) {
            Alert.alert('Submission Failed', error.message || 'Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Map State
    const [mapRegion, setMapRegion] = useState({
        latitude: 18.5204,
        longitude: 73.8567,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
    });

    const handleMapPress = async (e) => {
        const { latitude, longitude } = e.nativeEvent.coordinate;
        setSelectedLocation({ latitude, longitude });

        // Auto-fetch address
        const data = await reverseGeocode(latitude, longitude);
        if (data && data.address) {
            setSelectedLocation(prev => ({ ...prev, address: data.address }));
            setFormData(prev => ({ ...prev, address: data.address }));
        }
    };

    const confirmLocation = () => {
        if (selectedLocation) {
            setFormData(prev => ({ ...prev, address: selectedLocation.address || "Selected Location" }));
            setShowLocationModal(false);
        }
    };

    const renderLocationModal = () => (
        <Modal
            animationType="slide"
            visible={showLocationModal}
            onRequestClose={() => setShowLocationModal(false)}
        >
            <View className="flex-1 bg-white">
                <View className="absolute top-12 left-4 z-10 flex-row items-center">
                    <TouchableOpacity
                        onPress={() => setShowLocationModal(false)}
                        className="bg-white p-3 rounded-full shadow-lg mr-4"
                    >
                        <Ionicons name="close" size={24} color="#1A1B23" />
                    </TouchableOpacity>
                    <View className="bg-white px-4 py-2 rounded-xl shadow-lg flex-1 mr-4">
                        <Text className="text-sm font-bold text-primary" numberOfLines={1}>
                            {selectedLocation?.address || "Tap map to select location"}
                        </Text>
                    </View>
                </View>

                <MapView
                    provider={PROVIDER_DEFAULT}
                    style={{ flex: 1 }}
                    initialRegion={mapRegion}
                    onPress={handleMapPress}
                >
                    {selectedLocation && (
                        <Marker coordinate={selectedLocation}>
                            <View className="bg-green-500 w-6 h-6 rounded-full border-2 border-white shadow-md items-center justify-center">
                                <View className="bg-white w-2 h-2 rounded-full" />
                            </View>
                        </Marker>
                    )}
                </MapView>

                <View className="absolute bottom-8 left-6 right-6">
                    <TouchableOpacity
                        onPress={confirmLocation}
                        disabled={!selectedLocation}
                        className={`p-4 rounded-xl items-center shadow-lg ${selectedLocation ? 'bg-accent' : 'bg-gray-400'}`}
                    >
                        <Text className="text-white font-bold text-lg">Confirm Location</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    return (
        <View className="flex-1 bg-gray-50">
            <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
            {renderLocationModal()}

            {/* Header */}
            <Animated.View
                style={{ opacity: fadeAnim, transform: [{ translateY: slideUpAnim }] }}
                className="bg-white pt-12 pb-4 px-6 shadow-sm shadow-black/5"
            >
                <Text className="text-primary text-xl font-bold">Car Wash Center Registration</Text>
                <Text className="text-secondary text-base">Register your business to start accepting bookings</Text>
            </Animated.View>

            <ScrollView className="flex-1 p-6">
                {activeStep === 1 && (
                    <Animated.View style={{ opacity: fadeAnim }}>
                        <Text className="text-lg font-semibold mb-4 text-primary">Step 1: Business Details</Text>

                        <View className="mb-4">
                            <Text className="text-secondary mb-2">Business Name</Text>
                            <TextInput
                                value={formData.businessName}
                                onChangeText={t => handleInputChange('businessName', t)}
                                className="bg-white p-4 rounded-xl border border-gray-200"
                                placeholder="Enter Business Name"
                            />
                        </View>

                        {/* Enhanced Location Selection */}
                        <View className="mb-4">
                            <Text className="text-secondary mb-2">Shop Location</Text>
                            <TouchableOpacity
                                onPress={() => setShowLocationModal(true)}
                                className="bg-white p-4 rounded-xl border border-gray-200 flex-row items-center justify-between"
                            >
                                <Text className={formData.address ? "text-primary flex-1 mr-2" : "text-gray-400 flex-1 mr-2"}>
                                    {formData.address || "Search & Select Shop Location"}
                                </Text>
                                <Ionicons name="map" size={20} color="#6C757D" />
                            </TouchableOpacity>
                        </View>

                        <View className="mb-6">
                            <Text className="text-secondary mb-2">Contact Phone</Text>
                            <TextInput
                                value={formData.contactPhone}
                                onChangeText={t => handleInputChange('contactPhone', t)}
                                className="bg-white p-4 rounded-xl border border-gray-200"
                                placeholder="Phone Number"
                                keyboardType="phone-pad"
                            />
                        </View>

                        <TouchableOpacity
                            onPress={() => validateStep1() && setActiveStep(2)}
                            className="bg-accent p-4 rounded-xl items-center"
                        >
                            <Text className="text-white font-bold text-lg">Next: Documents</Text>
                        </TouchableOpacity>
                    </Animated.View>
                )}

                {activeStep === 2 && (
                    <Animated.View style={{ opacity: fadeAnim }}>
                        <Text className="text-lg font-semibold mb-4 text-primary">Step 2: Business Documents</Text>

                        <TouchableOpacity
                            onPress={() => pickDocument('registrationDoc')}
                            className="bg-white p-6 rounded-xl border-dashed border-2 border-gray-300 mb-6 items-center"
                        >
                            <Ionicons name={formData.registrationDoc ? "checkmark-circle" : "document-attach"} size={40} color={formData.registrationDoc ? "#00C851" : "#6C757D"} />
                            <Text className="mt-2 text-secondary">{formData.registrationDoc ? formData.registrationDoc.name : "Upload Shop Act / Registration"}</Text>
                        </TouchableOpacity>

                        <View className="flex-row gap-4">
                            <TouchableOpacity
                                onPress={() => setActiveStep(1)}
                                className="flex-1 bg-gray-200 p-4 rounded-xl items-center"
                            >
                                <Text className="text-primary font-bold">Back</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={handleSubmit}
                                disabled={isLoading}
                                className="flex-1 bg-accent p-4 rounded-xl items-center"
                            >
                                {isLoading ? (
                                    <Text className="text-white font-bold">Submitting...</Text>
                                ) : (
                                    <Text className="text-white font-bold text-lg">Submit</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                )}
            </ScrollView>
        </View>
    );
};

export default CarWashCenterRegistrationScreen;
