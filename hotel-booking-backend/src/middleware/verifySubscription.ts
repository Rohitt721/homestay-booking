import { NextFunction, Request, Response } from "express";
import Subscription from "../models/subscription";
import User from "../models/user";

const verifySubscription = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }

        const subscription = await Subscription.findOne({
            userId: req.userId,
            status: "ACTIVE",
            endDate: { $gte: new Date() },
        });

        if (!subscription) {
            return res.status(403).json({
                message: "Active subscription required to publish hotels",
                requireSubscription: true
            });
        }

        next();
    } catch (error) {
        res.status(500).json({ message: "Something went wrong during subscription check" });
    }
};

export default verifySubscription;
