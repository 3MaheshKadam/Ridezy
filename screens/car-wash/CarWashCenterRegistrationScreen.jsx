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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import '../../global.css';

import { post } from '../../lib/api';
import { endpoints } from '../../config/apiConfig';
import { useUser } from '../../context/UserContext';

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
            Alert.alert('Missing Info', 'Please fill in all business details.');
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

    const handleSubmit = async () => {
        if (!validateStep2()) return;

        setIsLoading(true);
        try {
            // Mock file upload handling
            const payload = {
                businessName: formData.businessName,
                location: formData.address, // Simplifying address to location string for MVP
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

    return (
        <View className="flex-1 bg-gray-50">
            <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />

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
                        <View className="mb-4">
                            <Text className="text-secondary mb-2">Address / Location</Text>
                            <TextInput
                                value={formData.address}
                                onChangeText={t => handleInputChange('address', t)}
                                className="bg-white p-4 rounded-xl border border-gray-200"
                                placeholder="Enter Shop Address"
                                multiline
                            />
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
