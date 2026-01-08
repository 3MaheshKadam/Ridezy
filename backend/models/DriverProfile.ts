import mongoose from 'mongoose';

const DriverProfileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
    },
    licenseNumber: { type: String, required: true },

    documents: {
        drivingLicense: String,
        aadharCard: String,
        panCard: String,
        vehicleRC: String,
        insurance: String,
        photo: String,
    }, // URLs to stored files
    experienceYears: { type: Number, required: true },
    rating: { type: Number, default: 5.0 },
    isAvailable: { type: Boolean, default: false },
    currentLocation: {
        lat: Number,
        lng: Number,
    },
    vehicleDetails: {
        make: String,
        model: String,
        year: String,
        number: String,
        color: String,
    },
    bankDetails: {
        type: Object, // Structured JSON: { accountName, accountNumber, ifsc }
    },
}, { timestamps: true });

export default mongoose.models.DriverProfile || mongoose.model('DriverProfile', DriverProfileSchema);
