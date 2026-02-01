import express, { Request, Response } from "express";
import verifyToken from "../middleware/auth";
import { verifyAdmin } from "../middleware/adminAuth";
import User from "../models/user";
import Hotel from "../models/hotel";

const router = express.Router();

// Get System Stats
router.get("/stats", verifyToken, verifyAdmin, async (req: Request, res: Response) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalHotels = await Hotel.countDocuments();
        // Use aggregation to sum bookings if we had a Bookings model easily accessible, 
        // but for now let's just return basic stats.

        res.json({
            totalUsers,
            totalHotels,
            // Add more stats as needed
        });
    } catch (error) {
        res.status(500).json({ message: "Error fetching admin stats" });
    }
});

// Get All Users
router.get("/users", verifyToken, verifyAdmin, async (req: Request, res: Response) => {
    try {
        const users = await User.find({}, "-password"); // Exclude password
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: "Error fetching users" });
    }
});

// Get All Hotels
router.get("/hotels", verifyToken, verifyAdmin, async (req: Request, res: Response) => {
    try {
        const hotels = await Hotel.find({});
        res.json(hotels);
    } catch (error) {
        res.status(500).json({ message: "Error fetching hotels" });
    }
});

// Get Pending Verifications
router.get("/verifications", verifyToken, verifyAdmin, async (req: Request, res: Response) => {
    try {
        const users = await User.find({ "verification.status": "SUBMITTED" }, "-password");
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: "Error fetching verifications" });
    }
});

// Update Verification Status
router.post("/verifications/:userId/status", verifyToken, verifyAdmin, async (req: Request, res: Response) => {
    try {
        const { status, rejectionReason } = req.body;

        if (!["VERIFIED", "REJECTED"].includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        const user = await User.findById(req.params.userId) as any;
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (!user.verification) {
            // Should not happen if schema defaults work, but good to be safe
            user.verification = { status: "PENDING", documents: [] };
        }

        user.verification.status = status;
        if (status === "REJECTED") {
            user.verification.rejectionReason = rejectionReason || "Documents rejected by admin";
        }

        await user.save();

        res.json({ message: `User verification ${status}`, user });
    } catch (error) {
        res.status(500).json({ message: "Error updating verification status" });
    }
});

export default router;
