import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import DriverProfile from '@/models/DriverProfile';
import User from '@/models/User';
import { verifyToken } from '@/lib/auth';

export async function POST(req: Request) {
    await dbConnect();

    // Auth Check
    const user = verifyToken(req);
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'DRIVER') {
        return NextResponse.json({ error: 'Forbidden: Only DRIVERS can onboard here' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { licenseNumber, licenseUrl, experienceYears, bankDetails } = body;

        // Create Profile
        const profile = await DriverProfile.create({
            userId: user.userId,
            licenseNumber,
            licenseUrl,
            experienceYears,
            bankDetails,
            isAvailable: true, // Auto-set to true or false based on logic
        });

        // Update User Status
        await User.findByIdAndUpdate(user.userId, { status: 'PENDING_APPROVAL' });

        return NextResponse.json({ message: 'Driver onboarding submitted', profile }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Error processing request' }, { status: 500 });
    }
}
