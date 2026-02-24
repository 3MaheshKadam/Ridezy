import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  Modal,
  Image,
  Alert,
  Platform,
  StyleSheet,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { get, post } from '../../lib/api';
import { endpoints } from '../../config/apiConfig';

const { width, height } = Dimensions.get('window');

const DriverApprovalScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('Pending'); // Pending, Approved, Rejected
  const [loading, setLoading] = useState(true);
  const [drivers, setDrivers] = useState({ pending: [], approved: [], rejected: [] });
  const [selectedItem, setSelectedItem] = useState(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    animateScreen();
    fetchDrivers();
  }, []);

  const animateScreen = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideUpAnim, { toValue: 0, duration: 600, useNativeDriver: true })
    ]).start();
  };

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const response = await get(endpoints.admin.approvals);
      const allItems = Array.isArray(response) ? response : [];
      const driverItems = allItems.filter(i => i.type === 'DRIVER');

      setDrivers({
        pending: driverItems.filter(i => i.status === 'PENDING_APPROVAL' || i.status === 'PENDING'),
        approved: driverItems.filter(i => i.status === 'ACTIVE' || i.status === 'APPROVED'),
        rejected: driverItems.filter(i => i.status === 'REJECTED'),
      });
    } catch (error) {
      console.error('Fetch error:', error);
      Alert.alert('Error', 'Unable to load drivers.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (driver) => {
    if (!driver || !driver.id) return;
    try {
      await post(endpoints.admin.approve, { id: driver.id, action: 'APPROVE', type: 'DRIVER' });
      Alert.alert('Success', 'Driver approved successfully');
      setDetailsModalVisible(false);
      fetchDrivers();
    } catch (error) {
      Alert.alert('Error', 'Failed to approve driver');
    }
  };

  const handleReject = async () => {
    if (!selectedItem || !rejectionReason.trim()) {
      Alert.alert('Error', 'Please provide a rejection reason');
      return;
    }
    try {
      await post(endpoints.admin.approve, {
        id: selectedItem.id,
        action: 'REJECT',
        type: 'DRIVER',
        reason: rejectionReason
      });
      Alert.alert('Rejected', 'Driver registration rejected');
      setRejectModalVisible(false);
      setRejectionReason('');
      fetchDrivers();
    } catch (error) {
      Alert.alert('Error', 'Failed to reject driver');
    }
  };

  const renderCard = (item) => {
    const isApproved = activeTab === 'Approved';
    const isRejected = activeTab === 'Rejected';

    return (
      <Animated.View key={String(item.id)} style={{ opacity: fadeAnim, transform: [{ translateY: slideUpAnim }] }}>
        <TouchableOpacity activeOpacity={0.9} onPress={() => { setSelectedItem(item); setDetailsModalVisible(true); }} style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.avatarContainer, isApproved ? styles.avatarApproved : isRejected ? styles.avatarRejected : styles.avatarPending]}>
              <Text style={styles.avatarText}>{item.photo || '👨‍✈️'}</Text>
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.driverName} numberOfLines={1}>
                {String(item.name || 'N/A')}
              </Text>
              <Text style={styles.experienceText}>
                {String(item.experience || 'No experience info')}
              </Text>
            </View>
            <View style={[styles.statusBadge, isApproved ? styles.statusBadgeApproved : isRejected ? styles.statusBadgeRejected : styles.statusBadgePending]}>
              <Text style={[styles.statusText, isApproved ? styles.statusTextApproved : isRejected ? styles.statusTextRejected : styles.statusTextPending]}>
                {activeTab}
              </Text>
            </View>
          </View>

          <View style={styles.cardFooter}>
            <View style={styles.footerItem}>
              <Ionicons name="call-outline" size={16} color="#94A3B8" />
              <Text style={styles.footerText}>{String(item.phone || 'N/A')}</Text>
            </View>
            <View style={styles.footerItem}>
              <Ionicons name="car-outline" size={16} color="#94A3B8" />
              <Text style={styles.footerText} numberOfLines={1}>{String(item.vehicleModel || 'N/A')}</Text>
            </View>
          </View>

          {activeTab === 'Pending' && (
            <View style={styles.cardActions}>
              <TouchableOpacity
                onPress={() => handleApprove(item)}
                style={styles.approveButton}
                activeOpacity={0.8}
              >
                <LinearGradient colors={['#10B981', '#059669']} style={styles.gradientButton}>
                  <Ionicons name="checkmark-circle" size={18} color="white" />
                  <Text style={styles.buttonText}>Approve</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { setSelectedItem(item); setRejectModalVisible(true); }}
                style={styles.rejectButton}
                activeOpacity={0.8}
              >
                <Ionicons name="close-circle" size={18} color="#64748B" />
                <Text style={styles.rejectButtonText}>Reject</Text>
              </TouchableOpacity>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const currentList = activeTab === 'Pending' ? drivers.pending : activeTab === 'Approved' ? drivers.approved : drivers.rejected;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Driver Approvals</Text>
        </View>

        <View style={styles.tabsContainer}>
          {['Pending', 'Approved', 'Rejected'].map(tab => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#3B82F6" /></View>
      ) : (
        <ScrollView contentContainerStyle={styles.listContent}>
          {currentList.map(renderCard)}
          {currentList.length === 0 && (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color="#E2E8F0" />
              <Text style={styles.emptyText}>No Drivers Found</Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* Details Modal */}
      <Modal visible={detailsModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandleContainer}>
              <View style={styles.modalHandle} />
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedItem && (
                <View>
                  <View style={styles.modalHeader}>
                    <View style={styles.modalAvatar}>
                      <Text style={styles.modalAvatarText}>{selectedItem.photo || '👨‍✈️'}</Text>
                    </View>
                    <Text style={styles.modalTitle}>{String(selectedItem.name || 'N/A')}</Text>
                    <Text style={styles.modalSubtitle}>{String(selectedItem.experience || 'No experience info')}</Text>
                  </View>

                  <View style={styles.detailsCard}>
                    <Text style={styles.detailsLabel}>Personal Information</Text>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailTitle}>Email</Text>
                      <Text style={styles.detailValue}>{String(selectedItem.email || 'N/A')}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailTitle}>Phone</Text>
                      <Text style={styles.detailValue}>{String(selectedItem.phone || 'N/A')}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailTitle}>License No</Text>
                      <Text style={styles.detailValue}>{String(selectedItem.licenseNumber || 'N/A')}</Text>
                    </View>
                  </View>

                  <View style={styles.detailsCard}>
                    <Text style={styles.detailsLabel}>Vehicle Information</Text>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailTitle}>Model</Text>
                      <Text style={styles.detailValue}>{String(selectedItem.vehicleModel || 'N/A')}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailTitle}>Plate No</Text>
                      <Text style={styles.detailValue}>{String(selectedItem.vehicleNumber || 'N/A')}</Text>
                    </View>
                  </View>

                  {activeTab === 'Pending' && (
                    <TouchableOpacity onPress={() => handleApprove(selectedItem)} style={styles.modalApproveButton}>
                      <LinearGradient colors={['#10B981', '#059669']} style={styles.modalGradientButton}>
                        <Text style={styles.modalApproveText}>Approve Driver</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={() => setDetailsModalVisible(false)} style={styles.modalCloseButton}>
                    <Text style={styles.modalCloseText}>Close Details</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Reject Modal */}
      <Modal visible={rejectModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { height: 'auto' }]}>
            <View style={styles.modalHandleContainer}>
              <View style={styles.modalHandle} />
            </View>
            <Text style={styles.rejectModalTitle}>Rejection Reason</Text>
            <TextInput
              style={styles.rejectInput}
              placeholder="Reason for rejection..." multiline
              value={rejectionReason} onChangeText={setRejectionReason}
            />
            <View style={styles.rejectActions}>
              <TouchableOpacity onPress={() => setRejectModalVisible(false)} style={styles.rejectCancelButton}>
                <Text style={styles.rejectCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleReject} style={styles.rejectConfirmButton}>
                <LinearGradient colors={['#F43F5E', '#E11D48']} style={styles.rejectConfirmGradient}>
                  <Text style={styles.rejectConfirmText}>Confirm Rejection</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    backgroundColor: '#fff',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    padding: 6,
    borderRadius: 24,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 16,
  },
  activeTab: {
    backgroundColor: '#fff',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
      android: { elevation: 2 },
    }),
  },
  tabText: {
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    color: '#94A3B8',
  },
  activeTabText: {
    color: '#3B82F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 15 },
      android: { elevation: 4 },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarPending: { backgroundColor: '#eff6ff' },
  avatarApproved: { backgroundColor: '#ecfdf5' },
  avatarRejected: { backgroundColor: '#fff1f2' },
  avatarText: { fontSize: 28 },
  headerInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  experienceText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgePending: { backgroundColor: '#fffbeb' },
  statusBadgeApproved: { backgroundColor: '#ecfdf5' },
  statusBadgeRejected: { backgroundColor: '#fff1f2' },
  statusText: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  statusTextPending: { color: '#b45309' },
  statusTextApproved: { color: '#047857' },
  statusTextRejected: { color: '#be123c' },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  footerText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '700',
    marginLeft: 8,
  },
  cardActions: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 12,
  },
  approveButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradientButton: {
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '900',
    marginLeft: 8,
  },
  rejectButton: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
  },
  rejectButtonText: {
    color: '#64748B',
    fontWeight: '900',
    marginLeft: 8,
  },
  emptyContainer: {
    paddingVertical: 80,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    color: '#94A3B8',
    fontWeight: '900',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    padding: 32,
    paddingBottom: 48,
    maxHeight: '85%',
  },
  modalHandleContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalHandle: {
    width: 64,
    height: 4,
    backgroundColor: '#f1f5f9',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 32,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  modalAvatar: {
    width: 80,
    height: 80,
    backgroundColor: '#eff6ff',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalAvatarText: { fontSize: 40 },
  modalTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 8,
    textAlign: 'center',
  },
  detailsCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 32,
    padding: 24,
    marginBottom: 24,
  },
  detailsLabel: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    color: '#94A3B8',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
  },
  modalApproveButton: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 16,
  },
  modalGradientButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  modalApproveText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
  },
  modalCloseButton: {
    backgroundColor: '#f8fafc',
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: 'center',
  },
  modalCloseText: {
    color: '#64748B',
    fontWeight: '900',
  },
  rejectModalTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 16,
  },
  rejectInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 24,
    padding: 24,
    color: '#0F172A',
    height: 128,
    textAlignVertical: 'top',
    fontWeight: '700',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  rejectActions: {
    flexDirection: 'row',
    marginTop: 32,
    gap: 16,
  },
  rejectCancelButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  rejectCancelText: {
    color: '#94A3B8',
    fontWeight: '900',
  },
  rejectConfirmButton: {
    flex: 2,
    borderRadius: 24,
    overflow: 'hidden',
  },
  rejectConfirmGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  rejectConfirmText: {
    color: '#fff',
    fontWeight: '900',
  }
});

export default DriverApprovalScreen;