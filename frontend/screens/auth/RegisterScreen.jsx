import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import '../../global.css';

import { post } from '../../lib/api';
import { endpoints } from '../../config/apiConfig';

const { width, height } = Dimensions.get('window');

const RegisterScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    selectedRole: null,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(30)).current;
  const formSlideAnim = useRef(new Animated.Value(20)).current;

  const roles = [
    {
      id: 'carOwner',
      title: 'Car Owner',
      subtitle: 'Book services & hire drivers',
      icon: 'car-sport',
      iconLibrary: 'Ionicons',
      color: '#00C851',
    },
    {
      id: 'driver',
      title: 'Driver',
      subtitle: 'Offer professional driving services',
      icon: 'person',
      iconLibrary: 'Ionicons',
      color: '#1A1B23',
    },
    {
      id: 'carWashCenter',
      title: 'Car Wash Center',
      subtitle: 'Manage your car wash business',
      icon: 'local-car-wash',
      iconLibrary: 'MaterialIcons',
      color: '#00C851',
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
      Animated.timing(formSlideAnim, {
        toValue: 0,
        duration: 600,
        delay: 400,
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

  const handleRoleSelect = (roleId) => {
    setFormData(prev => ({
      ...prev,
      selectedRole: roleId,
    }));
  };

  const validateForm = () => {
    const { fullName, email, phone, password, confirmPassword, selectedRole } = formData;

    if (!fullName.trim()) {
      Alert.alert('Error', 'Please enter your full name');
      return false;
    }

    if (!isValidEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }

    if (!isValidPhone(phone)) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return false;
    }

    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long');
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }

    if (!selectedRole) {
      Alert.alert('Error', 'Please select your role');
      return false;
    }

    if (!acceptedTerms) {
      Alert.alert('Error', 'Please accept the Terms of Service and Privacy Policy');
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // Map UI role IDs to Backend Enums
      const roleMapping = {
        'carOwner': 'OWNER',
        'driver': 'DRIVER',
        'carWashCenter': 'CENTER'
      };

      const payload = {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: roleMapping[formData.selectedRole]
      };

      await post(endpoints.auth.register, payload);

      Alert.alert(
        'Registration Successful!',
        'Your account has been created. Please sign in.',
        [
          {
            text: 'Sign In',
            onPress: () => navigation.replace('Login'),
          },
        ]
      );

    } catch (error) {
      Alert.alert('Registration Failed', error.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isValidPhone = (phone) => {
    const phoneRegex = /^[+]?[\d\s-()]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  const renderIcon = (role) => {
    const IconComponent = role.iconLibrary === 'MaterialIcons' ? MaterialIcons : Ionicons;
    return <IconComponent name={role.icon} size={24} color={role.color} />;
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Custom Header */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideUpAnim }],
          }}
          className="pt-12 pb-6 px-6"
        >
          <View className="flex-row items-center justify-between">
            <TouchableOpacity
              onPress={handleBackPress}
              className="w-10 h-10 bg-gray-100 rounded-2xl justify-center items-center"
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={20} color="#1A1B23" />
            </TouchableOpacity>

            <View className="flex-1 items-center">
              <Text className="text-primary text-lg font-semibold">Create Account</Text>
            </View>

            <View className="w-10" />
          </View>
        </Animated.View>

        {/* Background Elements */}
        <View className="absolute inset-0 overflow-hidden pointer-events-none">
          <View
            className="absolute bg-accent/5 rounded-full"
            style={{
              width: width * 0.4,
              height: width * 0.4,
              top: height * 0.1,
              right: -width * 0.1,
            }}
          />
          <View
            className="absolute bg-primary/5 rounded-full"
            style={{
              width: width * 0.3,
              height: width * 0.3,
              bottom: height * 0.1,
              left: -width * 0.1,
            }}
          />
        </View>

        {/* Header Content */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideUpAnim }],
          }}
          className="px-8 pb-6"
        >
          <View className="items-center mb-6">
            <Text className="text-primary text-2xl font-bold mb-2">
              Join Ridezy
            </Text>
            <Text className="text-secondary text-base text-center">
              Create your account to get started
            </Text>
          </View>
        </Animated.View>

        {/* Registration Form */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: formSlideAnim }],
          }}
          className="px-8"
        >
          {/* Full Name Input */}
          <View className="mb-4">
            <Text className="text-primary text-sm font-semibold mb-2">
              Full Name
            </Text>
            <View className={`bg-gray-50 rounded-2xl border-2 ${focusedField === 'fullName' ? 'border-accent bg-white' : 'border-gray-100'
              }`}>
              <TextInput
                value={formData.fullName}
                onChangeText={(value) => handleInputChange('fullName', value)}
                onFocus={() => setFocusedField('fullName')}
                onBlur={() => setFocusedField(null)}
                placeholder="Enter your full name"
                placeholderTextColor="#6C757D"
                autoCapitalize="words"
                className="px-4 py-3 text-primary text-base"
              />
            </View>
          </View>

          {/* Email Input */}
          <View className="mb-4">
            <Text className="text-primary text-sm font-semibold mb-2">
              Email Address
            </Text>
            <View className={`bg-gray-50 rounded-2xl border-2 ${focusedField === 'email' ? 'border-accent bg-white' : 'border-gray-100'
              }`}>
              <TextInput
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                placeholder="Enter your email"
                placeholderTextColor="#6C757D"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                className="px-4 py-3 text-primary text-base"
              />
            </View>
          </View>

          {/* Phone Input */}
          <View className="mb-4">
            <Text className="text-primary text-sm font-semibold mb-2">
              Phone Number
            </Text>
            <View className={`bg-gray-50 rounded-2xl border-2 ${focusedField === 'phone' ? 'border-accent bg-white' : 'border-gray-100'
              }`}>
              <TextInput
                value={formData.phone}
                onChangeText={(value) => handleInputChange('phone', value)}
                onFocus={() => setFocusedField('phone')}
                onBlur={() => setFocusedField(null)}
                placeholder="Enter your phone number"
                placeholderTextColor="#6C757D"
                keyboardType="phone-pad"
                className="px-4 py-3 text-primary text-base"
              />
            </View>
          </View>

          {/* Password Input */}
          <View className="mb-4">
            <Text className="text-primary text-sm font-semibold mb-2">
              Password
            </Text>
            <View className={`bg-gray-50 rounded-2xl border-2 ${focusedField === 'password' ? 'border-accent bg-white' : 'border-gray-100'
              } flex-row items-center`}>
              <TextInput
                value={formData.password}
                onChangeText={(value) => handleInputChange('password', value)}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                placeholder="Create a password"
                placeholderTextColor="#6C757D"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                className="flex-1 px-4 py-3 text-primary text-base"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                className="pr-4"
                activeOpacity={0.7}
              >
                <Ionicons
                  name={showPassword ? "eye-off" : "eye"}
                  size={20}
                  color="#6C757D"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password Input */}
          <View className="mb-6">
            <Text className="text-primary text-sm font-semibold mb-2">
              Confirm Password
            </Text>
            <View className={`bg-gray-50 rounded-2xl border-2 ${focusedField === 'confirmPassword' ? 'border-accent bg-white' : 'border-gray-100'
              } flex-row items-center`}>
              <TextInput
                value={formData.confirmPassword}
                onChangeText={(value) => handleInputChange('confirmPassword', value)}
                onFocus={() => setFocusedField('confirmPassword')}
                onBlur={() => setFocusedField(null)}
                placeholder="Confirm your password"
                placeholderTextColor="#6C757D"
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
                className="flex-1 px-4 py-3 text-primary text-base"
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                className="pr-4"
                activeOpacity={0.7}
              >
                <Ionicons
                  name={showConfirmPassword ? "eye-off" : "eye"}
                  size={20}
                  color="#6C757D"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Role Selection */}
          <View className="mb-6">
            <Text className="text-primary text-sm font-semibold mb-3">
              I want to join as
            </Text>
            <View className="space-y-3">
              {roles.map((role) => (
                <TouchableOpacity
                  key={role.id}
                  onPress={() => handleRoleSelect(role.id)}
                  activeOpacity={0.7}
                  className={`bg-white rounded-2xl p-4 border-2 ${formData.selectedRole === role.id
                      ? 'border-accent bg-accent/5'
                      : 'border-gray-200'
                    } shadow-sm shadow-black/5`}
                >
                  <View className="flex-row items-center">
                    <View className={`w-12 h-12 rounded-2xl justify-center items-center mr-4 ${formData.selectedRole === role.id
                        ? 'bg-accent/20'
                        : 'bg-gray-100'
                      }`}>
                      {renderIcon(role)}
                    </View>
                    <View className="flex-1">
                      <Text className="text-primary text-base font-semibold mb-1">
                        {role.title}
                      </Text>
                      <Text className="text-secondary text-sm">
                        {role.subtitle}
                      </Text>
                    </View>
                    <View className={`w-6 h-6 rounded-full border-2 ${formData.selectedRole === role.id
                        ? 'border-accent bg-accent'
                        : 'border-gray-300'
                      } justify-center items-center`}>
                      {formData.selectedRole === role.id && (
                        <Ionicons name="checkmark" size={12} color="#ffffff" />
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Terms and Conditions */}
          <TouchableOpacity
            onPress={() => setAcceptedTerms(!acceptedTerms)}
            activeOpacity={0.7}
            className="flex-row items-start mb-6"
          >
            <View className={`w-5 h-5 rounded-lg border-2 mr-3 mt-0.5 justify-center items-center ${acceptedTerms ? 'border-accent bg-accent' : 'border-gray-300 bg-white'
              }`}>
              {acceptedTerms && (
                <Ionicons name="checkmark" size={12} color="#ffffff" />
              )}
            </View>
            <Text className="text-secondary text-sm leading-5 flex-1">
              I agree to the{' '}
              <Text className="text-accent font-semibold">Terms of Service</Text>
              {' '}and{' '}
              <Text className="text-accent font-semibold">Privacy Policy</Text>
            </Text>
          </TouchableOpacity>

          {/* Register Button */}
          <TouchableOpacity
            onPress={handleRegister}
            disabled={isLoading}
            activeOpacity={0.8}
            className="mb-6 rounded-2xl overflow-hidden"
          >
            <LinearGradient
              colors={isLoading ? ['#cccccc', '#999999'] : ['#00C851', '#00A843']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                borderRadius: 16,
                paddingVertical: 16,
                paddingHorizontal: 24,
                shadowColor: isLoading ? '#999999' : '#00C851',
                shadowOffset: {
                  width: 0,
                  height: 4,
                },
                shadowOpacity: 0.25,
                shadowRadius: 8,
                elevation: 6,
              }}
            >
              <View className="flex-row justify-center items-center">
                {isLoading ? (
                  <>
                    <View className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    <Text className="text-white text-lg font-semibold">
                      Creating Account...
                    </Text>
                  </>
                ) : (
                  <>
                    <Text className="text-white text-lg font-semibold mr-2">
                      Create Account
                    </Text>
                    <Ionicons name="arrow-forward" size={20} color="#ffffff" />
                  </>
                )}
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Footer */}
        <View className="px-8 pb-8 items-center">
          <View className="flex-row items-center">
            <Text className="text-secondary text-base">
              Already have an account?{' '}
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.7}
            >
              <Text className="text-accent text-base font-semibold">
                Sign In
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default RegisterScreen;