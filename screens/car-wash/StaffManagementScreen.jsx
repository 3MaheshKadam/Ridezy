import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    FlatList,
    Modal,
    TextInput,
    Alert,
    StatusBar,
    Animated,
    Dimensions,
    ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { get, post, del } from '../../lib/api';
import { endpoints } from '../../config/apiConfig';
const { width, height } = Dimensions.get('window');

const StaffManagementScreen = ({ navigation }) => {
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);

    // Form State
    const [newName, setNewName] = useState('');
    const [newPhone, setNewPhone] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [adding, setAdding] = useState(false);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideUpAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        startAnimations();
        fetchStaff();
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

    const fetchStaff = async () => {
        try {
            const data = await get(endpoints.centers.staff);
            if (data && data.staff) {
                setStaff(data.staff);
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to fetch staff members');
        } finally {
            setLoading(false);
        }
    };

    const handleAddStaff = async () => {
        if (!newName || !newPhone || !newPassword) {
            Alert.alert('Error', 'Please fill all fields');
            return;
        }

        setAdding(true);
        try {
            const response = await post(endpoints.centers.staff, {
                full_name: newName,
                phone: newPhone,
                password: newPassword
            });

            if (response && response.staff) {
                setStaff([...staff, response.staff]);
                setShowAddModal(false);
                setNewName('');
                setNewPhone('');
                setNewPassword('');
                Alert.alert('Success', 'Staff member added successfully');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', error.message || 'Failed to add staff');
        } finally {
            setAdding(false);
        }
    };

    const handleRemoveStaff = (id) => {
        Alert.alert(
            'Remove Staff',
            'Are you sure you want to remove this staff member?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await del(`${endpoints.centers.staff}/${id}`);
                            setStaff(staff.filter(s => s._id !== id));
                            Alert.alert('Success', 'Staff member removed');
                        } catch (error) {
                            Alert.alert('Error', 'Failed to remove staff');
                        }
                    }
                }
            ]
        );
    };

    const renderStaffItem = ({ item }) => (
        <View className="bg-white rounded-2xl p-4 mb-3 shadow-sm shadow-black/5 border border-gray-100 flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
                <View className="w-12 h-12 bg-gray-100 rounded-full justify-center items-center mr-3">
                    <Text className="text-xl">👤</Text>
                </View>
                <View>
                    <Text className="text-primary text-lg font-bold">{item.full_name}</Text>
                    <Text className="text-secondary text-sm">{item.phone}</Text>
                </View>
            </View>

            <TouchableOpacity
                onPress={() => handleRemoveStaff(item._id)}
                className="w-10 h-10 bg-red-50 rounded-xl justify-center items-center"
            >
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
            </TouchableOpacity>
        </View>
    );

    return (
        <View className="flex-1 bg-gray-50">
            <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />

            {/* Header */}
            <Animated.View
                style={{ opacity: fadeAnim, transform: [{ translateY: slideUpAnim }] }}
                className="bg-white pt-12 pb-4 px-6 shadow-sm shadow-black/5 z-10"
            >
                <View className="flex-row items-center justify-between">
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        className="w-10 h-10 bg-gray-100 rounded-2xl justify-center items-center"
                    >
                        <Ionicons name="chevron-back" size={20} color="#1A1B23" />
                    </TouchableOpacity>
                    <Text className="text-primary text-lg font-semibold">Staff Management</Text>
                    <TouchableOpacity
                        onPress={() => setShowAddModal(true)}
                        className="w-10 h-10 bg-accent/10 rounded-2xl justify-center items-center"
                    >
                        <Ionicons name="add" size={24} color="#00C851" />
                    </TouchableOpacity>
                </View>
            </Animated.View>

            {/* Content */}
            <View className="flex-1 px-4 pt-4">
                {loading ? (
                    <ActivityIndicator size="large" color="#00C851" className="mt-10" />
                ) : (
                    <FlatList
                        data={staff}
                        renderItem={renderStaffItem}
                        keyExtractor={item => item._id}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={
                            <View className="items-center justify-center py-20">
                                <Ionicons name="people-outline" size={48} color="#D1D5DB" />
                                <Text className="text-gray-400 mt-4 text-center">No staff members found.{'\n'}Add your first staff member!</Text>
                            </View>
                        }
                    />
                )}
            </View>

            {/* Add Staff Modal */}
            <Modal
                visible={showAddModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowAddModal(false)}
            >
                <View className="flex-1 bg-black/50 justify-end">
                    <View className="bg-white rounded-t-3xl p-6 h-auto">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-xl font-bold text-primary">Add New Staff</Text>
                            <TouchableOpacity onPress={() => setShowAddModal(false)}>
                                <Ionicons name="close" size={24} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        <View className="mb-4">
                            <Text className="text-secondary text-sm mb-1">Full Name</Text>
                            <TextInput
                                className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-primary"
                                placeholder="John Doe"
                                value={newName}
                                onChangeText={setNewName}
                            />
                        </View>

                        <View className="mb-4">
                            <Text className="text-secondary text-sm mb-1">Phone Number</Text>
                            <TextInput
                                className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-primary"
                                placeholder="9876543210"
                                keyboardType="phone-pad"
                                value={newPhone}
                                onChangeText={setNewPhone}
                            />
                        </View>

                        <View className="mb-8">
                            <Text className="text-secondary text-sm mb-1">Password</Text>
                            <TextInput
                                className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-primary"
                                placeholder="Secret password"
                                secureTextEntry
                                value={newPassword}
                                onChangeText={setNewPassword}
                            />
                        </View>

                        <TouchableOpacity
                            onPress={handleAddStaff}
                            disabled={adding}
                            className="rounded-xl overflow-hidden shadow-lg shadow-accent/30"
                        >
                            <LinearGradient
                                colors={['#00C851', '#00A843']}
                                className="py-4 items-center"
                            >
                                {adding ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text className="text-white font-bold text-lg">Add Staff Member</Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

        </View>
    );
};

export default StaffManagementScreen;
