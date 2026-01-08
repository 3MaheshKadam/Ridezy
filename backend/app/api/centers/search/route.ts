import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import CarWashCenterProfile from '@/models/CarWashCenterProfile';

export async function GET(req: Request) {
    await dbConnect();

    // Public Endpoint: Anyone can search centers
    try {
        // Basic Search: Return all approved centers
        // In future: Add geo-query based on lat/lng from query params
        const centers = await CarWashCenterProfile.find({ isApproved: true });

        return NextResponse.json({ centers });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
