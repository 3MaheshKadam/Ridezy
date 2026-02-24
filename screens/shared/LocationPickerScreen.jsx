import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StatusBar, Alert } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

export default function LocationPickerScreen({ navigation, route }) {
    const mapRef = useRef(null);
    const { type, initialLocation } = route.params || {};

    const [region, setRegion] = useState({
        latitude: initialLocation?.latitude || 20.9320, // default Amravati
        longitude: initialLocation?.longitude || 77.7520,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
    });

    const [selectedLocation, setSelectedLocation] = useState(
        initialLocation ? { latitude: initialLocation.latitude, longitude: initialLocation.longitude } : null
    );

    const [address, setAddress] = useState('Fetching address...');

    useEffect(() => {
        if (!initialLocation) {
            getCurrentLocation();
        } else {
            reverseGeocode(initialLocation.latitude, initialLocation.longitude);
        }
    }, [initialLocation]);

    const getCurrentLocation = async () => {
        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Allow location access to pin your location.');
                return;
            }
            const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
            const { latitude, longitude } = loc.coords;
            const newRegion = { latitude, longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 };

            setRegion(newRegion);
            setSelectedLocation({ latitude, longitude });
            reverseGeocode(latitude, longitude);

            // Animate map to newly discovered user location (since initialRegion won't update automatically)
            if (mapRef.current) {
                mapRef.current.animateToRegion(newRegion, 1000);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const reverseGeocode = async (lat, lng) => {
        try {
            setAddress('Fetching address...');
            const result = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
            if (result && result.length > 0) {
                const addr = result[0];
                const formatted = `${addr.name || ''} ${addr.street || ''}, ${addr.city || addr.subregion || ''}`.trim();
                setAddress(formatted || `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`);
            } else {
                setAddress(`Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`);
            }
        } catch (error) {
            setAddress(`Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`);
        }
    };

    const onRegionChangeComplete = (newRegion) => {
        // This stops it from re-fetching if we are just initializing
        const centerCoords = { latitude: newRegion.latitude, longitude: newRegion.longitude };
        setSelectedLocation(centerCoords);
        reverseGeocode(centerCoords.latitude, centerCoords.longitude);
    };

    const onConfirm = () => {
        if (!selectedLocation) return;

        // Use direct callback if provided to completely bypass navigation stack quirks
        if (route.params?.onLocationSelect) {
            route.params.onLocationSelect({
                type,
                latitude: selectedLocation.latitude,
                longitude: selectedLocation.longitude,
                name: address.split(',')[0],
                address: address
            });
            navigation.goBack();
        } else {
            // Fallback for older screens
            navigation.navigate({
                name: route.params?.returnRoute || 'TripRequest',
                params: {
                    mapSelectedLocation: {
                        type,
                        latitude: selectedLocation.latitude,
                        longitude: selectedLocation.longitude,
                        name: address.split(',')[0],
                        address: address
                    }
                },
                merge: true,
            });
        }
    };

    return (
        <View className="flex-1 bg-white">
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

            {/* Header */}
            <View className="pt-12 pb-4 px-6 shadow-sm shadow-black/5 flex-row items-center bg-white z-10">
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    className="w-10 h-10 bg-gray-100 rounded-2xl justify-center items-center"
                >
                    <Ionicons name="chevron-back" size={20} color="#1A1B23" />
                </TouchableOpacity>
                <Text className="text-primary text-lg font-semibold ml-4">
                    {type === 'pickup' ? 'Select Pickup on Map' : 'Select Drop-off on Map'}
                </Text>
            </View>

            <View className="flex-1">
                <MapView
                    ref={mapRef}
                    provider={PROVIDER_DEFAULT}
                    style={{ flex: 1 }}
                    initialRegion={region}
                    onRegionChangeComplete={onRegionChangeComplete}
                    showsUserLocation={true}
                />

                {/* Fixed Center Pin Overlay */}
                <View className="absolute top-1/2 left-1/2 ml-[-15px] mt-[-30px] items-center pointer-events-none">
                    <Ionicons name="location" size={40} color="#00C851" />
                </View>
            </View>

            {/* Bottom Panel */}
            <View className="bg-white rounded-t-3xl p-6 shadow-lg shadow-black mt-[-20px] z-10">
                <Text className="text-secondary text-xs font-semibold mb-1 uppercase tracking-wider">
                    Selected Address
                </Text>
                <Text className="text-primary text-lg font-bold mb-6" numberOfLines={2}>
                    {address}
                </Text>

                <TouchableOpacity
                    onPress={onConfirm}
                    className={`py-4 rounded-xl items-center ${selectedLocation ? 'bg-accent' : 'bg-gray-300'}`}
                    disabled={!selectedLocation}
                >
                    <Text className="text-white text-lg font-bold">Confirm Location</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
