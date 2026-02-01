import mongoose, { Document } from "mongoose";
import { BookingType, BookingStatus, IdType } from "../../../shared/types";

export interface IBooking extends Omit<BookingType, "_id">, Document {
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    hotelId: { type: mongoose.Schema.Types.ObjectId, ref: "Hotel", required: true, index: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, index: true },
    phone: { type: String },
    adultCount: { type: Number, required: true },
    childCount: { type: Number, required: true },
    checkIn: { type: Date, required: true, index: true },
    checkOut: { type: Date, required: true },
    totalCost: { type: Number, required: true },
    status: {
      type: String,
      enum: [
        "PAYMENT_DONE",
        "ID_PENDING",
        "ID_SUBMITTED",
        "CONFIRMED",
        "COMPLETED",
        "REJECTED",
        "CANCELLED",
        "REFUND_PENDING",
        "REFUNDED",
      ],
      default: "PAYMENT_DONE",
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
      index: true,
    },
    paymentMethod: { type: String },
    specialRequests: { type: String },
    cancellationReason: { type: String },
    rejectionReason: { type: String },
    refundAmount: { type: Number, default: 0 },
    idProof: {
      idType: { type: String, enum: ["Aadhaar", "Passport", "Driving License", "Voter ID"] },
      frontImage: { type: String },
      backImage: { type: String },
      status: {
        type: String,
        enum: ["PENDING", "SUBMITTED", "VERIFIED", "REJECTED"],
        default: "PENDING"
      },
      uploadedAt: { type: Date },
      verifiedAt: { type: Date },
    },
  },
  {
    timestamps: true,
  }
);

// Add compound indexes for better query performance
bookingSchema.index({ userId: 1, createdAt: -1 });
bookingSchema.index({ hotelId: 1, checkIn: 1 });
bookingSchema.index({ status: 1, createdAt: -1 });
bookingSchema.index({ paymentStatus: 1, createdAt: -1 });
bookingSchema.index({ checkIn: 1, status: 1 });

export default mongoose.model<IBooking>("Booking", bookingSchema);
