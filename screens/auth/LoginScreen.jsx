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
import { Ionicons } from '@expo/vector-icons';
import '../../global.css';
import { post } from '../../lib/api';
import { endpoints } from '../../config/apiConfig';
import { useUser } from '../../context/UserContext';

const { width, height } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
  const { login } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(30)).current;
  const formSlideAnim = useRef(new Animated.Value(20)).current;

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

  const handleLogin = async () => {


    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);

    try {
      const response = await post(endpoints.auth.login, { email, password });

      // response should contain { user, token }
      if (response.user && response.token) {
        login(response.user, response.token);

        // Navigate based on role
        const role = response.user.role;
        console.log('Login Role:', role);

        // Normalize role for case-insensitive comparison
        const normalizedRole = role ? role.trim().toLowerCase() : '';
        console.log('Login Role (Normalized):', normalizedRole);

        if (normalizedRole === 'admin' || normalizedRole === 'super admin' || normalizedRole === 'super_admin') {
          navigation.replace('AdminTabs');
        } else if (normalizedRole === 'driver') {
          navigation.replace('DriverTabs');
        } else if (normalizedRole === 'carwashcenter' || normalizedRole === 'center') {
          navigation.replace('CenterTabs');
        } else if (normalizedRole === 'owner' || normalizedRole === 'car_owner' || normalizedRole === 'car owner') {
          navigation.replace('CarOwnerTabs');
        } else {
          // Default/Fallback for unknown roles
          console.warn('Unknown role detected, defaulting to Car Owner:', role);
          navigation.replace('CarOwnerTabs');
        }
      } else {
        throw new Error('Invalid response from server');
      }

    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Login Failed', error.message || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    Alert.alert('Forgot Password', 'Please contact support to reset your password.');
  };

  const handleGoogleLogin = () => {
    Alert.alert('Coming Soon', 'Google Login is not yet implemented.');
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
              onPress={() => navigation.goBack()}
              className="w-10 h-10 bg-gray-100 rounded-2xl justify-center items-center"
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={20} color="#1A1B23" />
            </TouchableOpacity>
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
              bottom: height * 0.2,
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
          className="px-8 pb-8"
        >
          {/* Logo */}
          <View className="items-center mb-8">
            <View className="w-16 h-16 bg-white rounded-3xl shadow-md shadow-black/10 justify-center items-center mb-4 border border-gray-100">
              <View className="w-12 h-12 bg-gradient-to-br from-accent to-accent/80 rounded-2xl justify-center items-center">
                <Ionicons name="car-sport" size={20} color="#ffffff" />
              </View>
            </View>
            <Text className="text-primary text-2xl font-bold mb-2">
              Welcome Back
            </Text>
            <Text className="text-secondary text-base text-center">
              Sign in to continue to Ridezy
            </Text>
          </View>
        </Animated.View>

        {/* Login Form */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: formSlideAnim }],
          }}
          className="px-8"
        >
          {/* Email Input */}
          <View className="mb-6">
            <Text className="text-primary text-sm font-semibold mb-2">
              Email Address
            </Text>
            <View className={`bg-gray-50 rounded-2xl border-2 ${emailFocused ? 'border-accent bg-white' : 'border-gray-100'
              }`}>
              <TextInput
                value={email}
                onChangeText={setEmail}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                placeholder="Enter your email"
                placeholderTextColor="#6C757D"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                className="px-4 py-4 text-primary text-base"
              />
            </View>
          </View>

          {/* Password Input */}
          <View className="mb-6">
            <Text className="text-primary text-sm font-semibold mb-2">
              Password
            </Text>
            <View className={`bg-gray-50 rounded-2xl border-2 ${passwordFocused ? 'border-accent bg-white' : 'border-gray-100'
              } flex-row items-center`}>
              <TextInput
                value={password}
                onChangeText={setPassword}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                placeholder="Enter your password"
                placeholderTextColor="#6C757D"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                className="flex-1 px-4 py-4 text-primary text-base"
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

          {/* Forgot Password */}
          <TouchableOpacity
            onPress={handleForgotPassword}
            activeOpacity={0.7}
            className="items-end mb-8"
          >
            <Text className="text-accent text-sm font-semibold">
              Forgot Password?
            </Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity
            onPress={handleLogin}
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
                      Signing In...
                    </Text>
                  </>
                ) : (
                  <>
                    <Text className="text-white text-lg font-semibold mr-2">
                      Sign In
                    </Text>
                    <Ionicons name="arrow-forward" size={20} color="#ffffff" />
                  </>
                )}
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Divider */}
          <View className="flex-row items-center mb-6">
            <View className="flex-1 h-px bg-gray-200" />
            <Text className="text-secondary text-sm font-medium mx-4">
              OR
            </Text>
            <View className="flex-1 h-px bg-gray-200" />
          </View>

          {/* Google Login Button */}
          <TouchableOpacity
            onPress={handleGoogleLogin}
            activeOpacity={0.8}
            className="bg-white rounded-2xl py-4 px-6 border-2 border-gray-200 shadow-sm shadow-black/5 mb-8"
          >
            <View className="flex-row justify-center items-center">
              <View className="w-5 h-5 bg-red-500 rounded-full mr-3" />
              <Text className="text-primary text-lg font-semibold">
                Continue with Google
              </Text>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Footer */}
        <View className="px-8 pb-8 items-center">
          <View className="flex-row items-center">
            <Text className="text-secondary text-base">
              Don't have an account?{' '}
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Register')}
              activeOpacity={0.7}
            >
              <Text className="text-accent text-base font-semibold">
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;