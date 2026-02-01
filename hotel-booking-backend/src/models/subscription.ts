import mongoose from "mongoose";
import { SubscriptionType } from "../../../shared/types";

const subscriptionSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
        plan: { type: String, enum: ["MONTHLY", "YEARLY"], required: true },
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        status: {
            type: String,
            enum: ["ACTIVE", "EXPIRED"],
            default: "ACTIVE",
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

const Subscription = mongoose.model<SubscriptionType>("Subscription", subscriptionSchema);
export default Subscription;
