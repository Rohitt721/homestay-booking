import express, { Request, Response } from "express";
import verifyToken from "../middleware/auth";
import Report from "../models/report";
import Booking from "../models/booking";
import Hotel from "../models/hotel";
import multer from "multer";
import cloudinary from "cloudinary";

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        // Accept images and PDFs
        if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only images and PDF files are allowed'));
        }
    }
});

// Helper function to upload to Cloudinary
async function uploadToCloudinary(file: Express.Multer.File): Promise<string> {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.v2.uploader.upload_stream(
            {
                folder: "report_evidence",
                resource_type: "auto",
            },
            (error, result) => {
                if (error) reject(error);
                else resolve(result!.secure_url);
            }
        );
        uploadStream.end(file.buffer);
    });
}

// POST /api/reports - Create a new report
router.post("/", verifyToken, upload.array("evidence", 5), async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        const { bookingId, reason, subReason, message } = req.body;

        if (!bookingId || !reason || !message) {
            return res.status(400).json({ message: "Booking ID, reason, and message are required" });
        }

        // Fetch booking details
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        // Verify the user owns this booking
        if (booking.userId.toString() !== userId) {
            return res.status(403).json({ message: "You can only report your own bookings" });
        }

        // Fetch hotel to get owner ID
        const hotel = await Hotel.findById(booking.hotelId);
        if (!hotel) {
            return res.status(404).json({ message: "Hotel not found" });
        }

        // Upload evidence files if any
        const evidenceUrls: string[] = [];
        if (req.files && Array.isArray(req.files)) {
            for (const file of req.files) {
                const url = await uploadToCloudinary(file);
                evidenceUrls.push(url);
            }
        }

        // Create the report
        const report = new Report({
            bookingId: booking._id,
            bookingStatus: booking.status,
            userId: userId,
            hotelId: booking.hotelId,
            ownerId: hotel.userId,
            reason,
            subReason: subReason || undefined,
            message,
            evidenceUrls,
            status: "Open",
        });

        await report.save();

        res.status(201).json({ message: "Report submitted successfully", report });
    } catch (error) {
        console.error("Error creating report:", error);
        res.status(500).json({ message: "Failed to submit report" });
    }
});

// GET /api/reports - Get all reports (admin only)
router.get("/", verifyToken, async (req: Request, res: Response) => {
    try {
        const reports = await Report.find()
            .populate("userId", "firstName lastName email")
            .populate("ownerId", "firstName lastName email")
            .populate("hotelId", "name city")
            .populate("bookingId", "checkIn checkOut totalCost status")
            .sort({ createdAt: -1 });

        res.json(reports);
    } catch (error) {
        console.error("Error fetching reports:", error);
        res.status(500).json({ message: "Failed to fetch reports" });
    }
});

// GET /api/reports/my - Get user's own reports
router.get("/my", verifyToken, async (req: Request, res: Response) => {
    try {
        const reports = await Report.find({ userId: req.userId })
            .populate("hotelId", "name city")
            .populate("bookingId", "checkIn checkOut status")
            .sort({ createdAt: -1 });

        res.json(reports);
    } catch (error) {
        console.error("Error fetching user reports:", error);
        res.status(500).json({ message: "Failed to fetch your reports" });
    }
});

// PUT /api/reports/:id/status - Update report status (admin only)
router.put("/:id/status", verifyToken, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!["Open", "In Review", "Resolved"].includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        const report = await Report.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        )
            .populate("userId", "firstName lastName email")
            .populate("ownerId", "firstName lastName email")
            .populate("hotelId", "name city")
            .populate("bookingId", "checkIn checkOut totalCost status");

        if (!report) {
            return res.status(404).json({ message: "Report not found" });
        }

        res.json({ message: "Report status updated", report });
    } catch (error) {
        console.error("Error updating report status:", error);
        res.status(500).json({ message: "Failed to update report status" });
    }
});

export default router;
