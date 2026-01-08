import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import DriverProfile from '@/models/DriverProfile';
import { verifyToken } from '@/lib/auth';

export async function PUT(req: Request) {
    await dbConnect();

    const user = verifyToken(req);
    if (!user || user.role !== 'DRIVER') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { isOnline } = body;

        if (typeof isOnline !== 'boolean') {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        const profile = await DriverProfile.findOneAndUpdate(
            { userId: user.userId },
            { isAvailable: isOnline },
            { new: true }
        );

        return NextResponse.json({ success: true, isOnline: profile.isAvailable });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
