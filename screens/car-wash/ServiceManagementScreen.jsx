import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StatusBar,
    TouchableOpacity,
    ScrollView,
    Switch,
    Alert,
    TextInput,
    Modal
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import '../../global.css';
import { get, post, put, del } from '../../lib/api';
import { endpoints } from '../../config/apiConfig';

const ServiceManagementScreen = ({ navigation }) => {
    const [activeTab, setActiveTab] = useState('CAR');
    const [services, setServices] = useState([]);

    // Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentService, setCurrentService] = useState({
        name: '', price: '', duration: '', description: '', category: 'STANDARD', isActive: true, type: 'CAR',
    });

    useEffect(() => {
        fetchServices();
    }, []);

    const fetchServices = async () => {
        try {
            const data = await get(endpoints.centers.services);
            if (data) {
                setServices(data);
            }
        } catch (error) {
            console.error("Failed to fetch services", error);
        }
    };

    const filteredServices = services.filter(s => s.type === activeTab);

    // Handlers
    const handleToggleStatus = async (service) => {
        try {
            await put(endpoints.centers.services, { ...service, isActive: !service.isActive });
            setServices(services.map(s => s._id === service._id ? { ...s, isActive: !s.isActive } : s));
        } catch (error) {
            Alert.alert('Error', 'Failed to update status');
        }
    };

    const handleDeleteService = (id) => {
        Alert.alert('Confirm Delete', 'Are you sure you want to delete this service?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive', onPress: async () => {
                    try {
                        await del(`${endpoints.centers.services}?id=${id}`);
                        fetchServices();
                    } catch (error) {
                        Alert.alert('Error', 'Failed to delete service');
                    }
                }
            }
        ]);
    };

    const handleSaveService = async () => {
        if (!currentService.name || !currentService.price || !currentService.duration) {
            Alert.alert('Error', 'Please fill all required fields');
            return;
        }

        const payload = {
            ...currentService,
            type: activeTab,
            price: parseFloat(currentService.price),
            duration: parseInt(currentService.duration),
        };

        try {
            if (isEditing) {
                await put(endpoints.centers.services, payload);
                Alert.alert('Success', 'Service updated successfully');
            } else {
                await post(endpoints.centers.services, payload);
                Alert.alert('Success', 'Service added successfully');
            }
            setModalVisible(false);
            fetchServices();
            resetForm();
        } catch (error) {
            Alert.alert('Error', 'Failed to save service');
        }
    };

    const openEditModal = (service) => {
        setIsEditing(true);
        setCurrentService({
            _id: service._id,
            name: service.name,
            price: service.price.toString(),
            duration: service.duration.toString(),
            description: service.description || '',
            category: service.category,
            isActive: service.isActive,
            type: service.type
        });
        setModalVisible(true);
    };

    const resetForm = () => {
        setCurrentService({
            name: '', price: '', duration: '', description: '', category: 'STANDARD', isActive: true, type: activeTab
        });
        setIsEditing(false);
    };

    return (
        <View className="flex-1 bg-gray-50">
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            {/* Header - REMOVED SHADOWS, Z-INDEX */}
            <View className="bg-white px-6 pt-12 pb-4 border-b border-gray-100">
                <View className="flex-row items-center justify-between">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 bg-gray-100 rounded-full">
                        <Ionicons name="arrow-back" size={24} color="#1F2937" />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold text-gray-900">Manage Services</Text>
                    <View className="w-10" />
                </View>

                {/* Tabs - REMOVED SHADOWS */}
                <View className="flex-row mt-6 bg-gray-100 p-1 rounded-xl">
                    <TouchableOpacity
                        onPress={() => setActiveTab('CAR')}
                        className={`flex-1 py-2 rounded-lg items-center ${activeTab === 'CAR' ? 'bg-white' : ''}`}
                    >
                        <Text className={`font-semibold ${activeTab === 'CAR' ? 'text-blue-600' : 'text-gray-500'}`}>Cars</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setActiveTab('BIKE')}
                        className={`flex-1 py-2 rounded-lg items-center ${activeTab === 'BIKE' ? 'bg-white' : ''}`}
                    >
                        <Text className={`font-semibold ${activeTab === 'BIKE' ? 'text-blue-600' : 'text-gray-500'}`}>Bikes</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* List - REMOVED SHADOWS */}
            <ScrollView contentContainerStyle={{ padding: 20 }}>
                {filteredServices.length === 0 ? (
                    <View className="items-center justify-center py-20">
                        <Text className="text-gray-400">No services found for {activeTab.toLowerCase()}s</Text>
                    </View>
                ) : (
                    filteredServices.map(item => (
                        <View key={item._id} className="bg-white rounded-2xl p-4 mb-4 border border-gray-100 flex-row items-center">
                            <View className={`w-12 h-12 rounded-full justify-center items-center mr-4 ${item.isActive ? 'bg-blue-50' : 'bg-gray-100'}`}>
                                <MaterialCommunityIcons
                                    name={item.type === 'CAR' ? 'car-wash' : 'motorbike'}
                                    size={24}
                                    color={item.isActive ? '#3B82F6' : '#9CA3AF'}
                                />
                            </View>

                            <View className="flex-1">
                                <Text className={`text-lg font-bold ${item.isActive ? 'text-gray-900' : 'text-gray-400'}`}>{item.name}</Text>
                                <Text className="text-gray-500 text-sm">{item.category} • {item.duration} mins</Text>
                                <Text className="text-gray-900 font-bold mt-1">₹{item.price}</Text>
                            </View>

                            <View className="items-end space-y-2">
                                <Switch
                                    value={item.isActive}
                                    onValueChange={() => handleToggleStatus(item)}
                                    trackColor={{ false: '#767577', true: '#3B82F6' }}
                                    thumbColor={item.isActive ? '#fff' : '#f4f3f4'}
                                />
                                <View className="flex-row space-x-2 mt-2">
                                    <TouchableOpacity onPress={() => openEditModal(item)} className="p-2 bg-gray-100 rounded-full">
                                        <Ionicons name="pencil" size={16} color="#4B5563" />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => handleDeleteService(item._id)} className="p-2 bg-red-50 rounded-full">
                                        <Ionicons name="trash" size={16} color="#EF4444" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    ))
                )}
                {/* Spacer for FAB */}
                <View className="h-24" />
            </ScrollView>

            {/* FAB - REMOVED SHADOWS */}
            <TouchableOpacity
                onPress={() => { resetForm(); setModalVisible(true); }}
                className="absolute bottom-8 right-8 w-14 h-14 bg-blue-600 rounded-full justify-center items-center"
            >
                <Ionicons name="add" size={30} color="#fff" />
            </TouchableOpacity>

            {/* Modal */}
            <Modal visible={modalVisible} animationType="slide" transparent={true}>
                <View className="flex-1 bg-black/50 justify-end">
                    <View className="bg-white rounded-t-3xl p-6 h-3/4">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-xl font-bold">{isEditing ? 'Edit Service' : 'Add New Service'}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)} className="p-2">
                                <Ionicons name="close" size={24} color="#000" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text className="text-gray-500 text-sm mb-1">Service Name</Text>
                            <TextInput
                                className="bg-gray-100 p-4 rounded-xl mb-4 font-semibold"
                                placeholder="e.g. Foam Wash"
                                value={currentService.name}
                                onChangeText={text => setCurrentService({ ...currentService, name: text })}
                            />

                            <View className="flex-row space-x-4 mb-4">
                                <View className="flex-1">
                                    <Text className="text-gray-500 text-sm mb-1">Price (₹)</Text>
                                    <TextInput
                                        className="bg-gray-100 p-4 rounded-xl font-semibold"
                                        placeholder="499"
                                        keyboardType="numeric"
                                        value={currentService.price}
                                        onChangeText={text => setCurrentService({ ...currentService, price: text })}
                                    />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-gray-500 text-sm mb-1">Duration (mins)</Text>
                                    <TextInput
                                        className="bg-gray-100 p-4 rounded-xl font-semibold"
                                        placeholder="45"
                                        keyboardType="numeric"
                                        value={currentService.duration}
                                        onChangeText={text => setCurrentService({ ...currentService, duration: text })}
                                    />
                                </View>
                            </View>

                            <Text className="text-gray-500 text-sm mb-1">Category</Text>
                            <View className="flex-row flex-wrap gap-2 mb-4">
                                {['STANDARD', 'PREMIUM', 'LUXURY'].map(cat => (
                                    <TouchableOpacity
                                        key={cat}
                                        onPress={() => setCurrentService({ ...currentService, category: cat })}
                                        className={`px-4 py-2 rounded-full ${currentService.category === cat ? 'bg-blue-600' : 'bg-gray-200'}`}
                                    >
                                        <Text className={`${currentService.category === cat ? 'text-white' : 'text-gray-600'} font-semibold text-xs`}>{cat}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text className="text-gray-500 text-sm mb-1">Description (Optional)</Text>
                            <TextInput
                                className="bg-gray-100 p-4 rounded-xl mb-6 min-h-[100px]"
                                placeholder="What's included in this service?"
                                multiline
                                textAlignVertical="top"
                                value={currentService.description}
                                onChangeText={text => setCurrentService({ ...currentService, description: text })}
                            />

                            <TouchableOpacity
                                onPress={handleSaveService}
                                className="bg-blue-600 p-4 rounded-xl items-center"
                            >
                                <Text className="text-white font-bold text-lg">Save Service</Text>
                            </TouchableOpacity>
                            <View className="h-20" />
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default ServiceManagementScreen;
