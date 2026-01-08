import mongoose from 'mongoose';

const CarWashCenterProfileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
    },
    businessName: { type: String, required: true },
    location: {
        lat: Number,
        lng: Number,
        address: String,
    }, // Could be GeoJSON in future
    registrationDocUrl: { type: String, required: true },
    isApproved: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.models.CarWashCenterProfile || mongoose.model('CarWashCenterProfile', CarWashCenterProfileSchema);
