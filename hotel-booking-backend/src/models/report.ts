import mongoose, { Document } from "mongoose";
import { ReportType } from "../../../shared/types";

export interface IReport extends Omit<ReportType, "_id" | "createdAt" | "updatedAt">, Document {
    createdAt: Date;
    updatedAt: Date;
}

const reportSchema = new mongoose.Schema(
    {
        bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true, index: true },
        bookingStatus: { type: String, required: true },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
        hotelId: { type: mongoose.Schema.Types.ObjectId, ref: "Hotel", required: true, index: true },
        ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
        reason: { type: String, required: true },
        subReason: { type: String },
        message: { type: String, required: true },
        evidenceUrls: [{ type: String }],
        status: {
            type: String,
            enum: ["Open", "In Review", "Resolved"],
            default: "Open",
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

// Compound indexes for efficient querying
reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ userId: 1, createdAt: -1 });
reportSchema.index({ bookingId: 1 });

export default mongoose.model<IReport>("Report", reportSchema);
