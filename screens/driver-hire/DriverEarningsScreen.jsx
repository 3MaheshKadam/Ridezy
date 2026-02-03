import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    Alert,
    StyleSheet,
    ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { get } from '../../lib/api';
import { endpoints } from '../../config/apiConfig';

const DriverEarningsScreen = ({ navigation }) => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [selectedPeriod, setSelectedPeriod] = useState('week');

    // Fallback data
    const defaultStats = {
        performance: {
            today: { earnings: 0, trips: 0, hours: 0 },
            week: { earnings: 0, trips: 0, hours: 0 },
            month: { earnings: 0, trips: 0, hours: 0 },
        },
        transactions: [],
        balance: 0
    };

    useEffect(() => {
        fetchEarningsData();
    }, []);

    const fetchEarningsData = async () => {
        try {
            const data = await get(endpoints.drivers.earnings);
            setStats(data);
        } catch (error) {
            console.error("Failed to fetch earnings:", error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        if (amount === undefined || amount === null) return '₹0';
        return '₹' + Math.floor(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };

    const safeStats = stats || defaultStats;
    const safePerformance = safeStats.performance || defaultStats.performance;
    const displayedStats = safePerformance[selectedPeriod] || defaultStats.performance[selectedPeriod];

    const transactions = safeStats.transactions || [];
    const currentBalance = safeStats.balance || 0;

    const handleDetailsPress = () => {
        Alert.alert(
            'Balance Details',
            `Available Balance: ${formatCurrency(currentBalance)}\n\n(Calculated from Total Earnings - Total Withdrawals)`
        );
    };

    const handlePeriodChange = (period) => {
        // Safe state update
        requestAnimationFrame(() => setSelectedPeriod(period));
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                    activeOpacity={0.7}
                >
                    <Ionicons name="chevron-back" size={24} color="#1A1B23" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Earnings</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Total Balance Card */}
                {/* Replaced LinearGradient with View for stability */}
                <View style={styles.balanceCard}>
                    <Text style={styles.balanceLabel}>Total Balance</Text>
                    <Text style={styles.balanceAmount}>
                        {formatCurrency(currentBalance)}
                    </Text>

                    <View style={styles.actionButtonsRow}>
                        {/* Withdraw Button Removed */}
                        <TouchableOpacity
                            onPress={handleDetailsPress}
                            style={styles.actionButtonSecondary}
                        >
                            <Text style={styles.actionButtonText}>Details</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Period Selector */}
                <View style={styles.periodSelector}>
                    {['today', 'week', 'month'].map((p) => (
                        <TouchableOpacity
                            key={p}
                            onPress={() => handlePeriodChange(p)}
                            style={[
                                styles.periodButton,
                                selectedPeriod === p && styles.periodButtonActive
                            ]}
                        >
                            <Text style={[
                                styles.periodButtonText,
                                selectedPeriod === p && styles.periodButtonTextActive
                            ]}>
                                {p.charAt(0).toUpperCase() + p.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Stats Overview */}
                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>Trips</Text>
                        <Text style={styles.statValue}>{displayedStats.trips}</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>Online Hrs</Text>
                        <Text style={styles.statValue}>{displayedStats.hours}h</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>Avg/Trip</Text>
                        <Text style={styles.statValue}>
                            {displayedStats.trips > 0 ? formatCurrency(displayedStats.earnings / displayedStats.trips) : '₹0'}
                        </Text>
                    </View>
                </View>

                {/* Recent Transactions */}
                <Text style={styles.sectionTitle}>Recent Transactions</Text>
                <View style={styles.transactionsList}>
                    {transactions.length === 0 ? (
                        <Text style={styles.emptyText}>No recent transactions</Text>
                    ) : (
                        transactions.map((tx, i) => (
                            <View key={tx.id} style={[
                                styles.transactionItem,
                                i === transactions.length - 1 && { borderBottomWidth: 0 }
                            ]}>
                                <View style={[
                                    styles.iconContainer,
                                    { backgroundColor: tx.amount > 0 ? '#ECFDF5' : '#FEF2F2' }
                                ]}>
                                    <Ionicons
                                        name={tx.amount > 0 ? (tx.type === 'Bonus' ? 'gift' : 'arrow-down') : 'arrow-up'}
                                        size={20}
                                        color={tx.amount > 0 ? '#10B981' : '#EF4444'}
                                    />
                                </View>
                                <View style={styles.txDetails}>
                                    <Text style={styles.txType}>{tx.type}</Text>
                                    <Text style={styles.txDate}>{tx.date}</Text>
                                </View>
                                <Text style={[
                                    styles.txAmount,
                                    { color: tx.amount > 0 ? '#10B981' : '#111827' }
                                ]}>
                                    {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                                </Text>
                            </View>
                        ))
                    )}
                </View>

                {/* Bottom padding for safe area */}
                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 48, // approximate status bar
        paddingBottom: 16,
        paddingHorizontal: 24,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    backButton: {
        width: 40,
        height: 40,
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 24,
    },
    balanceCard: {
        backgroundColor: '#10B981', // Solid Green Fallback
        borderRadius: 24,
        padding: 24,
        marginBottom: 32,
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 8,
    },
    balanceLabel: {
        color: '#ECFDF5',
        fontSize: 16,
        marginBottom: 8,
    },
    balanceAmount: {
        color: 'white',
        fontSize: 36,
        fontWeight: 'bold',
        marginBottom: 24,
    },
    actionButtonsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
    },
    actionButton: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    actionButtonSecondary: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    actionButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
    periodSelector: {
        flexDirection: 'row',
        backgroundColor: '#E5E7EB',
        borderRadius: 12,
        padding: 4,
        marginBottom: 24,
    },
    periodButton: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 8,
    },
    periodButtonActive: {
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
        elevation: 1,
    },
    periodButtonText: {
        color: '#6B7280', // Gray-500
        fontWeight: '600',
    },
    periodButtonTextActive: {
        color: '#111827', // Gray-900 (Primary)
    },
    statsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 32,
    },
    statCard: {
        flex: 1,
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    statLabel: {
        color: '#6B7280',
        fontSize: 12,
        marginBottom: 4,
    },
    statValue: {
        color: '#111827',
        fontSize: 18,
        fontWeight: 'bold',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 16,
    },
    transactionsList: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 8,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    transactionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F9FAFB',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    txDetails: {
        flex: 1,
    },
    txType: {
        color: '#111827',
        fontWeight: 'bold',
        fontSize: 14,
    },
    txDate: {
        color: '#6B7280',
        fontSize: 12,
    },
    txAmount: {
        fontWeight: 'bold',
        fontSize: 14,
    },
    emptyText: {
        textAlign: 'center',
        color: '#9CA3AF',
        padding: 24,
    }
});

export default DriverEarningsScreen;
