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
    StyleSheet,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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

            setPendingList(vehicles.filter(item =>
                item.status === 'PENDING' ||
                item.status === 'PENDING_APPROVAL' ||
                item.status === 'PENDING_ONBOARDING'
            ));
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
        if (!item || !item.id) return;
        Alert.alert(
            'Approve Vehicle',
            `Are you sure you want to approve ${item.vehicleModel || ''} (${item.vehicleNumber || ''})?`,
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
        if (!selectedItem || !rejectionReason.trim()) {
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

    const renderCard = (item) => {
        if (!item) return null;
        const status = String(item.status || 'UNKNOWN');
        const isPending = status === 'PENDING' || status === 'PENDING_APPROVAL';
        const isApproved = status === 'APPROVED' || status === 'ACTIVE';

        return (
            <TouchableOpacity
                key={item.id ? String(item.id) : Math.random().toString()}
                onPress={() => openDetailsModal(item)}
                style={styles.card}
                activeOpacity={0.8}
            >
                <View style={styles.cardHeader}>
                    <Text style={styles.ownerName}>{String(item.ownerName || 'Unknown Owner')}</Text>
                    <View style={[
                        styles.statusBadge,
                        isPending ? styles.statusBadgePending : isApproved ? styles.statusBadgeApproved : styles.statusBadgeRejected
                    ]}>
                        <Text style={[
                            styles.statusText,
                            isPending ? styles.statusTextPending : isApproved ? styles.statusTextApproved : styles.statusTextRejected
                        ]}>{status}</Text>
                    </View>
                </View>

                <View style={styles.vehicleInfo}>
                    <Text style={styles.vehicleModel}>{String(item.vehicleMake || '')} {String(item.vehicleModel || '')}</Text>
                    <Text style={styles.vehicleNumber}>{String(item.vehicleNumber || 'N/A')}</Text>
                </View>

                {isPending && (
                    <View style={styles.cardActions}>
                        <TouchableOpacity
                            onPress={(e) => { e.stopPropagation(); handleApprove(item); }}
                            style={[styles.actionButton, styles.approveButton]}
                        >
                            <Text style={styles.approveButtonText}>Approve</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={(e) => { e.stopPropagation(); openRejectModal(item); }}
                            style={[styles.actionButton, styles.rejectButton]}
                        >
                            <Text style={styles.rejectButtonText}>Reject</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    const getCurrentList = () => {
        switch (activeTab) {
            case 'pending': return pendingList;
            case 'approved': return approvedList;
            case 'rejected': return rejectedList;
            default: return [];
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />

            {/* Header */}
            <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideUpAnim }] }]}>
                <View style={styles.headerTitleRow}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={24} color="#1A1B23" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Car Owner Approvals</Text>
                </View>

                {/* Tabs */}
                <View style={styles.tabsContainer}>
                    {['pending', 'approved', 'rejected'].map(tab => (
                        <TouchableOpacity
                            key={tab}
                            onPress={() => setActiveTab(tab)}
                            style={[styles.tab, activeTab === tab && styles.activeTab]}
                        >
                            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </Animated.View>

            {isLoading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#00C851" />
                    <Text style={styles.loadingText}>Loading approvals...</Text>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {getCurrentList().map(renderCard)}
                    {getCurrentList().length === 0 && (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="folder-open-outline" size={48} color="#94A3B8" />
                            <Text style={styles.emptyText}>No items found.</Text>
                        </View>
                    )}
                </ScrollView>
            )}

            {/* Details Modal */}
            <Modal visible={showDetailsModal} transparent animationType="none" onRequestClose={closeDetailsModal}>
                <View style={styles.modalOverlay}>
                    <Animated.View style={[styles.modalContent, { transform: [{ translateY: modalSlideAnim }] }]}>
                        <View style={styles.modalHandleContainer}>
                            <View style={styles.modalHandle} />
                        </View>
                        {selectedItem && (
                            <ScrollView showsVerticalScrollIndicator={false}>
                                <Text style={styles.modalTitle}>{selectedItem.vehicleMake} {selectedItem.vehicleModel}</Text>

                                <View style={styles.detailCard}>
                                    <Text style={styles.detailLabel}>Owner Name</Text>
                                    <Text style={styles.detailValue}>{selectedItem.ownerName}</Text>
                                </View>

                                <View style={styles.detailCard}>
                                    <Text style={styles.detailLabel}>Vehicle Number</Text>
                                    <Text style={styles.detailValue}>{selectedItem.vehicleNumber}</Text>
                                </View>

                                <View style={styles.detailCard}>
                                    <Text style={styles.detailLabel}>Documents</Text>
                                    <View style={styles.documentRow}>
                                        {selectedItem.rcDocumentUrl ? (
                                            <TouchableOpacity
                                                onPress={() => Linking.openURL(selectedItem.rcDocumentUrl)}
                                                style={styles.documentLink}
                                            >
                                                <Ionicons name="document-text" size={20} color="#00C851" />
                                                <Text style={styles.documentLinkText}>RC Document</Text>
                                            </TouchableOpacity>
                                        ) : <Text style={styles.documentMissingText}>No RC</Text>}

                                        {selectedItem.insuranceUrl ? (
                                            <TouchableOpacity
                                                onPress={() => Linking.openURL(selectedItem.insuranceUrl)}
                                                style={styles.documentLink}
                                            >
                                                <Ionicons name="shield-checkmark" size={20} color="#00C851" />
                                                <Text style={styles.documentLinkText}>Insurance</Text>
                                            </TouchableOpacity>
                                        ) : <Text style={styles.documentMissingText}>No Insurance</Text>}
                                    </View>
                                </View>

                                {(selectedItem.status === 'PENDING' || selectedItem.status === 'PENDING_APPROVAL') && (
                                    <TouchableOpacity onPress={() => handleApprove(selectedItem)} style={styles.modalApproveButton}>
                                        <Text style={styles.modalApproveButtonText}>Approve</Text>
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity onPress={closeDetailsModal} style={styles.modalCloseButton}>
                                    <Text style={styles.modalCloseButtonText}>Close</Text>
                                </TouchableOpacity>
                            </ScrollView>
                        )}
                    </Animated.View>
                </View>
            </Modal>

            {/* Reject Modal */}
            <Modal visible={showRejectModal} transparent animationType="none" onRequestClose={closeRejectModal}>
                <View style={styles.modalOverlay}>
                    <Animated.View style={[styles.modalContent, { height: '50%', transform: [{ translateY: modalSlideAnim }] }]}>
                        <Text style={styles.rejectModalTitle}>Reject Registration</Text>
                        <TextInput
                            value={rejectionReason}
                            onChangeText={setRejectionReason}
                            placeholder="Reason for rejection..."
                            multiline
                            style={styles.rejectTextInput}
                        />
                        <TouchableOpacity onPress={handleReject} style={styles.confirmRejectButton}>
                            <Text style={styles.confirmRejectButtonText}>Confirm Rejection</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={closeRejectModal} style={styles.cancelRejectButton}>
                            <Text style={styles.cancelRejectButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        bg: '#f9fafb',
    },
    header: {
        backgroundColor: '#fff',
        paddingTop: Platform.OS === 'ios' ? 60 : 50,
        paddingBottom: 15,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    headerTitleRow: {
        flexDirection: 'row',
        itemsCenter: 'center',
        marginBottom: 20,
    },
    backButton: {
        marginRight: 15,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    tabsContainer: {
        flexDirection: 'row',
        backgroundColor: '#f1f5f9',
        borderRadius: 12,
        padding: 4,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 10,
    },
    activeTab: {
        backgroundColor: '#fff',
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
            android: { elevation: 2 },
        }),
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748b',
        textTransform: 'capitalize',
    },
    activeTabText: {
        color: '#0f172a',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 15,
        color: '#64748b',
        fontSize: 14,
    },
    scrollContent: {
        padding: 20,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
            android: { elevation: 3 },
        }),
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    ownerName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusBadgePending: {
        bg: '#fff7ed',
    },
    statusBadgeApproved: {
        bg: '#f0fdf4',
    },
    statusBadgeRejected: {
        bg: '#fef2f2',
    },
    statusText: {
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    statusTextPending: {
        color: '#f59e0b',
    },
    statusTextApproved: {
        color: '#10b981',
    },
    statusTextRejected: {
        color: '#ef4444',
    },
    vehicleInfo: {
        marginBottom: 15,
    },
    vehicleModel: {
        fontSize: 15,
        color: '#334155',
        marginBottom: 2,
    },
    vehicleNumber: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748b',
    },
    cardActions: {
        flexDirection: 'row',
        gap: 12,
    },
    actionButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    approveButton: {
        backgroundColor: '#f0fdf4',
    },
    approveButtonText: {
        color: '#10b981',
        fontWeight: '700',
    },
    rejectButton: {
        backgroundColor: '#fef2f2',
    },
    rejectButtonText: {
        color: '#ef4444',
        fontWeight: '700',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        marginTop: 15,
        color: '#94a3b8',
        fontSize: 16,
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 24,
        height: '80%',
    },
    modalHandleContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    modalHandle: {
        width: 40,
        height: 5,
        backgroundColor: '#e2e8f0',
        borderRadius: 3,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#0f172a',
        marginBottom: 20,
    },
    detailCard: {
        backgroundColor: '#f8fafc',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
    },
    detailLabel: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: '600',
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    detailValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    documentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    documentLink: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    documentLinkText: {
        color: '#00C851',
        fontWeight: '600',
        fontSize: 14,
    },
    documentMissingText: {
        color: '#94a3b8',
        fontSize: 13,
    },
    modalApproveButton: {
        backgroundColor: '#00C851',
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 20,
    },
    modalApproveButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    modalCloseButton: {
        backgroundColor: '#f1f5f9',
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 12,
    },
    modalCloseButtonText: {
        color: '#475569',
        fontWeight: 'bold',
    },
    rejectModalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#ef4444',
        marginBottom: 16,
    },
    rejectTextInput: {
        backgroundColor: '#f8fafc',
        padding: 16,
        borderRadius: 16,
        height: 120,
        textAlignVertical: 'top',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        color: '#0f172a',
        fontWeight: '500',
    },
    confirmRejectButton: {
        backgroundColor: '#ef4444',
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 20,
    },
    confirmRejectButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    cancelRejectButton: {
        marginTop: 15,
        alignItems: 'center',
    },
    cancelRejectButtonText: {
        color: '#64748b',
        fontWeight: '600',
    }
});

export default CarOwnerApprovalScreen;
