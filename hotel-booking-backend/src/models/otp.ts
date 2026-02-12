import mongoose from "mongoose";

export interface IOtp {
    email: string;
    otp: string;
    expiresAt: Date;
    createdAt: Date;
}

const otpSchema = new mongoose.Schema<IOtp>({
    email: {
        type: String,
        required: true,
        index: true,
    },
    otp: {
        type: String,
        required: true,
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 }, // TTL index: auto-delete when expiresAt is reached
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Otp = mongoose.model<IOtp>("Otp", otpSchema);
export default Otp;
