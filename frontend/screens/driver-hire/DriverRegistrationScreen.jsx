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
  Image,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import '../../global.css';

import { post, uploadImage } from '../../lib/api';
import { endpoints } from '../../config/apiConfig';
// import { useUser } from '../../context/UserContext'; 

const { width, height } = Dimensions.get('window');

const DriverRegistrationScreen = ({ navigation }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState('');

  // Form data state
  const [formData, setFormData] = useState({
    // Personal Information
    fullName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    address: '',
    emergencyContact: '',
    emergencyPhone: '',

    // Driving Experience
    licenseNumber: '',
    licenseExpiry: '',
    yearsExperience: '',
    previousWork: '',

    // Vehicle Information
    vehicleType: '',
    vehicleMake: '',
    vehicleModel: '',
    vehicleYear: '',
    vehicleNumber: '',
    vehicleColor: '',

    // Bank Details
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    panNumber: '',
  });

  // Document upload state
  const [documents, setDocuments] = useState({
    drivingLicense: { uploaded: false, verified: false, fileName: '', uri: '' },
    aadharCard: { uploaded: false, verified: false, fileName: '', uri: '' },
    panCard: { uploaded: false, verified: false, fileName: '', uri: '' },
    vehicleRC: { uploaded: false, verified: false, fileName: '', uri: '' },
    insurance: { uploaded: false, verified: false, fileName: '', uri: '' },
    photo: { uploaded: false, verified: false, fileName: '', uri: '' },
  });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(30)).current;
  const modalSlideAnim = useRef(new Animated.Value(height)).current;

  const steps = [
    { id: 1, title: 'Personal Info', icon: 'person' },
    { id: 2, title: 'Experience', icon: 'car' },
    { id: 3, title: 'Vehicle Details', icon: 'car-sport' },
    { id: 4, title: 'Documents', icon: 'document-text' },
    { id: 5, title: 'Bank Details', icon: 'card' },
  ];

  const vehicleTypes = [
    { id: 'hatchback', name: 'Hatchback', icon: '🚗' },
    { id: 'sedan', name: 'Sedan', icon: '🚙' },
    { id: 'suv', name: 'SUV', icon: '🚐' },
    { id: 'luxury', name: 'Luxury Car', icon: '🏎️' },
  ];

  const documentTypes = [
    {
      id: 'drivingLicense',
      name: 'Driving License',
      description: 'Valid driving license (front & back)',
      required: true,
      icon: 'card'
    },
    {
      id: 'aadharCard',
      name: 'Aadhar Card',
      description: 'Government issued ID proof',
      required: true,
      icon: 'id-card'
    },
    {
      id: 'panCard',
      name: 'PAN Card',
      description: 'Required for tax purposes',
      required: true,
      icon: 'card'
    },
    {
      id: 'vehicleRC',
      name: 'Vehicle RC',
      description: 'Registration certificate of your vehicle',
      required: true,
      icon: 'document'
    },
    {
      id: 'insurance',
      name: 'Vehicle Insurance',
      description: 'Valid insurance certificate',
      required: true,
      icon: 'shield'
    },
    {
      id: 'photo',
      name: 'Profile Photo',
      description: 'Clear photo for profile verification',
      required: true,
      icon: 'camera'
    },
  ];

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

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        return formData.fullName && formData.email && formData.phone &&
          formData.address && formData.emergencyContact && formData.emergencyPhone;
      case 2:
        return formData.licenseNumber && formData.licenseExpiry && formData.yearsExperience;
      case 3:
        return formData.vehicleType && formData.vehicleMake && formData.vehicleModel &&
          formData.vehicleYear && formData.vehicleNumber && formData.vehicleColor;
      case 4:
        return Object.values(documents).every(doc => doc.uploaded);
      case 5:
        return formData.bankName && formData.accountNumber && formData.ifscCode && formData.panNumber;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) {
      Alert.alert('Incomplete Information', 'Please fill in all required fields.');
      return;
    }

    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigation.goBack();
    }
  };

  const openDocumentModal = (docType) => {
    setSelectedDocType(docType);
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
      setSelectedDocType('');
    });
  };

  const handleDocumentUpload = async (type, source) => {
    try {
      let result;
      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Sorry, we need camera permissions to make this work!');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Sorry, we need gallery permissions to make this work!');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setIsLoading(true);
        // Automatically upload after picking
        const uploadResult = await uploadImage(result.assets[0].uri);

        if (uploadResult && uploadResult.url) {
          setDocuments(prev => ({
            ...prev,
            [type]: {
              uploaded: true,
              verified: false,
              fileName: 'uploaded_doc.jpg', // In a real app, parse from URL
              uri: uploadResult.url, // The remote URL from backend
            }
          }));
          closeDocumentModal();
          Alert.alert('Success', 'Document uploaded successfully!');
        } else {
          throw new Error("Upload failed, no URL returned");
        }
      }
    } catch (error) {
      console.log('Upload error:', error);
      Alert.alert('Error', 'Failed to upload document. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper removed as logic is now in handleDocumentUpload
  const pickAndUpload = async (docType) => { };

  const handleSubmit = async () => {
    setIsLoading(true);

    try {
      // Construct payload from state
      const payload = {
        ...formData,
        experienceYears: formData.yearsExperience, // Map frontend state to backend expectation
        documents: Object.keys(documents).reduce((acc, key) => {
          acc[key] = documents[key].uri;
          return acc;
        }, {})
      };

      await post(endpoints.onboarding.driver, payload);

      Alert.alert(
        'Registration Submitted!',
        'Your driver registration has been submitted for verification. You will be notified once approved.',
        [
          {
            text: 'Continue',
            onPress: () => navigation.replace('Login'), // Back to login to wait for approval
          },
        ]
      );

    } catch (error) {
      console.error("Driver Submit Error", error);
      Alert.alert('Submission Failed', error.message || 'Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <View className="flex-row justify-between items-center mb-8">
      {steps.map((step, index) => (
        <View key={step.id} className="items-center flex-1">
          <View className={`w-10 h-10 rounded-full justify-center items-center ${currentStep >= step.id ? 'bg-accent' : 'bg-gray-200'
            }`}>
            {currentStep > step.id ? (
              <Ionicons name="checkmark" size={20} color="#ffffff" />
            ) : (
              <Ionicons
                name={step.icon}
                size={18}
                color={currentStep >= step.id ? '#ffffff' : '#6C757D'}
              />
            )}
          </View>
          <Text className={`text-xs mt-2 text-center ${currentStep >= step.id ? 'text-accent font-semibold' : 'text-secondary'
            }`}>
            {step.title}
          </Text>
          {index < steps.length - 1 && (
            <View className={`absolute top-5 left-1/2 w-full h-0.5 ${currentStep > step.id ? 'bg-accent' : 'bg-gray-200'
              }`} />
          )}
        </View>
      ))}
    </View>
  );

  const renderPersonalInfoStep = () => (
    <View className="space-y-4">
      <Text className="text-primary text-lg font-bold mb-4">
        Personal Information
      </Text>

      <View>
        <Text className="text-primary text-sm font-semibold mb-2">Full Name</Text>
        <TextInput
          value={formData.fullName}
          onChangeText={(value) => handleInputChange('fullName', value)}
          placeholder="Enter your full name"
          className="bg-gray-50 rounded-xl px-4 py-3 text-primary text-base border border-gray-200"
          autoCapitalize="words"
        />
      </View>

      <View>
        <Text className="text-primary text-sm font-semibold mb-2">Email Address</Text>
        <TextInput
          value={formData.email}
          onChangeText={(value) => handleInputChange('email', value)}
          placeholder="Enter your email"
          className="bg-gray-50 rounded-xl px-4 py-3 text-primary text-base border border-gray-200"
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View>
        <Text className="text-primary text-sm font-semibold mb-2">Phone Number</Text>
        <TextInput
          value={formData.phone}
          onChangeText={(value) => handleInputChange('phone', value)}
          placeholder="Enter your phone number"
          className="bg-gray-50 rounded-xl px-4 py-3 text-primary text-base border border-gray-200"
          keyboardType="phone-pad"
        />
      </View>

      <View>
        <Text className="text-primary text-sm font-semibold mb-2">Address</Text>
        <TextInput
          value={formData.address}
          onChangeText={(value) => handleInputChange('address', value)}
          placeholder="Enter your complete address"
          className="bg-gray-50 rounded-xl px-4 py-3 text-primary text-base border border-gray-200"
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>

      <View>
        <Text className="text-primary text-sm font-semibold mb-2">Emergency Contact Name</Text>
        <TextInput
          value={formData.emergencyContact}
          onChangeText={(value) => handleInputChange('emergencyContact', value)}
          placeholder="Enter emergency contact name"
          className="bg-gray-50 rounded-xl px-4 py-3 text-primary text-base border border-gray-200"
        />
      </View>

      <View>
        <Text className="text-primary text-sm font-semibold mb-2">Emergency Contact Phone</Text>
        <TextInput
          value={formData.emergencyPhone}
          onChangeText={(value) => handleInputChange('emergencyPhone', value)}
          placeholder="Enter emergency contact phone"
          className="bg-gray-50 rounded-xl px-4 py-3 text-primary text-base border border-gray-200"
          keyboardType="phone-pad"
        />
      </View>
    </View>
  );

  const renderExperienceStep = () => (
    <View className="space-y-4">
      <Text className="text-primary text-lg font-bold mb-4">
        Driving Experience
      </Text>

      <View>
        <Text className="text-primary text-sm font-semibold mb-2">License Number</Text>
        <TextInput
          value={formData.licenseNumber}
          onChangeText={(value) => handleInputChange('licenseNumber', value)}
          placeholder="Enter driving license number"
          className="bg-gray-50 rounded-xl px-4 py-3 text-primary text-base border border-gray-200"
          autoCapitalize="characters"
        />
      </View>

      <View>
        <Text className="text-primary text-sm font-semibold mb-2">License Expiry Date</Text>
        <TextInput
          value={formData.licenseExpiry}
          onChangeText={(value) => handleInputChange('licenseExpiry', value)}
          placeholder="DD/MM/YYYY"
          className="bg-gray-50 rounded-xl px-4 py-3 text-primary text-base border border-gray-200"
        />
      </View>

      <View>
        <Text className="text-primary text-sm font-semibold mb-2">Years of Driving Experience</Text>
        <TextInput
          value={formData.yearsExperience}
          onChangeText={(value) => handleInputChange('yearsExperience', value)}
          placeholder="Enter years of experience"
          className="bg-gray-50 rounded-xl px-4 py-3 text-primary text-base border border-gray-200"
          keyboardType="numeric"
        />
      </View>

      <View>
        <Text className="text-primary text-sm font-semibold mb-2">Previous Work Experience (Optional)</Text>
        <TextInput
          value={formData.previousWork}
          onChangeText={(value) => handleInputChange('previousWork', value)}
          placeholder="Any previous driving/delivery experience"
          className="bg-gray-50 rounded-xl px-4 py-3 text-primary text-base border border-gray-200"
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>
    </View>
  );

  const renderVehicleStep = () => (
    <View className="space-y-4">
      <Text className="text-primary text-lg font-bold mb-4">
        Vehicle Information
      </Text>

      <View>
        <Text className="text-primary text-sm font-semibold mb-2">Vehicle Type</Text>
        <View className="flex-row flex-wrap gap-3">
          {vehicleTypes.map((type) => (
            <TouchableOpacity
              key={type.id}
              onPress={() => handleInputChange('vehicleType', type.id)}
              className={`flex-1 bg-white rounded-xl p-4 border-2 ${formData.vehicleType === type.id ? 'border-accent bg-accent/5' : 'border-gray-200'
                } min-w-[40%] items-center`}
              activeOpacity={0.8}
            >
              <Text className="text-2xl mb-2">{type.icon}</Text>
              <Text className={`text-sm font-semibold ${formData.vehicleType === type.id ? 'text-accent' : 'text-secondary'
                }`}>
                {type.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View className="flex-row space-x-3">
        <View className="flex-1">
          <Text className="text-primary text-sm font-semibold mb-2">Make</Text>
          <TextInput
            value={formData.vehicleMake}
            onChangeText={(value) => handleInputChange('vehicleMake', value)}
            placeholder="Honda, Toyota, etc."
            className="bg-gray-50 rounded-xl px-4 py-3 text-primary text-base border border-gray-200"
          />
        </View>

        <View className="flex-1">
          <Text className="text-primary text-sm font-semibold mb-2">Model</Text>
          <TextInput
            value={formData.vehicleModel}
            onChangeText={(value) => handleInputChange('vehicleModel', value)}
            placeholder="City, Corolla, etc."
            className="bg-gray-50 rounded-xl px-4 py-3 text-primary text-base border border-gray-200"
          />
        </View>
      </View>

      <View className="flex-row space-x-3">
        <View className="flex-1">
          <Text className="text-primary text-sm font-semibold mb-2">Year</Text>
          <TextInput
            value={formData.vehicleYear}
            onChangeText={(value) => handleInputChange('vehicleYear', value)}
            placeholder="2020"
            className="bg-gray-50 rounded-xl px-4 py-3 text-primary text-base border border-gray-200"
            keyboardType="numeric"
          />
        </View>

        <View className="flex-1">
          <Text className="text-primary text-sm font-semibold mb-2">Color</Text>
          <TextInput
            value={formData.vehicleColor}
            onChangeText={(value) => handleInputChange('vehicleColor', value)}
            placeholder="White, Black, etc."
            className="bg-gray-50 rounded-xl px-4 py-3 text-primary text-base border border-gray-200"
          />
        </View>
      </View>

      <View>
        <Text className="text-primary text-sm font-semibold mb-2">Vehicle Number</Text>
        <TextInput
          value={formData.vehicleNumber}
          onChangeText={(value) => handleInputChange('vehicleNumber', value)}
          placeholder="MH 27 AB 1234"
          className="bg-gray-50 rounded-xl px-4 py-3 text-primary text-base border border-gray-200"
          autoCapitalize="characters"
        />
      </View>
    </View>
  );

  const renderDocumentsStep = () => (
    <View className="space-y-4">
      <Text className="text-primary text-lg font-bold mb-4">
        Upload Documents
      </Text>

      <Text className="text-secondary text-sm mb-4">
        Please upload clear photos of all required documents for verification.
      </Text>

      {documentTypes.map((docType) => (
        <TouchableOpacity
          key={docType.id}
          onPress={() => openDocumentModal(docType.id)}
          className={`bg-white rounded-xl p-4 border-2 ${documents[docType.id].uploaded ? 'border-green-200 bg-green-50' : 'border-gray-200'
            }`}
          activeOpacity={0.8}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <View className={`w-12 h-12 rounded-xl justify-center items-center mr-4 ${documents[docType.id].uploaded ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                <Ionicons
                  name={documents[docType.id].uploaded ? 'checkmark-circle' : docType.icon}
                  size={24}
                  color={documents[docType.id].uploaded ? '#22c55e' : '#6C757D'}
                />
              </View>

              <View className="flex-1">
                <View className="flex-row items-center">
                  <Text className="text-primary text-base font-semibold">
                    {docType.name}
                  </Text>
                  {docType.required && (
                    <Text className="text-red-500 text-sm ml-1">*</Text>
                  )}
                </View>
                <Text className="text-secondary text-sm">
                  {docType.description}
                </Text>
                {documents[docType.id].uploaded && (
                  <Text className="text-green-600 text-sm mt-1">
                    ✓ {documents[docType.id].fileName}
                  </Text>
                )}
              </View>
            </View>

            <Ionicons
              name={documents[docType.id].uploaded ? 'checkmark-circle' : 'camera'}
              size={24}
              color={documents[docType.id].uploaded ? '#22c55e' : '#00C851'}
            />
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderBankDetailsStep = () => (
    <View className="space-y-4">
      <Text className="text-primary text-lg font-bold mb-4">
        Bank Account Details
      </Text>

      <Text className="text-secondary text-sm mb-4">
        Your earnings will be transferred to this account.
      </Text>

      <View>
        <Text className="text-primary text-sm font-semibold mb-2">Bank Name</Text>
        <TextInput
          value={formData.bankName}
          onChangeText={(value) => handleInputChange('bankName', value)}
          placeholder="Enter bank name"
          className="bg-gray-50 rounded-xl px-4 py-3 text-primary text-base border border-gray-200"
        />
      </View>

      <View>
        <Text className="text-primary text-sm font-semibold mb-2">Account Number</Text>
        <TextInput
          value={formData.accountNumber}
          onChangeText={(value) => handleInputChange('accountNumber', value)}
          placeholder="Enter account number"
          className="bg-gray-50 rounded-xl px-4 py-3 text-primary text-base border border-gray-200"
          keyboardType="numeric"
        />
      </View>

      <View>
        <Text className="text-primary text-sm font-semibold mb-2">IFSC Code</Text>
        <TextInput
          value={formData.ifscCode}
          onChangeText={(value) => handleInputChange('ifscCode', value)}
          placeholder="Enter IFSC code"
          className="bg-gray-50 rounded-xl px-4 py-3 text-primary text-base border border-gray-200"
          autoCapitalize="characters"
        />
      </View>

      <View>
        <Text className="text-primary text-sm font-semibold mb-2">PAN Number</Text>
        <TextInput
          value={formData.panNumber}
          onChangeText={(value) => handleInputChange('panNumber', value)}
          placeholder="Enter PAN number"
          className="bg-gray-50 rounded-xl px-4 py-3 text-primary text-base border border-gray-200"
          autoCapitalize="characters"
        />
      </View>

      <View className="bg-blue-50 rounded-xl p-4 mt-6">
        <View className="flex-row items-start">
          <Ionicons name="information-circle" size={20} color="#3B82F6" />
          <Text className="text-blue-600 text-sm ml-2 flex-1">
            Your bank details are encrypted and secure. We use this information only for salary transfers and tax compliance.
          </Text>
        </View>
      </View>
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderPersonalInfoStep();
      case 2:
        return renderExperienceStep();
      case 3:
        return renderVehicleStep();
      case 4:
        return renderDocumentsStep();
      case 5:
        return renderBankDetailsStep();
      default:
        return null;
    }
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
            onPress={handleBack}
            className="w-10 h-10 bg-gray-100 rounded-2xl justify-center items-center"
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={20} color="#1A1B23" />
          </TouchableOpacity>

          <View className="flex-1 items-center">
            <Text className="text-primary text-lg font-semibold">Become a Driver</Text>
            <Text className="text-secondary text-sm">
              Step {currentStep} of {steps.length}
            </Text>
          </View>

          <View className="w-10" />
        </View>
      </Animated.View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Step Indicator */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideUpAnim }],
          }}
          className="bg-white mx-4 mt-4 rounded-2xl p-6 shadow-sm shadow-black/5 border border-gray-100"
        >
          {renderStepIndicator()}
        </Animated.View>

        {/* Form Content */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideUpAnim }],
          }}
          className="bg-white mx-4 mt-4 rounded-2xl p-6 shadow-sm shadow-black/5 border border-gray-100 mb-6"
        >
          {renderCurrentStep()}
        </Animated.View>
      </ScrollView>

      {/* Navigation Buttons */}
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideUpAnim }],
        }}
        className="bg-white border-t border-gray-200 px-6 py-4"
      >
        <TouchableOpacity
          onPress={handleNext}
          disabled={isLoading || !validateStep(currentStep)}
          activeOpacity={0.8}
          className={`rounded-2xl overflow-hidden ${!validateStep(currentStep) ? 'opacity-50' : ''
            }`}
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
                    Submitting...
                  </Text>
                </>
              ) : (
                <>
                  <Text className="text-white text-lg font-semibold mr-2">
                    {currentStep === 5 ? 'Submit Registration' : 'Continue'}
                  </Text>
                  <Ionicons
                    name={currentStep === 5 ? "checkmark" : "arrow-forward"}
                    size={20}
                    color="#ffffff"
                  />
                </>
              )}
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* Document Upload Modal */}
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
            className="bg-white rounded-t-3xl p-6"
          >
            <View className="items-center mb-6">
              <View className="w-12 h-1 bg-gray-300 rounded-full mb-4" />
              <Text className="text-primary text-xl font-bold">
                Upload Document
              </Text>
            </View>

            {/* Modal Content - File Options */}
            {selectedDocType && (
              <View className="mb-6">
                <Text className="text-primary text-base font-semibold mb-2">
                  {documentTypes.find(d => d.id === selectedDocType)?.name}
                </Text>
                <Text className="text-secondary text-sm mb-6">
                  {documentTypes.find(d => d.id === selectedDocType)?.description}
                </Text>

                <TouchableOpacity
                  onPress={() => handleDocumentUpload(selectedDocType, 'camera')}
                  className="flex-row items-center bg-gray-50 p-4 rounded-xl mb-3 border border-gray-200"
                >
                  <View className="w-10 h-10 bg-white rounded-full justify-center items-center shadow-sm mr-3">
                    <Ionicons name="camera" size={20} color="#00C851" />
                  </View>
                  <Text className="text-primary text-base font-medium">Take Photo</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleDocumentUpload(selectedDocType, 'gallery')}
                  className="flex-row items-center bg-gray-50 p-4 rounded-xl border border-gray-200"
                >
                  <View className="w-10 h-10 bg-white rounded-full justify-center items-center shadow-sm mr-3">
                    <Ionicons name="images" size={20} color="#00C851" />
                  </View>
                  <Text className="text-primary text-base font-medium">Choose from Gallery</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Removed duplicate buttons block that was here */}

            <TouchableOpacity
              onPress={closeDocumentModal}
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
    </View>
  );
};

export default DriverRegistrationScreen;