import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import DriverProfile from '@/models/DriverProfile';
import TripRequest from '@/models/TripRequest';
import User from '@/models/User'; // Ensure User model is registered
import { verifyToken } from '@/lib/auth';
import mongoose from 'mongoose';

export async function GET(req: Request) {
    await dbConnect();

    const user = verifyToken(req);
    if (!user || user.role !== 'DRIVER') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const profile = await DriverProfile.findOne({ userId: user.userId }).populate('userId', 'full_name');

        if (!profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        const driverId = new mongoose.Types.ObjectId(user.userId);

        // Fetch Trip Metrics
        // Note: TripRequest schema should have driverId field as ObjectId references to User or DriverProfile
        // Assuming driverId in TripRequest refers to the User ID of the driver.

        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // Helper to aggregate earnings
        const getEarnings = async (startDate: Date | null) => {
            const match: any = { driverId: user.userId, status: 'COMPLETED' };
            if (startDate) {
                match.updatedAt = { $gte: startDate };
            }
            const result = await TripRequest.aggregate([
                { $match: match },
                { $group: { _id: null, total: { $sum: "$price" }, count: { $sum: 1 } } }
            ]);
            return result[0] || { total: 0, count: 0 };
        };

        const [totalStats, todayStats, weekStats, monthStats, recentTrips] = await Promise.all([
            getEarnings(null),
            getEarnings(startOfDay),
            getEarnings(startOfWeek),
            getEarnings(startOfMonth),
            TripRequest.find({ driverId: user.userId, status: 'COMPLETED' })
                .sort({ updatedAt: -1 })
                .limit(4)
                .lean()
        ]);

        const dashboardData = {
            profile: {
                name: profile.userId.full_name,
                rating: profile.rating,
                totalTrips: totalStats.count,
                memberSince: new Date(profile.createdAt).getFullYear().toString(),
                vehicleNumber: profile.documents?.vehicleRC ? 'Verified' : 'Pending', // Placeholder logic 
                vehicleName: 'Sedan', // Placeholder as Vehicle model is separate or not linked yet
                verificationStatus: 'verified', // Logic could be based on User status
            },
            performance: {
                today: {
                    earnings: todayStats.total,
                    trips: todayStats.count,
                    hours: 0, // Not tracked yet
                    distance: 0 // Not tracked yet
                },
                week: {
                    earnings: weekStats.total,
                    trips: weekStats.count
                },
                month: {
                    earnings: monthStats.total,
                    trips: monthStats.count
                }
            },
            recentActivities: recentTrips.map((trip: any) => ({
                id: trip._id,
                type: 'trip_completed',
                title: 'Trip Completed',
                subtitle: `${trip.pickupLocation?.split(',')[0] || 'Pickup'} to ${trip.dropLocation?.split(',')[0] || 'Drop'}`,
                time: new Date(trip.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                amount: trip.price
            })),
            isOnline: profile.isAvailable
        };

        return NextResponse.json(dashboardData);

    } catch (error: any) {
        console.error('Dashboard Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
