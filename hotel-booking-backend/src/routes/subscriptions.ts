import express, { Request, Response } from "express";
import verifyToken from "../middleware/auth";
import { verifyOwnerStatus } from "../middleware/verifyOwnerStatus";
import Subscription from "../models/subscription";
import User from "../models/user";

const router = express.Router();

// Get current subscription status
router.get("/status", verifyToken, async (req: Request, res: Response) => {
    try {
        const subscription = await Subscription.findOne({
            userId: req.userId,
            status: "ACTIVE",
            endDate: { $gte: new Date() },
        }).sort({ endDate: -1 });

        res.json(subscription || null);
    } catch (error) {
        res.status(500).json({ message: "Error fetching subscription status" });
    }
});

// Subscribe to a plan (Dummy Payment Integration)
router.post("/subscribe", verifyToken, verifyOwnerStatus, async (req: Request, res: Response) => {
    try {
        const { plan } = req.body; // "MONTHLY" | "YEARLY"

        if (!["MONTHLY", "YEARLY"].includes(plan)) {
            return res.status(400).json({ message: "Invalid plan" });
        }

        const startDate = new Date();
        const endDate = new Date();
        if (plan === "MONTHLY") {
            endDate.setMonth(endDate.getMonth() + 1);
        } else {
            endDate.setFullYear(endDate.getFullYear() + 1);
        }

        // In a real app, you'd verify Razorpay/Stripe payment here
        // For now, we simulate success

        // Deactivate existing subscriptions
        await Subscription.updateMany(
            { userId: req.userId, status: "ACTIVE" },
            { status: "EXPIRED" }
        );

        const newSubscription = new Subscription({
            userId: req.userId,
            plan,
            startDate,
            endDate,
            status: "ACTIVE",
        });

        await newSubscription.save();

        res.status(201).json(newSubscription);
    } catch (error) {
        res.status(500).json({ message: "Error creating subscription" });
    }
});

export default router;
