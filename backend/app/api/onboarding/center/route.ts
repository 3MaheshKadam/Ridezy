import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import CarWashCenterProfile from '@/models/CarWashCenterProfile';
import User from '@/models/User';
import { verifyToken } from '@/lib/auth';

export async function POST(req: Request) {
    await dbConnect();

    const user = verifyToken(req);
    if (!user || user.role !== 'CENTER') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { businessName, location, registrationDocUrl } = body;

        const center = await CarWashCenterProfile.create({
            userId: user.userId,
            businessName,
            location,
            registrationDocUrl,
        });

        await User.findByIdAndUpdate(user.userId, { status: 'PENDING_APPROVAL' });

        return NextResponse.json({ message: 'Center onboarding submitted', center }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
