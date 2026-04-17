import express, { Request, Response } from "express";
import multer from "multer";
import verifyToken from "../middleware/auth";
import User from "../models/user";
import UserProfile from "../models/userProfile";
import {
  runVerification,
  maskAadhaarNumber,
  validateVerhoeff,
} from "../services/aadhaarVerification";

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
    },
});

// Upload verification documents with smart verification
router.post(
    "/upload",
    verifyToken,
    upload.fields([
        { name: "aadhaarFront", maxCount: 1 },
        { name: "aadhaarBack", maxCount: 1 },
        { name: "selfie", maxCount: 1 },
    ]),
    async (req: Request, res: Response) => {
        try {
            console.log("🔐 Smart Aadhaar Verification request received");

            const { aadhaarNumber } = req.body;

            if (!aadhaarNumber) {
                return res.status(400).json({ message: "Aadhaar number is required" });
            }

            // Basic format validation before processing
            const cleanedNumber = aadhaarNumber.replace(/[\s-]/g, "");
            if (!/^\d{12}$/.test(cleanedNumber)) {
                return res.status(400).json({ message: "Aadhaar number must be exactly 12 digits" });
            }

            if (!req.files) {
                return res.status(400).json({ message: "No files were uploaded" });
            }

            const files = req.files as { [fieldname: string]: Express.Multer.File[] };

            if (!files.aadhaarFront || files.aadhaarFront.length === 0) {
                return res.status(400).json({ message: "Aadhaar card front image is required" });
            }

            if (!files.selfie || files.selfie.length === 0) {
                return res.status(400).json({ message: "Selfie with Aadhaar is required" });
            }

            // Get user profile information for name matching
            const user = await User.findById(req.userId) as any;
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            const userProfile = await UserProfile.findOne({ userId: req.userId });
            const firstName = userProfile?.firstName || user.firstName || "";
            const lastName = userProfile?.lastName || user.lastName || "";

            // Convert uploaded images to Data URIs for storage
            const aadhaarFrontBuffer = files.aadhaarFront[0].buffer;
            const aadhaarFrontDataUri = `data:${files.aadhaarFront[0].mimetype};base64,${aadhaarFrontBuffer.toString("base64")}`;

            let aadhaarBackDataUri: string | undefined;
            if (files.aadhaarBack && files.aadhaarBack[0]) {
                const backBuffer = files.aadhaarBack[0].buffer;
                aadhaarBackDataUri = `data:${files.aadhaarBack[0].mimetype};base64,${backBuffer.toString("base64")}`;
            }

            const selfieBuffer = files.selfie[0].buffer;
            const selfieDataUri = `data:${files.selfie[0].mimetype};base64,${selfieBuffer.toString("base64")}`;

            // Run the smart verification pipeline
            console.log(`Running verification for user: ${firstName} ${lastName} (${user.email})`);

            const verificationResult = await runVerification(
                cleanedNumber,
                aadhaarFrontBuffer,
                firstName,
                lastName,
                req.userId
            );

            // Prepare documents array
            const documents = [
                {
                    url: aadhaarFrontDataUri,
                    name: files.aadhaarFront[0].originalname,
                    documentType: "Aadhaar Front",
                    uploadedAt: new Date(),
                },
            ];

            if (aadhaarBackDataUri) {
                documents.push({
                    url: aadhaarBackDataUri,
                    name: files.aadhaarBack[0].originalname,
                    documentType: "Aadhaar Back",
                    uploadedAt: new Date(),
                });
            }

            // Update user verification data
            const updatedUser = await User.findByIdAndUpdate(
                req.userId,
                {
                    $set: {
                        "verification.status": verificationResult.status,
                        "verification.documents": documents,
                        "verification.selfieUrl": selfieDataUri,
                        "verification.aadhaarNumber": maskAadhaarNumber(cleanedNumber),
                        "verification.confidenceScore": verificationResult.confidenceScore,
                        "verification.verificationChecks": verificationResult.checks,
                        "verification.ocrExtractedName": verificationResult.ocrExtractedName || "",
                        "verification.ocrExtractedNumber": verificationResult.ocrExtractedNumber || "",
                    },
                },
                { new: true, runValidators: true }
            );

            if (!updatedUser) {
                return res.status(404).json({ message: "User not found" });
            }

            console.log(
                `✅ Verification complete for ${user.email}: ${verificationResult.status} (Score: ${verificationResult.confidenceScore}/100)`
            );

            res.status(200).json({
                message: getStatusMessage(verificationResult.status),
                status: verificationResult.status,
                confidenceScore: verificationResult.confidenceScore,
                checks: verificationResult.checks,
            });
        } catch (error: any) {
            console.error("❌ VERIFICATION UPLOAD ERROR:", error);
            res.status(500).json({ message: error.message || "Internal Server Error" });
        }
    }
);

// Quick Aadhaar number validation endpoint (for real-time frontend validation)
router.post("/validate-aadhaar", verifyToken, (req: Request, res: Response) => {
    const { aadhaarNumber } = req.body;

    if (!aadhaarNumber) {
        return res.status(400).json({ valid: false, message: "Aadhaar number required" });
    }

    const cleaned = aadhaarNumber.replace(/[\s-]/g, "");
    if (!/^\d{12}$/.test(cleaned)) {
        return res.status(200).json({ valid: false, message: "Must be exactly 12 digits" });
    }

    const isValid = validateVerhoeff(cleaned);
    res.json({
        valid: isValid,
        message: isValid
            ? "Valid Aadhaar number ✓"
            : "Invalid Aadhaar number (checksum failed)",
    });
});

// Get Verification Status
router.get("/status", verifyToken, async (req: Request, res: Response) => {
    try {
        const user = await User.findById(req.userId) as any;
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Explicitly define structure to avoid TS issues if field missing
        const verificationStatus = user.verification || {
            status: "PENDING",
            documents: [],
            rejectionReason: "",
        };

        res.json(verificationStatus);
    } catch (error) {
        res.status(500).json({ message: "Error fetching status" });
    }
});

function getStatusMessage(status: string): string {
    switch (status) {
        case "VERIFIED":
            return "🎉 Your identity has been automatically verified! You can now book hotels.";
        case "SUBMITTED":
            return "Your documents are under review. Our AI flagged some items for manual verification. Typical review time: 2-4 hours.";
        case "REJECTED":
            return "Verification failed. Please check the details and try again with clear, valid documents.";
        default:
            return "Verification status updated.";
    }
}

export default router;
