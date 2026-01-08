import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import TripRequest from '@/models/TripRequest';
import { verifyToken } from '@/lib/auth';

export async function GET(req: Request) {
    await dbConnect();
    const user = verifyToken(req);

    if (!user || user.role !== 'DRIVER') {
        return NextResponse.json({ error: 'Unauthorized: Drivers only' }, { status: 403 });
    }

    if (user.status !== 'ACTIVE') {
        return NextResponse.json({ error: 'Account not active' }, { status: 403 });
    }

    try {
        // Basic Feed: Show all OPEN trips (filtering by location can be added later via query params)
        const trips = await TripRequest.find({ status: 'OPEN' })
            .sort({ createdAt: -1 })
            .populate('ownerId', 'phone email') // Show owner contact if needed (usually only AFTER accept, but basic info is ok)
            .limit(50); // Pagination recommended

        return NextResponse.json({ trips });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
