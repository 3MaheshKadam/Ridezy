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
        console.log('Driver Onboarding Payload:', body); // Debugging

        // Destructure and Map Fields
        // Frontend sends 'yearsExperience', Schema expects 'experienceYears'
        // Frontend sends flattened bank details, Schema expects 'bankDetails' object
        const {
            licenseNumber,
            documents,
            vehicleMake,
            vehicleModel,
            vehicleYear,
            vehicleNumber,
            vehicleColor,
            yearsExperience,
            bankName,
            accountNumber,
            ifscCode
        } = body;

        const experienceYears = yearsExperience;
        const bankDetails = {
            bankName,
            accountNumber,
            ifsc: ifscCode
        };
        const vehicleDetails = {
            make: vehicleMake,
            model: vehicleModel,
            year: vehicleYear,
            number: vehicleNumber,
            color: vehicleColor
        }

        // Validation
        if (!licenseNumber || !experienceYears) {
            return NextResponse.json({ error: 'Missing required fields: licenseNumber, experienceYears' }, { status: 400 });
        }

        // Check if profile already exists to prevent 500 Duplicate Key Error
        const existingProfile = await DriverProfile.findOne({ userId: user.userId });
        if (existingProfile) {
            return NextResponse.json({ error: 'Driver profile already exists' }, { status: 409 });
        }

        // Create Profile
        const profile = await DriverProfile.create({
            userId: user.userId,
            licenseNumber,
            documents,
            experienceYears,
            bankDetails,
            vehicleDetails,
            isAvailable: true, // Auto-set to true or false based on logic
        });

        // Update User Status
        await User.findByIdAndUpdate(user.userId, { status: 'PENDING_APPROVAL' });

        return NextResponse.json({ message: 'Driver onboarding submitted', profile }, { status: 201 });
    } catch (error: any) {
        console.error('Driver Onboarding Error:', error);
        return NextResponse.json({ error: error.message || 'Error processing request' }, { status: 500 });
    }
}
