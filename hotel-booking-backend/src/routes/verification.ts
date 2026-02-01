import express, { Request, Response } from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import verifyToken from "../middleware/auth";
import User from "../models/user";
import { body } from "express-validator";

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
    },
});

// Upload verification documents
router.post(
    "/upload",
    verifyToken,
    upload.fields([
        { name: "personalIdFront", maxCount: 1 },
        { name: "businessProof", maxCount: 1 }
    ]),
    async (req: Request, res: Response) => {
        try {
            console.log("Upload request received");
            console.log("Headers:", req.headers);

            if (!req.files) {
                console.log("No files object found in request");
                return res.status(400).json({ message: "No files were uploaded" });
            }

            const files = req.files as { [fieldname: string]: Express.Multer.File[] };
            const imageFiles: Express.Multer.File[] = [];

            if (files && files.personalIdFront) imageFiles.push(files.personalIdFront[0]);
            if (files && files.businessProof) imageFiles.push(files.businessProof[0]);

            console.log("Received files for verification:", imageFiles.length);

            if (imageFiles.length === 0) {
                return res.status(400).json({ message: "No files uploaded. Make sure to select both personal ID and business proof." });
            }

            // Convert to Data URIs (Matches hotel pattern in this project)
            const uploadedDocuments = imageFiles.map((image) => {
                const buffer = image.buffer;
                const b64 = (buffer as Buffer).toString("base64");
                const dataURI = `data:${image.mimetype};base64,${b64}`;
                return {
                    url: dataURI,
                    name: image.originalname,
                    documentType: "document",
                    uploadedAt: new Date(),
                };
            });

            try {
                const updatedUser = await User.findByIdAndUpdate(
                    req.userId,
                    {
                        $set: {
                            "verification.status": "SUBMITTED",
                            "verification.documents": uploadedDocuments,
                            "verification.rejectionReason": undefined
                        }
                    },
                    { new: true, runValidators: true }
                );

                if (!updatedUser) {
                    return res.status(404).json({ message: "User not found" });
                }

                console.log("Verification status updated successfully for user:", updatedUser.email);
                res.status(200).json({ message: "Documents uploaded successfully", status: updatedUser.verification.status });
            } catch (updateError: any) {
                console.error("User update error during verification:", updateError);
                throw new Error(`Failed to update verification: ${updateError.message}`);
            }
        } catch (error: any) {
            console.error("VERIFICATION UPLOAD ERROR:", error);
            res.status(500).json({ message: error.message || "Internal Server Error" });
        }
    }
);

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
            rejectionReason: ""
        };

        res.json(verificationStatus);
    } catch (error) {
        res.status(500).json({ message: "Error fetching status" });
    }
});

export default router;
