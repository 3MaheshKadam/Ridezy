import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Dimensions,
  Platform,
  Alert,
  FlatList,
  Image,
  StatusBar,
  Animated
} from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { get } from '../../lib/api';
import { endpoints } from '../../config/apiConfig';
const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width * 0.85;
const SPACING = 15;

const SearchWashScreen = ({ navigation }) => {
  const [region, setRegion] = useState({
    latitude: 18.5204, // Default Pune
    longitude: 73.8567,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [userLocation, setUserLocation] = useState(null);

  const [activeIndex, setActiveIndex] = useState(0); // For identifying current card

  const mapRef = useRef(null);
  const flatListRef = useRef(null);

  const filters = [
    { id: 'all', label: 'All', icon: 'apps' },
    { id: 'subscribed', label: 'Premium', icon: 'diamond' },
    // { id: 'nearest', label: 'Nearest', icon: 'navigate' },
  ];

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      setUserLocation({ latitude, longitude });

      const newRegion = {
        latitude,
        longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
      setRegion(newRegion);

      // Animate map to user
      mapRef.current?.animateToRegion(newRegion, 1000);

      // Fetch centers near user
      fetchCenters(latitude, longitude);
    })();
  }, []);

  const fetchCenters = async (lat, lng, query = '') => {
    // Don't show loading on every little move, maybe initial only
    if (centers.length === 0) setLoading(true);

    try {
      let url = `${endpoints.centers.search}?lat=${lat}&lng=${lng}`;
      if (query) url += `&query=${query}`;
      if (selectedFilter !== 'all') url += `&filter=${selectedFilter}`;

      const data = await get(url);
      if (data && data.centers) {
        setCenters(data.centers);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /* 
   * Updated Scroll Logic using onViewableItemsChanged for better accuracy 
   */
  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      const index = viewableItems[0].index;
      if (index !== null && index !== undefined && centers[index]) {
        setActiveIndex(index);
        const center = centers[index];
        if (center.coordinates?.latitude && center.coordinates?.longitude) {
          mapRef.current?.animateToRegion({
            latitude: center.coordinates.latitude,
            longitude: center.coordinates.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }, 500);
        }
      }
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50
  }).current;

  const handleMarkerPress = (index) => {
    setActiveIndex(index);
    flatListRef.current?.scrollToIndex({ index, animated: true });
  };

  const renderCenterCard = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => navigation.navigate('BookWash', { center: item })}
      className="bg-white rounded-2xl p-4 shadow-lg shadow-black/10 items-center flex-row"
      style={{
        width: CARD_WIDTH,
        height: 140,
        marginRight: SPACING,
      }}
    >
      <View className="w-24 h-24 bg-gray-100 rounded-xl mr-4 items-center justify-center">
        <Text className="text-4xl">{item.image || '🚗'}</Text>
      </View>

      <View className="flex-1 justify-between h-full py-1">
        <View>
          <View className="flex-row justify-between items-start">
            <Text className="text-primary text-lg font-bold flex-1 mr-2" numberOfLines={1}>
              {item.name}
            </Text>
            {item.subscribed && (
              <Ionicons name="diamond" size={16} color="#8B5CF6" />
            )}
          </View>
          <Text className="text-secondary text-xs mb-2" numberOfLines={1}>
            {item.address}
          </Text>

          <View className="flex-row items-center mb-1">
            <Ionicons name="star" size={14} color="#F59E0B" />
            <Text className="text-primary text-xs font-bold ml-1">{item.rating}</Text>
            <Text className="text-secondary text-xs ml-1">({item.reviews})</Text>
          </View>

          <View className="flex-row items-center">
            <View className={`px-2 py-0.5 rounded-full ${item.isOpen ? 'bg-green-100' : 'bg-red-100'} mr-2`}>
              <Text className={`text-[10px] font-bold ${item.isOpen ? 'text-green-700' : 'text-red-700'}`}>
                {item.isOpen ? 'OPEN' : 'CLOSED'}
              </Text>
            </View>
            <Text className="text-secondary text-xs">• {item.distance}</Text>
          </View>
        </View>

        <View className="flex-row justify-between items-center mt-2">
          <Text className="text-primary font-bold">₹{item.price}<Text className="text-secondary text-xs font-normal"> / wash</Text></Text>
          <View className="bg-accent px-3 py-1.5 rounded-lg">
            <Text className="text-white text-xs font-bold">Book Now</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />

      {/* Map */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        style={{ width, height }}
        initialRegion={region}
        showsUserLocation={true}
        showsMyLocationButton={false}
      >
        {centers.map((center, index) => (
          <Marker
            key={center.id}
            coordinate={center.coordinates}
            onPress={() => handleMarkerPress(index)}
          >
            <View style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              borderWidth: 2,
              borderColor: activeIndex === index ? 'white' : '#00C851',
              backgroundColor: activeIndex === index ? '#00C851' : 'white',
              transform: [{ scale: activeIndex === index ? 1.1 : 1 }],
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <Ionicons name="car" size={16} color={activeIndex === index ? 'white' : '#00C851'} />
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Top Overlay: Search & Filters */}
      <View
        style={{ position: 'absolute', top: 60, left: 0, right: 0, paddingHorizontal: 16 }}
      >
        <View className="flex-row items-center mb-4">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="w-10 h-10 bg-white rounded-full shadow-md items-center justify-center mr-3"
          >
            <Ionicons name="arrow-back" size={24} color="#1A1B23" />
          </TouchableOpacity>

          <View className="flex-1 bg-white rounded-full shadow-md flex-row items-center px-4 h-12">
            <Ionicons name="search" size={20} color="#6C757D" />
            <TextInput
              className="flex-1 ml-2 text-primary text-base"
              placeholder="Search car wash..."
              value={searchQuery}
              onChangeText={(t) => {
                setSearchQuery(t);
                fetchCenters(region.latitude, region.longitude, t);
              }}
            />
          </View>
        </View>

        <View className="flex-row">
          {filters.map(filter => (
            <TouchableOpacity
              key={filter.id}
              onPress={() => {
                setSelectedFilter(filter.id);
                fetchCenters(region.latitude, region.longitude, searchQuery);
              }}
              className={`mr-2 px-3 py-1.5 rounded-full shadow-sm flex-row items-center ${selectedFilter === filter.id ? 'bg-accent' : 'bg-white'
                }`}
            >
              <Ionicons
                name={filter.icon}
                size={14}
                color={selectedFilter === filter.id ? 'white' : '#4B5563'}
              />
              <Text className={`ml-1 text-xs font-bold ${selectedFilter === filter.id ? 'text-white' : 'text-gray-600'
                }`}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Bottom List */}
      <View style={{ position: 'absolute', bottom: 30, left: 0, right: 0 }}>
        <FlatList
          ref={flatListRef}
          data={centers}
          renderItem={renderCenterCard}
          keyExtractor={item => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={CARD_WIDTH + SPACING}
          decelerationRate="fast"
          contentContainerStyle={{ paddingHorizontal: SPACING }}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          getItemLayout={(data, index) => ({
            length: CARD_WIDTH + SPACING,
            offset: (CARD_WIDTH + SPACING) * index,
            index
          })}
        />
      </View>

      {/* Relocate Button */}
      <TouchableOpacity
        className="absolute bottom-48 right-4 bg-white p-3 rounded-full shadow-lg"
        onPress={async () => {
          let location = await Location.getCurrentPositionAsync({});
          const { latitude, longitude } = location.coords;
          mapRef.current?.animateToRegion({
            latitude,
            longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }, 1000);
        }}
      >
        <Ionicons name="locate" size={24} color="#1A1B23" />
      </TouchableOpacity>

    </View>
  );
};

export default SearchWashScreen;