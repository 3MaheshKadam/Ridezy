import mongoose from 'mongoose';

const TripRequestSchema = new mongoose.Schema({
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    pickupLocation: { type: String, required: true },
    pickupCoords: {
        lat: Number,
        lng: Number,
    },
    dropLocation: { type: String, required: true },
    startTime: { type: Date, required: true },
    vehicleTypeRequested: {
        type: String,
        enum: ['SEDAN', 'SUV', 'HATCHBACK', 'LUXURY'],
        required: true,
    },
    status: {
        type: String,
        enum: ['OPEN', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
        default: 'OPEN',
    },
    driverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
    price: { type: Number },
}, { timestamps: true });

export default mongoose.models.TripRequest || mongoose.model('TripRequest', TripRequestSchema);
