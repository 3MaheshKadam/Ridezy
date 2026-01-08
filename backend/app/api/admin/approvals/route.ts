import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Vehicle from '@/models/Vehicle';
import DriverProfile from '@/models/DriverProfile';
import CarWashCenterProfile from '@/models/CarWashCenterProfile'; // Ensure this model exists
import { verifyToken } from '@/lib/auth';

export async function GET(req: Request) {
    await dbConnect();

    const user = verifyToken(req);
    if (!user || user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized: Admin only' }, { status: 403 });
    }

    try {
        // 1. Pending Drivers
        // Find users with status PENDING_APPROVAL and role DRIVER
        const pendingDriverUsers = await User.find({ status: 'PENDING_APPROVAL', role: 'DRIVER' }).lean();

        // Enrich with Profile Data (Manual join or parallel fetch)
        const driverUserIds = pendingDriverUsers.map(u => u._id);
        const driverProfiles = await DriverProfile.find({ userId: { $in: driverUserIds } }).lean();

        const drivers = pendingDriverUsers.map(u => {
            const profile = driverProfiles.find(p => p.userId.toString() === u._id.toString());
            return { user: u, profile };
        });

        // 2. Pending Centers
        const pendingCenterUsers = await User.find({ status: 'PENDING_APPROVAL', role: 'CENTER' }).lean();
        const centerUserIds = pendingCenterUsers.map(u => u._id);
        const centerProfiles = await CarWashCenterProfile.find({ userId: { $in: centerUserIds } }).lean();

        const centers = pendingCenterUsers.map(u => {
            const profile = centerProfiles.find(p => p.userId.toString() === u._id.toString());
            return { user: u, profile };
        });

        // 3. Pending Vehicles
        const pendingVehicles = await Vehicle.find({ isApproved: false }).populate('ownerId', 'email phone').lean();

        return NextResponse.json({
            drivers,
            centers,
            vehicles: pendingVehicles
        });

    } catch (error: any) {
        console.error('Admin Approvals Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
