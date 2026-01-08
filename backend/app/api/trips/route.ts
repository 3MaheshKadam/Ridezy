import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import TripRequest from '@/models/TripRequest';
import { verifyToken } from '@/lib/auth';

export async function POST(req: Request) {
    await dbConnect();
    const user = verifyToken(req);

    if (!user || user.role !== 'OWNER') {
        return NextResponse.json({ error: 'Unauthorized: Owners only' }, { status: 403 });
    }

    // Check if Active?
    if (user.status !== 'ACTIVE') {
        return NextResponse.json({ error: 'Account not active. Please complete onboarding.' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { pickupLocation, pickupCoords, dropLocation, startTime, vehicleTypeRequested, price } = body;

        const trip = await TripRequest.create({
            ownerId: user.userId,
            pickupLocation,
            pickupCoords,
            dropLocation,
            startTime: new Date(startTime),
            vehicleTypeRequested,
            price,
            status: 'OPEN',
        });

        return NextResponse.json({ message: 'Trip requested', trip }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Get My Trips (Owner)
export async function GET(req: Request) {
    await dbConnect();
    const user = verifyToken(req);

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // If Owner, show their trips.
    if (user.role === 'OWNER') {
        const trips = await TripRequest.find({ ownerId: user.userId }).sort({ createdAt: -1 });
        return NextResponse.json({ trips });
    }

    return NextResponse.json({ error: 'Use /feed for drivers' }, { status: 400 });
}
