import { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { get, post, del } from '../lib/api';
import { endpoints } from '../config/apiConfig';

export const useDriverSubscription = () => {
    const [plans, setPlans] = useState([]);
    const [currentSubscription, setCurrentSubscription] = useState(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    const fetchSubscriptionData = useCallback(async () => {
        try {
            setLoading(true);
            const data = await get(endpoints.drivers.subscription);

            let mappedPlans = [];
            if (data && data.availablePlans) {
                mappedPlans = data.availablePlans.map(p => ({
                    id: p._id,
                    name: p.name,
                    price: p.price,
                    duration: p.duration,
                    description: p.description,
                    features: p.features,
                    color: p.color || '#3B82F6',
                    popular: p.popular,
                    commission: p.commission || 0
                }));
            }

            setPlans(mappedPlans);

            if (data) {
                // Find the ID of the current plan
                const currentPlanObj = mappedPlans.find(p => p.name === data.plan);
                const currentPlanId = currentPlanObj ? currentPlanObj.id : null;

                setCurrentSubscription({
                    planId: currentPlanId,
                    planName: data.plan,
                    expiryDate: data.expiry,
                    status: data.expiry && new Date(data.expiry) > new Date() ? 'active' : 'inactive',
                });
            }
        } catch (error) {
            console.error('Error fetching subscription:', error);
            Alert.alert('Error', 'Failed to load subscription plans');
        } finally {
            setLoading(false);
        }
    }, []);

    const subscribeToPlan = async (plan, billingCycle = 'monthly') => {
        if (!plan) {
            Alert.alert('Error', 'No plan selected.');
            return false;
        }

        try {
            setProcessing(true);
            // Simulate payment delay
            await new Promise(resolve => setTimeout(resolve, 1500));

            const response = await post(endpoints.drivers.subscription, {
                planId: plan.id,
                billingCycle: plan.duration // Using duration as billing cycle for now
            });

            // Optimistically update
            setCurrentSubscription({
                planId: plan.id,
                planName: response.plan,
                expiryDate: response.expiry,
                status: 'active',
            });

            return true; // Success
        } catch (error) {
            console.error("Subscription error", error);
            Alert.alert('Payment Failed', 'Please try again or use a different payment method.');
            return false; // Failure
        } finally {
            setProcessing(false);
        }
    };

    const cancelSubscription = async () => {
        try {
            setProcessing(true);
            await del(endpoints.drivers.subscription);

            setCurrentSubscription(prev => ({
                ...prev,
                status: 'cancelled',
                expiryDate: new Date().toISOString() // End immediately or keep till expiry based on policy
            }));

            // Refresh to get server source of truth
            fetchSubscriptionData();
            return true;
        } catch (error) {
            console.error('Error cancelling subscription:', error);
            Alert.alert('Error', 'Failed to cancel subscription.');
            return false;
        } finally {
            setProcessing(false);
        }
    };

    const getDaysRemaining = () => {
        if (!currentSubscription || !currentSubscription.expiryDate) return 0;
        const expiry = new Date(currentSubscription.expiryDate);
        const today = new Date();
        const diffTime = expiry - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
    };

    useEffect(() => {
        fetchSubscriptionData();
    }, [fetchSubscriptionData]);

    return {
        plans,
        currentSubscription,
        loading,
        processing,
        fetchSubscriptionData,
        subscribeToPlan,
        cancelSubscription,
        getDaysRemaining
    };
};
