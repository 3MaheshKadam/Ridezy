import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Animated,
  Dimensions,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
const { width, height } = Dimensions.get('window');

const SplashScreen = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideUpAnim = useRef(new Animated.Value(30)).current;
  const logoRotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Start animations immediately
    startAnimations();
    
    // Auto-navigate to Welcome screen after 3.5 seconds
    const timer = setTimeout(() => {
      checkAuthStatus();
    }, 5500);

    // Cleanup timer on unmount
    return () => clearTimeout(timer);
  }, []);

  const checkAuthStatus = async () => {
    try {
      // Check AsyncStorage for auth token
      // const AsyncStorage = require('@react-native-async-storage/async-storage');
      // const token = await AsyncStorage.getItem('authToken');
      // const userRole = await AsyncStorage.getItem('userRole');
      
      // For now, always navigate to Welcome (update this when auth is implemented)
      // if (token && userRole) {
      //   // Navigate to role-based tabs based on stored role
      //   switch(userRole) {
      //     case 'carOwner': navigation.replace('CarOwnerTabs'); break;
      //     case 'driver': navigation.replace('DriverTabs'); break;
      //     case 'carWashCenter': navigation.replace('CenterTabs'); break;
      //     case 'admin': navigation.replace('AdminTabs'); break;
      //     default: navigation.replace('Welcome');
      //   }
      // } else {
        navigation.replace('Welcome');
      // }
    } catch (error) {
      console.log('Auth check error:', error);
      navigation.replace('Welcome');
    }
  };

  const startAnimations = () => {
    // Main fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1200,
      useNativeDriver: true,
    }).start();

    // Logo scale animation with spring effect
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 80,
      friction: 8,
      delay: 300,
      useNativeDriver: true,
    }).start();

    // Slide up animation for content
    Animated.timing(slideUpAnim, {
      toValue: 0,
      duration: 1000,
      delay: 600,
      useNativeDriver: true,
    }).start();

    // Subtle logo rotation
    Animated.timing(logoRotateAnim, {
      toValue: 1,
      duration: 2000,
      delay: 800,
      useNativeDriver: true,
    }).start();

    // Pulse animation for loading indicator
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const logoRotate = logoRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '5deg'],
  });

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Background with subtle gradient */}
      <LinearGradient
        colors={['#ffffff', '#f8f9fa', '#ffffff']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="flex-1"
      >
        {/* Modern geometric background elements */}
        <View className="absolute inset-0 overflow-hidden">
          {/* Large background circles */}
          <View 
            className="absolute bg-accent/5 rounded-full"
            style={{
              width: width * 0.8,
              height: width * 0.8,
              top: -width * 0.3,
              right: -width * 0.3,
            }}
          />
          <View 
            className="absolute bg-primary/5 rounded-full"
            style={{
              width: width * 0.6,
              height: width * 0.6,
              bottom: -width * 0.2,
              left: -width * 0.2,
            }}
          />
          
          {/* Modern geometric shapes */}
          <View className="absolute top-20 left-8 w-4 h-4 bg-accent/20 rounded-sm rotate-45" />
          <View className="absolute top-32 right-12 w-2 h-2 bg-accent/30 rounded-full" />
          <View className="absolute bottom-32 left-16 w-3 h-3 bg-primary/20 rounded-full" />
          <View className="absolute bottom-20 right-8 w-6 h-1 bg-accent/15 rounded-full" />
        </View>

        {/* Main Content Container */}
        <Animated.View
          style={{
            opacity: fadeAnim,
          }}
          className="flex-1 justify-center items-center px-12"
        >
          {/* Logo Section */}
          <Animated.View
            style={{
              transform: [
                { scale: scaleAnim },
                { rotate: logoRotate }
              ],
            }}
            className="items-center mb-16"
          >
            {/* Modern Logo Design */}
            <View className="relative items-center">
              {/* Main Logo Container */}
              <View className="w-24 h-24 bg-white rounded-3xl shadow-lg shadow-black/10 justify-center items-center mb-8 border border-gray-100">
                {/* Logo Icon */}
                <View className="relative">
                  <View className="w-16 h-16 bg-gradient-to-br from-accent to-accent/80 rounded-2xl justify-center items-center">
                    <Ionicons name="car-sport" size={28} color="#ffffff" />
                  </View>
                  {/* Secondary service indicator */}
                  <View className="absolute -top-1 -right-1 w-6 h-6 bg-primary rounded-full justify-center items-center">
                    <MaterialIcons name="local-car-wash" size={12} color="#ffffff" />
                  </View>
                </View>
              </View>

              {/* Brand Name CarServe*/}
              <View className="items-center">
                <Text className="text-primary text-5xl font-black tracking-tight mb-2">
                   Ridezy 
                </Text>
                <View className="flex-row items-center">
                  <View className="w-8 h-0.5 bg-accent rounded-full mr-3" />
                  <Text className="text-secondary text-sm font-semibold tracking-widest uppercase">
                    Premium Services
                  </Text>
                  <View className="w-8 h-0.5 bg-accent rounded-full ml-3" />
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Service Cards */}
          <Animated.View
            style={{
              transform: [{ translateY: slideUpAnim }],
              opacity: fadeAnim,
            }}
            className="flex-row justify-between w-full max-w-xs mb-16"
          >
            {/* Car Wash Service Card */}
            <View className="bg-white rounded-2xl p-6 shadow-sm shadow-black/5 border border-gray-50 items-center flex-1 mr-4">
              <View className="w-12 h-12 bg-accent/10 rounded-2xl justify-center items-center mb-3">
                <MaterialIcons name="local-car-wash" size={20} color="#00C851" />
              </View>
              <Text className="text-primary text-xs font-semibold text-center">
                Car Wash
              </Text>
              <Text className="text-secondary text-xs text-center mt-1">
                Premium
              </Text>
            </View>

            {/* Driver Hire Service Card */}
            <View className="bg-white rounded-2xl p-6 shadow-sm shadow-black/5 border border-gray-50 items-center flex-1 ml-4">
              <View className="w-12 h-12 bg-primary/10 rounded-2xl justify-center items-center mb-3">
                <Ionicons name="person" size={20} color="#1A1B23" />
              </View>
              <Text className="text-primary text-xs font-semibold text-center">
                Driver Hire
              </Text>
              <Text className="text-secondary text-xs text-center mt-1">
                Professional
              </Text>
            </View>
          </Animated.View>

          {/* Loading Section */}
          <Animated.View
            style={{
              transform: [
                { translateY: slideUpAnim },
                { scale: pulseAnim }
              ],
              opacity: fadeAnim,
            }}
            className="items-center"
          >
            {/* Modern loading indicator */}
            <View className="w-16 h-16 bg-white rounded-2xl shadow-sm shadow-black/5 border border-gray-100 justify-center items-center mb-4">
              <ActivityIndicator size="small" color="#00C851" />
            </View>
            <Text className="text-secondary text-sm font-medium">
              Preparing your experience
            </Text>
            <View className="flex-row mt-2 space-x-1">
              <View className="w-1.5 h-1.5 bg-accent rounded-full" />
              <View className="w-1.5 h-1.5 bg-accent/60 rounded-full" />
              <View className="w-1.5 h-1.5 bg-accent/30 rounded-full" />
            </View>
          </Animated.View>
        </Animated.View>

        {/* Bottom Section */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideUpAnim }],
          }}
          className="absolute bottom-12 left-0 right-0 items-center px-8"
        >
          {/* Trust indicators */}
          <View className="flex-row items-center justify-center space-x-6 mb-6">
            <View className="items-center">
              <View className="w-8 h-8 bg-accent/10 rounded-full justify-center items-center mb-1">
                <Ionicons name="shield-checkmark" size={14} color="#00C851" />
              </View>
              <Text className="text-secondary text-xs font-medium">Secure</Text>
            </View>
            <View className="items-center">
              <View className="w-8 h-8 bg-primary/10 rounded-full justify-center items-center mb-1">
                <Ionicons name="flash" size={14} color="#1A1B23" />
              </View>
              <Text className="text-secondary text-xs font-medium">Fast</Text>
            </View>
            <View className="items-center">
              <View className="w-8 h-8 bg-accent/10 rounded-full justify-center items-center mb-1">
                <Ionicons name="star" size={14} color="#00C851" />
              </View>
              <Text className="text-secondary text-xs font-medium">Trusted</Text>
            </View>
          </View>

          {/* Company tagline */}
          <Text className="text-secondary text-xs text-center font-medium">
            Your Premium Car Services Platform
          </Text>
          <Text className="text-secondary/60 text-xs text-center mt-1">
            Trusted by thousands • Available 24/7
          </Text>
        </Animated.View>
      </LinearGradient>
    </View>
  );
};

export default SplashScreen;