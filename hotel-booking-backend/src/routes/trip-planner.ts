import express, { Request, Response } from "express";
import verifyToken from "../middleware/auth";
import { generateTripPlan, findAlternateHotels, TripPlanInput } from "../services/trip-planner";
import { body, validationResult } from "express-validator";
import SavedTrip from "../models/savedTrip";

const router = express.Router();

/**
 * POST /api/trip-planner/generate
 * Generate a complete trip plan with day-wise itinerary and hotel recommendations
 */
router.post(
    "/generate",
    verifyToken,
    [
        body("destination").notEmpty().withMessage("Destination is required"),
        body("startDate").notEmpty().withMessage("Start date is required"),
        body("duration")
            .isInt({ min: 1, max: 30 })
            .withMessage("Duration must be between 1 and 30 days"),
        body("travelStyle")
            .isIn(["adventure", "cultural", "relaxation", "food", "mixed"])
            .withMessage("Invalid travel style"),
        body("budget")
            .isIn(["budget", "moderate", "luxury"])
            .withMessage("Invalid budget option"),
    ],
    async (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            console.log("🗺️ Generating trip plan for:", req.body.destination);

            const input: TripPlanInput = {
                destination: req.body.destination,
                startDate: req.body.startDate,
                duration: parseInt(req.body.duration),
                travelStyle: req.body.travelStyle,
                budget: req.body.budget,
                mustVisitPlaces: req.body.mustVisitPlaces || [],
            };

            const tripPlan = await generateTripPlan(input);

            console.log("✅ Trip plan generated successfully");
            res.status(200).json(tripPlan);
        } catch (error: any) {
            console.error("Trip planning error:", error);
            res.status(500).json({
                message: "Failed to generate trip plan",
                error: error.message
            });
        }
    }
);

/**
 * POST /api/trip-planner/alternate-hotels
 * Find alternate hotels when primary options are unavailable
 */
router.post(
    "/alternate-hotels",
    verifyToken,
    [
        body("destination").notEmpty().withMessage("Destination is required"),
        body("checkIn").notEmpty().withMessage("Check-in date is required"),
        body("checkOut").notEmpty().withMessage("Check-out date is required"),
        body("budget")
            .isIn(["budget", "moderate", "luxury"])
            .withMessage("Invalid budget option"),
    ],
    async (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { destination, checkIn, checkOut, budget } = req.body;

            const alternateHotels = await findAlternateHotels(
                destination,
                budget,
                new Date(checkIn),
                new Date(checkOut)
            );

            res.status(200).json({ hotels: alternateHotels });
        } catch (error: any) {
            console.error("Alternate hotel search error:", error);
            res.status(500).json({
                message: "Failed to find alternate hotels",
                error: error.message
            });
        }
    }
);

/**
 * GET /api/trip-planner/travel-styles
 * Get available travel styles with descriptions
 */
router.get("/travel-styles", (_req: Request, res: Response) => {
    const styles = [
        {
            id: "adventure",
            name: "Adventure",
            description: "Hiking, extreme sports, outdoor activities",
            icon: "⛰️",
        },
        {
            id: "cultural",
            name: "Cultural",
            description: "Museums, historical sites, local traditions",
            icon: "🏛️",
        },
        {
            id: "relaxation",
            name: "Relaxation",
            description: "Spas, beaches, peaceful retreats",
            icon: "🧘",
        },
        {
            id: "food",
            name: "Food & Culinary",
            description: "Local cuisine, cooking classes, food tours",
            icon: "🍜",
        },
        {
            id: "mixed",
            name: "Mixed Experience",
            description: "A balanced mix of all experiences",
            icon: "✨",
        },
    ];

    res.json(styles);
});

/**
 * GET /api/trip-planner/budget-options
 * Get available budget options with price ranges
 */
router.get("/budget-options", (_req: Request, res: Response) => {
    const options = [
        {
            id: "budget",
            name: "Budget Friendly",
            description: "Affordable stays under ₹2,000/night",
            priceRange: "₹500 - ₹2,000",
            icon: "💰",
        },
        {
            id: "moderate",
            name: "Moderate",
            description: "Comfortable stays with good amenities",
            priceRange: "₹2,000 - ₹5,000",
            icon: "💎",
        },
        {
            id: "luxury",
            name: "Luxury",
            description: "Premium stays with top-tier services",
            priceRange: "₹5,000+",
            icon: "👑",
        },
    ];

    res.json(options);
});

/**
 * POST /api/trip-planner/save
 * Save a generated trip plan to the user's profile
 */
router.post(
    "/save",
    verifyToken,
    [
        body("name").notEmpty().withMessage("Trip name is required"),
        body("destination").notEmpty().withMessage("Destination is required"),
        body("planData").notEmpty().withMessage("Plan data is required"),
    ],
    async (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const newTrip = new SavedTrip({
                userId: req.userId,
                name: req.body.name,
                destination: req.body.destination,
                planData: req.body.planData,
            });

            await newTrip.save();
            res.status(201).json(newTrip);
        } catch (error: any) {
            console.error("Error saving trip:", error);
            res.status(500).json({ message: "Error saving trip plan" });
        }
    }
);

/**
 * GET /api/trip-planner/my-trips
 * Get all saved trips for the authenticated user
 */
router.get("/my-trips", verifyToken, async (req: Request, res: Response) => {
    try {
        const trips = await SavedTrip.find({ userId: req.userId }).sort({ createdAt: -1 });
        res.json(trips);
    } catch (error) {
        console.error("Error fetching trips:", error);
        res.status(500).json({ message: "Error fetching saved trips" });
    }
});

/**
 * DELETE /api/trip-planner/my-trips/:id
 * Delete a saved trip
 */
router.delete("/my-trips/:id", verifyToken, async (req: Request, res: Response) => {
    try {
        const trip = await SavedTrip.findOneAndDelete({
            _id: req.params.id,
            userId: req.userId,
        });

        if (!trip) {
            return res.status(404).json({ message: "Trip not found" });
        }

        res.json({ message: "Trip deleted successfully" });
    } catch (error) {
        console.error("Error deleting trip:", error);
        res.status(500).json({ message: "Error deleting trip plan" });
    }
});

export default router;
