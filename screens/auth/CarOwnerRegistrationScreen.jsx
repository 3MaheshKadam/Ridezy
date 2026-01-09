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
    Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import '../../global.css';

import { post } from '../../lib/api';
import { endpoints } from '../../config/apiConfig';
import { useUser } from '../../context/UserContext';

const { width, height } = Dimensions.get('window');

const CarOwnerRegistrationScreen = ({ navigation }) => {
    const { user, login } = useUser(); // Update user context after successful onboard
    const [activeStep, setActiveStep] = useState(1);
    const [formData, setFormData] = useState({
        vehicleMake: '',
        vehicleModel: '',
        vehicleNumber: '',
        vehicleColor: '',
        rcDoc: null,
        insuranceDoc: null,
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
                copyToCacheDirectory: true,
            });

            if (result.canceled) return;

            const file = result.assets[0];

            // Upload to backend
            const formData = new FormData();
            formData.append('file', {
                uri: file.uri,
                name: file.name,
                type: file.mimeType || 'application/octet-stream',
            });

            setIsLoading(true);
            console.log('Uploading...', file.name);
            const response = await post(endpoints.common.upload, formData);

            const fileUrl = response.url || response.fileUrl || response.secure_url;
            if (!fileUrl) throw new Error('Upload failed - No URL returned');

            setFormData(prev => ({
                ...prev,
                [type]: {
                    name: file.name,
                    uri: fileUrl // Store the real remote URL
                }
            }));

        } catch (err) {
            console.error('Document upload error:', err);
            Alert.alert('Upload Failed', 'Could not upload document.');
        } finally {
            setIsLoading(false);
        }
    };

    const validateStep1 = () => {
        if (!formData.vehicleMake || !formData.vehicleModel || !formData.vehicleNumber) {
            Alert.alert('Missing Info', 'Please fill in all vehicle details.');
            return false;
        }
        return true;
    };

    const validateStep2 = () => {
        if (!formData.rcDoc || !formData.insuranceDoc) {
            Alert.alert('Missing Documents', 'Please upload both RC and Insurance documents.');
            return false;
        }
        return true;
    };

    const handleSubmit = async () => {
        if (!validateStep2()) return;

        setIsLoading(true);
        try {
            // In a real app, you would upload files to S3/Cloudinary first
            // and get the URLs to send to the backend.
            // For this MVP, we are sending mock URLs or base64 (omitted for brevity).

            const payload = {
                make: formData.vehicleMake,
                model: formData.vehicleModel,
                plateNumber: formData.vehicleNumber,
                rcDocumentUrl: formData.rcDoc.uri,
                insuranceUrl: formData.insuranceDoc.uri,
            };

            await post(endpoints.onboarding.ownerVehicle, payload);

            Alert.alert(
                'Submission Successful',
                'Your vehicle details have been submitted for verification.',
                [
                    {
                        text: 'Go to Dashboard',
                        onPress: () => {
                            // Optimistically update user status (or wait for next login)
                            if (user) {
                                login({ ...user, status: 'PENDING_APPROVAL' });
                            }
                            navigation.replace('CarOwnerTabs');
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
                <Text className="text-primary text-xl font-bold">Vehicle Registration</Text>
                <Text className="text-secondary text-base">Register your vehicle to hire drivers</Text>
            </Animated.View>

            <ScrollView className="flex-1 p-6">
                {activeStep === 1 && (
                    <Animated.View style={{ opacity: fadeAnim }}>
                        <Text className="text-lg font-semibold mb-4 text-primary">Step 1: Vehicle Details</Text>

                        <View className="mb-4">
                            <Text className="text-secondary mb-2">Vehicle Make (e.g. Honda)</Text>
                            <TextInput
                                value={formData.vehicleMake}
                                onChangeText={t => handleInputChange('vehicleMake', t)}
                                className="bg-white p-4 rounded-xl border border-gray-200"
                                placeholder="Enter Make"
                            />
                        </View>
                        <View className="mb-4">
                            <Text className="text-secondary mb-2">Vehicle Model (e.g. City)</Text>
                            <TextInput
                                value={formData.vehicleModel}
                                onChangeText={t => handleInputChange('vehicleModel', t)}
                                className="bg-white p-4 rounded-xl border border-gray-200"
                                placeholder="Enter Model"
                            />
                        </View>
                        <View className="mb-6">
                            <Text className="text-secondary mb-2">Vehicle Number (Plate)</Text>
                            <TextInput
                                value={formData.vehicleNumber}
                                onChangeText={t => handleInputChange('vehicleNumber', t)}
                                className="bg-white p-4 rounded-xl border border-gray-200"
                                placeholder="MH 12 AB 1234"
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
                        <Text className="text-lg font-semibold mb-4 text-primary">Step 2: Upload Documents</Text>

                        <TouchableOpacity
                            onPress={() => pickDocument('rcDoc')}
                            className="bg-white p-6 rounded-xl border-dashed border-2 border-gray-300 mb-4 items-center"
                        >
                            <Ionicons name={formData.rcDoc ? "checkmark-circle" : "document-text"} size={40} color={formData.rcDoc ? "#00C851" : "#6C757D"} />
                            <Text className="mt-2 text-secondary">{formData.rcDoc ? formData.rcDoc.name : "Upload RC Document"}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => pickDocument('insuranceDoc')}
                            className="bg-white p-6 rounded-xl border-dashed border-2 border-gray-300 mb-6 items-center"
                        >
                            <Ionicons name={formData.insuranceDoc ? "checkmark-circle" : "shield-checkmark"} size={40} color={formData.insuranceDoc ? "#00C851" : "#6C757D"} />
                            <Text className="mt-2 text-secondary">{formData.insuranceDoc ? formData.insuranceDoc.name : "Upload Insurance Policy"}</Text>
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

export default CarOwnerRegistrationScreen;
