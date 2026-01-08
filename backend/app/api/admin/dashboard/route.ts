import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import WashBooking from '@/models/WashBooking';
import TripRequest from '@/models/TripRequest';
import mongoose from 'mongoose';

export async function GET() {
    try {
        await dbConnect();

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

        // Helper for Percentage Change
        const calculateChange = (current: number, previous: number) => {
            if (previous === 0) return current > 0 ? '+100%' : '0%';
            const percent = ((current - previous) / previous) * 100;
            return (percent > 0 ? '+' : '') + percent.toFixed(1) + '%';
        };

        // Parallel Data Fetching
        const [
            pendingCarWash,
            pendingDrivers,
            pendingCarOwners,

            // Current Month Counts
            activeUsers,
            activeDrivers,
            activeCarWash,
            currentMonthWashRevenue,
            currentMonthTripRevenue,

            // Previous Month Counts (For Trends)
            lastMonthUsers,
            lastMonthDrivers,
            lastMonthCarWash,
            lastMonthWashRevenue,
            lastMonthTripRevenue,

            // Total Revenue
            totalWashRevenueDocs,
            totalTripRevenueDocs,

            // Today's Revenue
            todayWashRevenueDocs,
            todayTripRevenueDocs,

            // Recent Activities Sources
            recentUsers,
            recentTrips,
            recentBookings

        ] = await Promise.all([
            // 1. Pending Counts
            User.countDocuments({ role: 'CENTER', status: 'PENDING_APPROVAL' }),
            User.countDocuments({ role: 'DRIVER', status: 'PENDING_APPROVAL' }),
            User.countDocuments({ role: 'OWNER', status: 'PENDING_APPROVAL' }),

            // 2. Active Counts (Current)
            User.countDocuments({ status: 'ACTIVE' }),
            User.countDocuments({ role: 'DRIVER', status: 'ACTIVE' }),
            User.countDocuments({ role: 'CENTER', status: 'ACTIVE' }),

            // 3. Current Month Revenue
            WashBooking.aggregate([
                { $match: { status: 'COMPLETED', updatedAt: { $gte: startOfThisMonth } } },
                { $group: { _id: null, total: { $sum: '$price' } } }
            ]),
            TripRequest.aggregate([
                { $match: { status: 'COMPLETED', updatedAt: { $gte: startOfThisMonth } } },
                { $group: { _id: null, total: { $sum: '$price' } } }
            ]),

            // 4. Last Month Counts (Approximate for Users/Drivers based on createdAt)
            User.countDocuments({ status: 'ACTIVE', createdAt: { $lt: startOfThisMonth } }),
            User.countDocuments({ role: 'DRIVER', status: 'ACTIVE', createdAt: { $lt: startOfThisMonth } }),
            User.countDocuments({ role: 'CENTER', status: 'ACTIVE', createdAt: { $lt: startOfThisMonth } }),

            // 5. Last Month Revenue
            WashBooking.aggregate([
                { $match: { status: 'COMPLETED', updatedAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
                { $group: { _id: null, total: { $sum: '$price' } } }
            ]),
            TripRequest.aggregate([
                { $match: { status: 'COMPLETED', updatedAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
                { $group: { _id: null, total: { $sum: '$price' } } }
            ]),

            // 6. Total Revenue
            WashBooking.aggregate([{ $match: { status: 'COMPLETED' } }, { $group: { _id: null, total: { $sum: '$price' } } }]),
            TripRequest.aggregate([{ $match: { status: 'COMPLETED' } }, { $group: { _id: null, total: { $sum: '$price' } } }]),

            // 7. Today's Revenue
            WashBooking.aggregate([{ $match: { status: 'COMPLETED', updatedAt: { $gte: startOfToday } } }, { $group: { _id: null, total: { $sum: '$price' } } }]),
            TripRequest.aggregate([{ $match: { status: 'COMPLETED', updatedAt: { $gte: startOfToday } } }, { $group: { _id: null, total: { $sum: '$price' } } }]),

            // 8. Recent Items for Timeline
            User.find({ createdAt: { $gte: startOfLastMonth } }).sort({ createdAt: -1 }).limit(5).lean(),
            TripRequest.find({ status: 'COMPLETED' }).sort({ updatedAt: -1 }).populate('driverId', 'full_name').limit(4).lean(),
            WashBooking.find({ status: 'COMPLETED' }).sort({ updatedAt: -1 }).populate('centerId', 'full_name').limit(4).lean(),
        ]);

        // Process Revenue Logic
        const totalRevenue = (totalWashRevenueDocs[0]?.total || 0) + (totalTripRevenueDocs[0]?.total || 0);
        const todayRevenue = (todayWashRevenueDocs[0]?.total || 0) + (todayTripRevenueDocs[0]?.total || 0);

        const currentMonthRev = (currentMonthWashRevenue[0]?.total || 0) + (currentMonthTripRevenue[0]?.total || 0);
        const lastMonthRev = (lastMonthWashRevenue[0]?.total || 0) + (lastMonthTripRevenue[0]?.total || 0);

        // Calculate Trends
        const revenueChange = calculateChange(currentMonthRev, lastMonthRev);
        const usersChange = calculateChange(activeUsers, lastMonthUsers);
        const driverChange = calculateChange(activeDrivers, lastMonthDrivers);
        const centerChange = calculateChange(activeCarWash, lastMonthCarWash);

        // Process Recent Activities
        let activities = [];

        // Map Users
        recentUsers.forEach((u: any) => {
            let type = 'user_signup';
            let icon = 'person-add';
            let color = '#3B82F6'; // blue
            let title = 'New User Registration';

            if (u.role === 'DRIVER') {
                type = 'driver_signup';
                icon = 'drive-eta';
                color = '#8B5CF6'; // purple
                title = 'New Driver Registration';
            } else if (u.role === 'CENTER') {
                type = 'center_signup';
                icon = 'local-car-wash';
                color = '#06B6D4'; // cyan
                title = 'New Car Wash Center';
            }

            activities.push({
                id: u._id.toString(),
                type,
                title,
                description: `${u.full_name} joined as ${u.role.toLowerCase()}`,
                time: new Date(u.createdAt),
                icon,
                color
            });
        });

        // Map Trips
        recentTrips.forEach((t: any) => {
            activities.push({
                id: t._id.toString(),
                type: 'trip_completed',
                title: 'Trip Completed',
                description: `₹${t.price} - Driver: ${t.driverId?.full_name || 'Unknown'}`,
                time: new Date(t.updatedAt),
                icon: 'check-circle',
                color: '#10B981' // green
            });
        });

        // Map Wash Bookings
        recentBookings.forEach((b: any) => {
            activities.push({
                id: b._id.toString(),
                type: 'wash_completed',
                title: 'Car Wash Completed',
                description: `₹${b.price} - ${b.centerId?.full_name || 'Center'}`,
                time: new Date(b.updatedAt),
                icon: 'clean-hands', // mapped to material 'wash' or similar in frontend
                color: '#F59E0B' // amber
            });
        });

        // Sort by time descending and take top 10
        activities.sort((a, b) => b.time.getTime() - a.time.getTime());
        activities = activities.slice(0, 10).map(a => ({
            ...a,
            time: timeAgo(a.time) // Convert to string "2 hours ago"
        }));

        const data = {
            pendingCarWash,
            pendingDrivers,
            pendingCarOwners,
            activeSubscriptions: 0,
            totalRevenue,
            todayRevenue,
            activeUsers,
            activeDrivers,
            activeCarWash,
            trends: {
                revenue: revenueChange,
                users: usersChange,
                drivers: driverChange,
                centers: centerChange,
                revenueType: currentMonthRev >= lastMonthRev ? 'positive' : 'negative',
                usersType: activeUsers >= lastMonthUsers ? 'positive' : 'negative',
                driversType: activeDrivers >= lastMonthDrivers ? 'positive' : 'negative',
                centersType: activeCarWash >= lastMonthCarWash ? 'positive' : 'negative',
            },
            recentActivities: activities
        };

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Admin Dashboard API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

function timeAgo(date: Date) {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return "Just now";
}
