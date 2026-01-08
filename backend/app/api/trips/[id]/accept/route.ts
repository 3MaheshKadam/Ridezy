import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import TripRequest from '@/models/TripRequest';
import { verifyToken } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    const user = verifyToken(req);
    const { id } = await params;

    if (!user || user.role !== 'DRIVER') {
        return NextResponse.json({ error: 'Unauthorized: Drivers only' }, { status: 403 });
    }

    if (user.status !== 'ACTIVE') {
        return NextResponse.json({ error: 'Account not active' }, { status: 403 });
    }

    try {
        // Atomic Update: Find document where status is OPEN and update it.
        // If another driver updates it first, this will return null.
        const trip = await TripRequest.findOneAndUpdate(
            { _id: id, status: 'OPEN' },
            {
                $set: {
                    status: 'ACCEPTED',
                    driverId: user.userId
                }
            },
            { new: true } // Return updated doc
        );

        if (!trip) {
            return NextResponse.json({ error: 'Trip already taken or not found' }, { status: 409 });
        }

        return NextResponse.json({ message: 'Trip accepted successfully', trip });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
