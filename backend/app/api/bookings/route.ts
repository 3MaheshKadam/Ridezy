import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import WashBooking from '@/models/WashBooking';
import { verifyToken } from '@/lib/auth';

// Create Booking
export async function POST(req: Request) {
    await dbConnect();
    const user = verifyToken(req);

    if (!user || user.role !== 'OWNER') {
        return NextResponse.json({ error: 'Unauthorized: Owners only' }, { status: 403 });
    }

    try {
        const { centerId, vehicleId, scheduledTime, packageType, price } = await req.json();

        const booking = await WashBooking.create({
            ownerId: user.userId,
            centerId,
            vehicleId,
            scheduledTime: new Date(scheduledTime),
            packageType,
            price,
            status: 'PENDING',
        });

        return NextResponse.json({ message: 'Booking created', booking }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Get Bookings (Owner or Center)
export async function GET(req: Request) {
    await dbConnect();
    const user = verifyToken(req);

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let query = {};
    if (user.role === 'OWNER') {
        query = { ownerId: user.userId };
    } else if (user.role === 'CENTER') {
        query = { centerId: user.userId }; // Assuming centerId in Booking is UserID
    } else {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const bookings = await WashBooking.find(query)
        .populate('vehicleId', 'plateNumber model')
        .sort({ scheduledTime: -1 });

    return NextResponse.json({ bookings });
}
