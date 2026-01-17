import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Animated,
    Dimensions,
    StatusBar,
    Alert,
    Modal,
    TextInput,
    ActivityIndicator,
    Image,
    Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import '../../global.css';
import { get, post } from '../../lib/api';
import { endpoints } from '../../config/apiConfig';

const { width, height } = Dimensions.get('window');

const CarOwnerApprovalScreen = ({ navigation }) => {
    const [activeTab, setActiveTab] = useState('pending'); // pending, approved, rejected
    const [selectedItem, setSelectedItem] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideUpAnim = useRef(new Animated.Value(30)).current;
    const modalSlideAnim = useRef(new Animated.Value(height)).current;

    // State to hold data
    const [pendingList, setPendingList] = useState([]);
    const [approvedList, setApprovedList] = useState([]);
    const [rejectedList, setRejectedList] = useState([]);

    useEffect(() => {
        startAnimations();
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const response = await get(endpoints.admin.approvals);
            const data = response || [];

            // Filter for 'VEHICLE' type (Car Owner Approvals)
            const vehicles = data.filter(item => item.type === 'VEHICLE');

            setPendingList(vehicles.filter(item => item.status === 'PENDING' || item.status === 'PENDING_APPROVAL'));
            setApprovedList(vehicles.filter(item => item.status === 'APPROVED' || item.status === 'ACTIVE'));
            setRejectedList(vehicles.filter(item => item.status === 'REJECTED'));

        } catch (error) {
            console.log('Error fetching approvals:', error);
            Alert.alert('Error', 'Could not fetch approvals.');
        } finally {
            setIsLoading(false);
        }
    };

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

    const openDetailsModal = (item) => {
        setSelectedItem(item);
        setShowDetailsModal(true);
        Animated.timing(modalSlideAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
        }).start();
    };

    const closeDetailsModal = () => {
        Animated.timing(modalSlideAnim, {
            toValue: height,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            setShowDetailsModal(false);
            setSelectedItem(null);
        });
    };

    const openRejectModal = (item) => {
        setSelectedItem(item);
        closeDetailsModal();
        setTimeout(() => {
            setShowRejectModal(true);
            Animated.timing(modalSlideAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start();
        }, 300);
    };

    const closeRejectModal = () => {
        Animated.timing(modalSlideAnim, {
            toValue: height,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            setShowRejectModal(false);
            setRejectionReason('');
            setSelectedItem(null);
        });
    };

    const handleApprove = async (item) => {
        Alert.alert(
            'Approve Vehicle',
            `Are you sure you want to approve ${item.vehicleModel} (${item.vehicleNumber})?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Approve',
                    onPress: async () => {
                        try {
                            await post(endpoints.admin.approve, { id: item.id, type: 'VEHICLE', action: 'APPROVE' });

                            // Optimistic update
                            setPendingList(prev => prev.filter(i => i.id !== item.id));
                            setApprovedList(prev => [...prev, { ...item, status: 'APPROVED', approvedDate: new Date().toISOString() }]);

                            closeDetailsModal();
                            Alert.alert('Success', 'Vehicle approved successfully!');
                        } catch (error) {
                            Alert.alert('Error', 'Failed to approve vehicle.');
                        }
                    },
                },
            ]
        );
    };

    const handleReject = async () => {
        if (!rejectionReason.trim()) {
            Alert.alert('Required', 'Please provide a reason for rejection.');
            return;
        }

        try {
            await post(endpoints.admin.approve, {
                id: selectedItem.id,
                type: 'VEHICLE',
                action: 'REJECT',
                reason: rejectionReason
            });

            // Optimistic update
            setPendingList(prev => prev.filter(i => i.id !== selectedItem.id));
            setRejectedList(prev => [...prev, { ...selectedItem, status: 'REJECTED', rejectedDate: new Date().toISOString(), reason: rejectionReason }]);

            closeRejectModal();
            Alert.alert('Rejected', 'Vehicle registration rejected.');
        } catch (error) {
            Alert.alert('Error', 'Failed to reject vehicle.');
        }
    };

    const renderCard = (item) => (
        <TouchableOpacity
            key={item.id}
            onPress={() => openDetailsModal(item)}
            className="bg-white rounded-2xl p-4 mb-4 shadow-sm shadow-black/5"
            activeOpacity={0.8}
        >
            <View className="flex-row items-center justify-between mb-2">
                <Text className="text-primary text-lg font-bold">{item.ownerName}</Text>
                <View className={`px-2 py-1 rounded-full ${item.status === 'PENDING' ? 'bg-yellow-50' :
                    (item.status === 'APPROVED' || item.status === 'ACTIVE') ? 'bg-green-50' : 'bg-red-50'
                    }`}>
                    <Text className={`text-xs font-bold ${item.status === 'PENDING' ? 'text-yellow-600' :
                        (item.status === 'APPROVED' || item.status === 'ACTIVE') ? 'text-green-600' : 'text-red-600'
                        }`}>{item.status}</Text>
                </View>
            </View>

            <View className="mb-2">
                <Text className="text-secondary text-base">{item.vehicleMake} {item.vehicleModel}</Text>
                <Text className="text-secondary text-sm font-semibold">{item.vehicleNumber}</Text>
            </View>

            {(item.status === 'PENDING' || item.status === 'PENDING_APPROVAL') && (
                <View className="flex-row mt-2 space-x-3">
                    <TouchableOpacity
                        onPress={(e) => { e.stopPropagation(); handleApprove(item); }}
                        className="flex-1 bg-accent/10 rounded-xl py-2 flex-row justify-center items-center"
                    >
                        <Text className="text-accent font-semibold">Approve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={(e) => { e.stopPropagation(); openRejectModal(item); }}
                        className="flex-1 bg-red-50 rounded-xl py-2 flex-row justify-center items-center"
                    >
                        <Text className="text-red-600 font-semibold">Reject</Text>
                    </TouchableOpacity>
                </View>
            )}
        </TouchableOpacity>
    );

    const getCurrentList = () => {
        switch (activeTab) {
            case 'pending': return pendingList;
            case 'approved': return approvedList;
            case 'rejected': return rejectedList;
            default: return [];
        }
    };

    return (
        <View className="flex-1 bg-gray-50">
            <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />

            {/* Header */}
            <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideUpAnim }] }} className="bg-white pt-12 pb-4 px-6 shadow-sm shadow-black/5">
                <View className="flex-row items-center mb-4">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
                        <Ionicons name="chevron-back" size={24} color="#1A1B23" />
                    </TouchableOpacity>
                    <Text className="text-primary text-xl font-bold">Car Owner Approvals</Text>
                </View>

                {/* Tabs */}
                <View className="flex-row bg-gray-100 rounded-xl p-1">
                    {['pending', 'approved', 'rejected'].map(tab => (
                        <TouchableOpacity
                            key={tab}
                            onPress={() => setActiveTab(tab)}
                            className={`flex-1 py-2 rounded-lg items-center ${activeTab === tab ? 'bg-white shadow-sm' : ''}`}
                        >
                            <Text className={`capitalize font-semibold ${activeTab === tab ? 'text-primary' : 'text-secondary'}`}>{tab}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </Animated.View>

            {isLoading ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#00C851" />
                    <Text className="text-secondary mt-4">Loading approvals...</Text>
                </View>
            ) : (
                <ScrollView className="flex-1 p-4">
                    {getCurrentList().map(renderCard)}
                    {getCurrentList().length === 0 && (
                        <View className="items-center mt-10">
                            <Text className="text-secondary">No items found.</Text>
                        </View>
                    )}
                </ScrollView>
            )}

            {/* Details Modal */}
            <Modal visible={showDetailsModal} transparent animationType="none" onRequestClose={closeDetailsModal}>
                <View className="flex-1 bg-black/50 justify-end">
                    <Animated.View style={{ transform: [{ translateY: modalSlideAnim }] }} className="bg-white rounded-t-3xl p-6 h-[80%]">
                        <View className="items-center mb-4">
                            <View className="w-12 h-1 bg-gray-300 rounded-full" />
                        </View>
                        {selectedItem && (
                            <ScrollView>
                                <Text className="text-2xl font-bold text-primary mb-4">{selectedItem.vehicleMake} {selectedItem.vehicleModel}</Text>

                                <View className="bg-gray-50 p-4 rounded-xl mb-4">
                                    <Text className="text-secondary text-sm mb-1">Owner Name</Text>
                                    <Text className="text-primary text-lg font-semibold">{selectedItem.ownerName}</Text>
                                </View>

                                <View className="bg-gray-50 p-4 rounded-xl mb-4">
                                    <Text className="text-secondary text-sm mb-1">Vehicle Number</Text>
                                    <Text className="text-primary text-lg font-semibold">{selectedItem.vehicleNumber}</Text>
                                </View>

                                <View className="bg-gray-50 p-4 rounded-xl mb-4">
                                    <Text className="text-secondary text-sm mb-1">Documents</Text>
                                    <View className="flex-row justify-between mt-2">
                                        {selectedItem.rcDocumentUrl ? (
                                            <TouchableOpacity
                                                onPress={() => Linking.openURL(selectedItem.rcDocumentUrl)}
                                                className="flex-row items-center"
                                            >
                                                <Ionicons name="document-text" size={20} color="#00C851" />
                                                <Text className="ml-2 text-primary font-medium">RC Document</Text>
                                            </TouchableOpacity>
                                        ) : <Text className="text-gray-400">No RC</Text>}

                                        {selectedItem.insuranceUrl ? (
                                            <TouchableOpacity
                                                onPress={() => Linking.openURL(selectedItem.insuranceUrl)}
                                                className="flex-row items-center"
                                            >
                                                <Ionicons name="shield-checkmark" size={20} color="#00C851" />
                                                <Text className="ml-2 text-primary font-medium">Insurance</Text>
                                            </TouchableOpacity>
                                        ) : <Text className="text-gray-400">No Insurance</Text>}
                                    </View>
                                </View>

                                {(selectedItem.status === 'PENDING' || selectedItem.status === 'PENDING_APPROVAL') && (
                                    <TouchableOpacity onPress={() => handleApprove(selectedItem)} className="bg-accent p-4 rounded-xl items-center mt-4">
                                        <Text className="text-white font-bold text-lg">Approve</Text>
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity onPress={closeDetailsModal} className="bg-gray-200 p-4 rounded-xl items-center mt-4">
                                    <Text className="text-primary font-bold">Close</Text>
                                </TouchableOpacity>
                            </ScrollView>
                        )}
                    </Animated.View>
                </View>
            </Modal>

            {/* Reject Modal */}
            <Modal visible={showRejectModal} transparent animationType="none" onRequestClose={closeRejectModal}>
                <View className="flex-1 bg-black/50 justify-end">
                    <Animated.View style={{ transform: [{ translateY: modalSlideAnim }] }} className="bg-white rounded-t-3xl p-6 h-[50%]">
                        <Text className="text-xl font-bold text-red-600 mb-4">Reject Registration</Text>
                        <TextInput
                            value={rejectionReason}
                            onChangeText={setRejectionReason}
                            placeholder="Reason for rejection..."
                            multiline
                            className="bg-gray-50 p-4 rounded-xl h-32 text-top mb-4 border border-gray-200"
                        />
                        <TouchableOpacity onPress={handleReject} className="bg-red-500 p-4 rounded-xl items-center">
                            <Text className="text-white font-bold">Confirm Rejection</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={closeRejectModal} className="mt-4 items-center">
                            <Text className="text-secondary font-medium">Cancel</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </Modal>
        </View>
    );
};

export default CarOwnerApprovalScreen;
