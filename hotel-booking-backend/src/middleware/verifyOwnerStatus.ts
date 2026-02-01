import { NextFunction, Request, Response } from "express";
import User from "../models/user";

export const verifyOwnerStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await User.findById(req.userId) as any;
        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }

        // Check if verification status is verified
        if (user.verification?.status !== "VERIFIED") {
            return res.status(403).json({
                message: "Account verification required",
                requireVerification: true,
                status: user.verification?.status
            });
        }

        next();
    } catch (error) {
        res.status(500).json({ message: "Something went wrong during verification check" });
    }
};
