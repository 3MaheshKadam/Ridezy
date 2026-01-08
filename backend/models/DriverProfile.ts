import mongoose from 'mongoose';

const DriverProfileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
    },
    licenseNumber: { type: String, required: true },
    licenseUrl: { type: String, required: true }, // URL to stored file
    experienceYears: { type: Number, required: true },
    isAvailable: { type: Boolean, default: false },
    currentLocation: {
        lat: Number,
        lng: Number,
    },
    bankDetails: {
        type: Object, // Structured JSON: { accountName, accountNumber, ifsc }
    },
}, { timestamps: true });

export default mongoose.models.DriverProfile || mongoose.model('DriverProfile', DriverProfileSchema);
