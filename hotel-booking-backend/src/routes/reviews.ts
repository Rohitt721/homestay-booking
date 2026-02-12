import express, { Request, Response } from "express";
import { check, validationResult } from "express-validator";
import verifyToken from "../middleware/auth";
import Review from "../models/review";
import Booking from "../models/booking";
import Hotel from "../models/hotel";

const router = express.Router();

// POST /api/reviews
router.post(
    "/",
    verifyToken,
    [
        check("hotelId", "Hotel ID is required").notEmpty(),
        check("bookingId", "Booking ID is required").notEmpty(),
        check("rating", "Rating must be between 1 and 5").isInt({ min: 1, max: 5 }),
        check("comment", "Comment is required").notEmpty(),
        check("categories.cleanliness", "Cleanliness rating is required").isInt({ min: 1, max: 5 }),
        check("categories.service", "Service rating is required").isInt({ min: 1, max: 5 }),
        check("categories.location", "Location rating is required").isInt({ min: 1, max: 5 }),
        check("categories.value", "Value rating is required").isInt({ min: 1, max: 5 }),
        check("categories.amenities", "Amenities rating is required").isInt({ min: 1, max: 5 }),
    ],
    async (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { hotelId, bookingId, rating, comment, categories } = req.body;

            // 1. Verify the booking exists and belongs to the user
            const booking = await Booking.findOne({
                _id: bookingId,
                userId: req.userId,
                status: "COMPLETED",
            });

            if (!booking) {
                return res.status(404).json({ message: "Completed booking not found or doesn't belong to you" });
            }

            // 2. Check if a review already exists for this booking
            const existingReview = await Review.findOne({ bookingId });
            if (existingReview) {
                return res.status(400).json({ message: "You have already reviewed this stay" });
            }

            // 3. Create the review
            const newReview = new Review({
                userId: req.userId,
                hotelId,
                bookingId,
                rating,
                comment,
                categories,
                isVerified: true, // Since they have a completed booking
            });

            await newReview.save();

            // 4. Update Hotel star rating, average rating, and review count
            const reviews = await Review.find({ hotelId });
            const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
            const averageRating = totalRating / reviews.length;

            await Hotel.findByIdAndUpdate(hotelId, {
                $set: { averageRating, starRating: Math.round(averageRating) },
                $inc: { reviewCount: 1 },
            });

            res.status(201).json(newReview);
        } catch (error) {
            console.error("Error submitting review:", error);
            res.status(500).json({ message: "Failed to submit review" });
        }
    }
);

// GET /api/reviews/hotel/:hotelId
router.get("/hotel/:hotelId", async (req: Request, res: Response) => {
    try {
        const reviews = await Review.find({ hotelId: req.params.hotelId }).sort({ createdAt: -1 });
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: "Error fetching reviews" });
    }
});

export default router;
