import { NextFunction, Request, Response } from "express";
import User from "../models/user";

export const verifyAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized - No User ID" });
        }

        const user = await User.findById(userId);

        if (!user || user.role !== "admin") {
            return res.status(403).json({ message: "Forbidden - Admin access required" });
        }

        next();
    } catch (error) {
        console.error("Admin verification error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
