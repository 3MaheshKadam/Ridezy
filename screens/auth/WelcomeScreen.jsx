import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
  ScrollView,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
const { width, height } = Dimensions.get('window');

const WelcomeScreen = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const buttonSlideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    startAnimations();
  }, []);

  const startAnimations = () => {
    // Staggered animations for smooth entrance
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideUpAnim, {
        toValue: 0,
        duration: 800,
        delay: 200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        delay: 400,
        useNativeDriver: true,
      }),
      Animated.timing(buttonSlideAnim, {
        toValue: 0,
        duration: 600,
        delay: 600,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleLogin = () => {
    navigation.navigate('Login');
  };

  const handleRegister = () => {
    navigation.navigate('Register');
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Header Section with Background */}
        <View className="relative">
          {/* Background Elements */}
          <View className="absolute inset-0 overflow-hidden">
            {/* Gradient Background */}
            <LinearGradient
              colors={['#f8f9fa', '#ffffff']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="absolute inset-0"
            />
            
            {/* Geometric Background Elements */}
            <View 
              className="absolute bg-accent/8 rounded-full"
              style={{
                width: width * 0.6,
                height: width * 0.6,
                top: -width * 0.2,
                right: -width * 0.2,
              }}
            />
            <View 
              className="absolute bg-primary/8 rounded-full"
              style={{
                width: width * 0.4,
                height: width * 0.4,
                top: height * 0.15,
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
            className="px-8 pt-4 pb-4 relative z-10"
          >
            {/* Logo Section */}
            <View className="items-center ">
              <View className="w-20 h-20 bg-white rounded-3xl shadow-lg shadow-black/10 justify-center items-center mb-6 border border-gray-100">
                <View className="relative">
                  <View className="w-14 h-14 bg-gradient-to-br from-accent to-accent/80 rounded-2xl justify-center items-center">
                    <Ionicons name="car-sport" size={24} color="#ffffff" />
                  </View>
                 
                </View>
              </View>
            </View>

          </Animated.View>
        </View>

        {/* Features Section */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          }}
          className="px-8 py-8"
        >
          <Text className="text-primary text-lg font-bold text-center mb-8">
            What You Can Do
          </Text>

          {/* Feature Cards */}
          <View className="space-y-4 mb-8">
            {/* Car Wash Feature */}
            <View className="bg-white rounded-2xl p-6 shadow-sm shadow-black/5 border border-gray-100">
              <View className="flex-row items-center">
                <View className="w-14 h-14 bg-accent/10 rounded-2xl justify-center items-center mr-4">
                  <MaterialIcons name="local-car-wash" size={24} color="#00C851" />
                </View>
                <View className="flex-1">
                  <Text className="text-primary text-lg font-semibold mb-1">
                    Premium Car Wash
                  </Text>
                  <Text className="text-secondary text-sm leading-5">
                    Book premium car wash services with flexible subscription plans
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#6C757D" />
              </View>
            </View>

            {/* Driver Hire Feature */}
            <View className="bg-white rounded-2xl p-6 shadow-sm shadow-black/5 border border-gray-100">
              <View className="flex-row items-center">
                <View className="w-14 h-14 bg-primary/10 rounded-2xl justify-center items-center mr-4">
                  <Ionicons name="person" size={24} color="#1A1B23" />
                </View>
                <View className="flex-1">
                  <Text className="text-primary text-lg font-semibold mb-1">
                    Professional Drivers
                  </Text>
                  <Text className="text-secondary text-sm leading-5">
                    Hire verified professional drivers for your trips with real-time tracking
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#6C757D" />
              </View>
            </View>

            {/* Business Feature */}
            <View className="bg-white rounded-2xl p-6 shadow-sm shadow-black/5 border border-gray-100">
              <View className="flex-row items-center">
                <View className="w-14 h-14 bg-accent/10 rounded-2xl justify-center items-center mr-4">
                  <Ionicons name="business" size={24} color="#00C851" />
                </View>
                <View className="flex-1">
                  <Text className="text-primary text-lg font-semibold mb-1">
                    Business Solutions
                  </Text>
                  <Text className="text-secondary text-sm leading-5">
                    Register your car wash center or become a professional driver
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#6C757D" />
              </View>
            </View>
          </View>

          {/* Trust Indicators */}
          <View className="bg-gray-50 rounded-2xl p-6 mb-8">
            <Text className="text-primary text-base font-semibold text-center mb-4">
              Trusted by Thousands
            </Text>
            <View className="flex-row justify-around">
              <View className="items-center">
                <View className="w-10 h-10 bg-accent/10 rounded-full justify-center items-center mb-2">
                  <Ionicons name="shield-checkmark" size={18} color="#00C851" />
                </View>
                <Text className="text-secondary text-xs font-medium text-center">
                  100% Secure
                </Text>
              </View>
              <View className="items-center">
                <View className="w-10 h-10 bg-primary/10 rounded-full justify-center items-center mb-2">
                  <Ionicons name="time" size={18} color="#1A1B23" />
                </View>
                <Text className="text-secondary text-xs font-medium text-center">
                  24/7 Available
                </Text>
              </View>
              <View className="items-center">
                <View className="w-10 h-10 bg-accent/10 rounded-full justify-center items-center mb-2">
                  <Ionicons name="star" size={18} color="#00C851" />
                </View>
                <Text className="text-secondary text-xs font-medium text-center">
                  5-Star Rated
                </Text>
              </View>
              <View className="items-center">
                <View className="w-10 h-10 bg-primary/10 rounded-full justify-center items-center mb-2">
                  <Ionicons name="people" size={18} color="#1A1B23" />
                </View>
                <Text className="text-secondary text-xs font-medium text-center">
                  10K+ Users
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Action Buttons */}
        <Animated.View
          style={{
            transform: [{ translateY: buttonSlideAnim }],
            opacity: fadeAnim,
          }}
          className="px-8 pb-12"
        >
          {/* Primary CTA - Register */}
    <TouchableOpacity
            onPress={handleRegister}
            activeOpacity={0.8}
            className="mb-4 rounded-2xl overflow-hidden"
          >
            <LinearGradient
              colors={['#00C851', '#00A843']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                borderRadius: 16,
                paddingVertical: 16,
                paddingHorizontal: 24,
                shadowColor: '#00C851',
                shadowOffset: {
                  width: 0,
                  height: 4,
                },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
              }}
            >
              <View className="flex-row justify-center items-center">
                <Text className="text-white text-lg font-semibold mr-2">
                  Get Started Now
                </Text>
                <Ionicons name="arrow-forward" size={20} color="#ffffff" />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Secondary CTA - Login */}
          <TouchableOpacity
            onPress={handleLogin}
            activeOpacity={0.8}
            className="bg-white rounded-2xl py-4 px-6 border-2 border-gray-200 shadow-sm shadow-black/5"
          >
            <View className="flex-row justify-center items-center">
              <Text className="text-primary text-lg font-semibold mr-2">
                I Already Have an Account
              </Text>
              <Ionicons name="log-in-outline" size={20} color="#1A1B23" />
            </View>
          </TouchableOpacity>

          {/* Help Text */}
          <Text className="text-secondary text-sm text-center mt-6 leading-5">
            By continuing, you agree to our{' '}
            <Text className="text-accent font-medium">Terms of Service</Text>
            {' '}and{' '}
            <Text className="text-accent font-medium">Privacy Policy</Text>
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

export default WelcomeScreen;