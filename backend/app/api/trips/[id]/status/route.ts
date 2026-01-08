import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import TripRequest from '@/models/TripRequest';
import { verifyToken } from '@/lib/auth';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    const user = verifyToken(req);
    const { id } = await params;

    if (!user || user.role !== 'DRIVER') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { status } = await req.json();

        if (!['IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        // Ensure the driver is the one assigned to this trip
        const trip = await TripRequest.findOne({ _id: id, driverId: user.userId });

        if (!trip) {
            return NextResponse.json({ error: 'Trip not found or not assigned to you' }, { status: 404 });
        }

        trip.status = status;
        await trip.save();

        return NextResponse.json({ message: 'Trip updated', trip });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
