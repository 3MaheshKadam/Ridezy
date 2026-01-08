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
  FlatList,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import '../../global.css';

const { width, height } = Dimensions.get('window');

const SearchWashScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedCenter, setSelectedCenter] = useState(null);
  const [userLocation, setUserLocation] = useState({
    latitude: 20.9374, // Amravati coordinates
    longitude: 77.7796,
  });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(30)).current;

  // Mock data for car wash centers
  const carWashCenters = [
    {
      id: '1',
      name: 'Premium Auto Spa',
      address: 'Rajkamal Square, Amravati',
      distance: '0.8 km',
      rating: 4.8,
      reviews: 156,
      price: 299,
      originalPrice: 399,
      services: ['Exterior Wash', 'Interior Cleaning', 'Wax Polish'],
      image: '🚗',
      isOpen: true,
      subscribed: true,
      coordinates: { latitude: 20.9334, longitude: 77.7756 },
    },
    {
      id: '2',
      name: 'Quick Clean Center',
      address: 'Badnera Road, Amravati',
      distance: '1.2 km',
      rating: 4.5,
      reviews: 89,
      price: 199,
      originalPrice: 249,
      services: ['Basic Wash', 'Vacuum Clean'],
      image: '🧽',
      isOpen: true,
      subscribed: false,
      coordinates: { latitude: 20.9294, longitude: 77.7836 },
    },
    {
      id: '3',
      name: 'Elite Car Care',
      address: 'Camp Road, Amravati',
      distance: '2.1 km',
      rating: 4.9,
      reviews: 203,
      price: 449,
      originalPrice: 549,
      services: ['Premium Wash', 'Engine Clean', 'Ceramic Coating'],
      image: '✨',
      isOpen: false,
      subscribed: false,
      coordinates: { latitude: 20.9254, longitude: 77.7696 },
    },
    {
      id: '4',
      name: 'Eco Wash Station',
      address: 'Kathora Road, Amravati',
      distance: '1.8 km',
      rating: 4.6,
      reviews: 124,
      price: 249,
      originalPrice: 299,
      services: ['Eco Wash', 'Steam Clean', 'Interior Polish'],
      image: '🌿',
      isOpen: true,
      subscribed: true,
      coordinates: { latitude: 20.9414, longitude: 77.7776 },
    },
  ];

  const filters = [
    { id: 'all', label: 'All', icon: 'list' },
    { id: 'nearest', label: 'Nearest', icon: 'location' },
    { id: 'premium', label: 'Premium', icon: 'star' },
    { id: 'subscribed', label: 'Subscribed', icon: 'checkmark-circle' },
    { id: 'open', label: 'Open Now', icon: 'time' },
  ];

  useEffect(() => {
    startAnimations();
    getCurrentLocation();
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

  const getCurrentLocation = async () => {
    try {
      // TODO: Implement actual location fetching
      // const location = await Location.getCurrentPositionAsync({});
      // setUserLocation({
      //   latitude: location.coords.latitude,
      //   longitude: location.coords.longitude,
      // });
    } catch (error) {
      console.log('Location error:', error);
    }
  };

  const getFilteredCenters = () => {
    let filtered = carWashCenters;

    if (searchQuery) {
      filtered = filtered.filter(center =>
        center.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        center.address.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    switch (selectedFilter) {
      case 'nearest':
        return filtered.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
      case 'premium':
        return filtered.filter(center => center.price > 300);
      case 'subscribed':
        return filtered.filter(center => center.subscribed);
      case 'open':
        return filtered.filter(center => center.isOpen);
      default:
        return filtered;
    }
  };

  const handleCenterSelect = (center) => {
    setSelectedCenter(center);
    navigation.navigate('BookWash', { center });
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  const renderCarWashCenter = ({ item }) => (
    <TouchableOpacity
      onPress={() => handleCenterSelect(item)}
      activeOpacity={0.8}
      className="bg-white rounded-2xl mx-4 mb-4 shadow-sm shadow-black/5 border border-gray-100 overflow-hidden"
    >
      {/* Header with status */}
      <View className="flex-row items-center justify-between p-4 pb-3">
        <View className="flex-row items-center">
          <Text className="text-2xl mr-3">{item.image}</Text>
          <View className="flex-1">
            <Text className="text-primary text-lg font-bold mb-1">
              {item.name}
            </Text>
            <View className="flex-row items-center">
              <Ionicons name="location-outline" size={14} color="#6C757D" />
              <Text className="text-secondary text-sm ml-1">
                {item.address}
              </Text>
            </View>
          </View>
        </View>

        <View className="items-end">
          <View className={`px-2 py-1 rounded-full ${item.isOpen ? 'bg-green-100' : 'bg-red-100'
            }`}>
            <Text className={`text-xs font-semibold ${item.isOpen ? 'text-green-600' : 'text-red-600'
              }`}>
              {item.isOpen ? 'Open' : 'Closed'}
            </Text>
          </View>
          {item.subscribed && (
            <View className="bg-accent/10 px-2 py-1 rounded-full mt-1">
              <Text className="text-accent text-xs font-semibold">
                Subscribed
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Rating and Distance */}
      <View className="flex-row items-center justify-between px-4 pb-3">
        <View className="flex-row items-center">
          <View className="flex-row items-center bg-yellow-50 px-2 py-1 rounded-full mr-3">
            <Ionicons name="star" size={14} color="#F59E0B" />
            <Text className="text-yellow-600 text-sm font-semibold ml-1">
              {item.rating}
            </Text>
          </View>
          <Text className="text-secondary text-sm">
            ({item.reviews} reviews)
          </Text>
        </View>

        <View className="flex-row items-center">
          <Ionicons name="navigate-outline" size={14} color="#6C757D" />
          <Text className="text-secondary text-sm ml-1">
            {item.distance} away
          </Text>
        </View>
      </View>

      {/* Services */}
      <View className="px-4 pb-3">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row">
            {item.services.map((service, index) => (
              <View
                key={index}
                className="bg-gray-50 px-3 py-2 rounded-full mr-2"
              >
                <Text className="text-secondary text-xs font-medium">
                  {service}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Pricing */}
      <View className="bg-gray-50 px-4 py-3 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Text className="text-primary text-xl font-bold">
            ₹{item.price}
          </Text>
          {item.originalPrice && (
            <Text className="text-secondary text-sm line-through ml-2">
              ₹{item.originalPrice}
            </Text>
          )}
          {item.originalPrice && (
            <View className="bg-green-100 px-2 py-1 rounded-full ml-2">
              <Text className="text-green-600 text-xs font-semibold">
                {Math.round((1 - item.price / item.originalPrice) * 100)}% OFF
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          onPress={() => handleCenterSelect(item)}
          className="rounded-2xl overflow-hidden"
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#00C851', '#00A843']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              borderRadius: 16,
              paddingVertical: 8,
              paddingHorizontal: 16,
            }}
          >
            <Text className="text-white text-sm font-semibold">
              Book Now
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

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
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity
            onPress={handleBackPress}
            className="w-10 h-10 bg-gray-100 rounded-2xl justify-center items-center"
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={20} color="#1A1B23" />
          </TouchableOpacity>

          <View className="flex-1 items-center">
            <Text className="text-primary text-lg font-semibold">Find Car Wash</Text>
          </View>

          <TouchableOpacity
            className="w-10 h-10 rounded-2xl justify-center items-center bg-gray-100"
            activeOpacity={0.7}
          >
            {/* Placeholder or just empty view if we want to remove the button entirely, but keeping layout balanced */}
            <View />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View className="bg-gray-50 rounded-2xl border-2 border-gray-100 flex-row items-center px-4 py-3">
          <Ionicons name="search" size={20} color="#6C757D" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search car wash centers..."
            placeholderTextColor="#6C757D"
            className="flex-1 ml-3 text-primary text-base"
          />
          {searchQuery ? (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              activeOpacity={0.7}
            >
              <Ionicons name="close-circle" size={20} color="#6C757D" />
            </TouchableOpacity>
          ) : null}
        </View>
      </Animated.View>

      {/* Filter Tabs */}
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideUpAnim }],
        }}
        className="bg-white px-4 py-3 border-b border-gray-100"
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row space-x-3">
            {filters.map((filter) => (
              <TouchableOpacity
                key={filter.id}
                onPress={() => setSelectedFilter(filter.id)}
                className={`flex-row items-center px-4 py-2 rounded-full border ${selectedFilter === filter.id
                    ? 'bg-accent border-accent'
                    : 'bg-white border-gray-200'
                  }`}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={filter.icon}
                  size={16}
                  color={selectedFilter === filter.id ? '#ffffff' : '#6C757D'}
                />
                <Text
                  className={`ml-2 text-sm font-medium ${selectedFilter === filter.id ? 'text-white' : 'text-secondary'
                    }`}
                >
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </Animated.View>



      {/* Results Header */}
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideUpAnim }],
        }}
        className="px-4 py-3"
      >
        <Text className="text-primary text-base font-semibold">
          {getFilteredCenters().length} car wash centers found
        </Text>
      </Animated.View>

      {/* Car Wash Centers List */}
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideUpAnim }],
        }}
        className="flex-1"
      >
        <FlatList
          data={getFilteredCenters()}
          renderItem={renderCarWashCenter}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      </Animated.View>
    </View>
  );
};

export default SearchWashScreen;