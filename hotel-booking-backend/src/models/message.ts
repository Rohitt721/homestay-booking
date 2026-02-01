import mongoose, { Document, Schema } from "mongoose";

export interface IMessage extends Document {
    bookingId: mongoose.Types.ObjectId;
    senderId: string;
    senderName: string;
    senderRole: "user" | "hotel_owner";
    content: string;
    createdAt: Date;
    updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
    {
        bookingId: { type: Schema.Types.ObjectId, ref: "Booking", required: true, index: true },
        senderId: { type: String, required: true, index: true },
        senderName: { type: String, required: true },
        senderRole: { type: String, enum: ["user", "hotel_owner"], required: true },
        content: { type: String, required: true },
    },
    {
        timestamps: true,
    }
);

// Index for fetching messages of a booking in chronological order
messageSchema.index({ bookingId: 1, createdAt: 1 });

export default mongoose.model<IMessage>("Message", messageSchema);
