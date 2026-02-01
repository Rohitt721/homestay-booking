import express, { Request, Response } from "express";
import Booking from "../models/booking";
import User from "../models/user";
import Hotel from "../models/hotel";
import verifyToken from "../middleware/auth";

const router = express.Router();

/**
 * @swagger
 * /api/rankings/hotels:
 *   get:
 *     summary: Get top performing hotels
 *     description: Returns a ranked list of hotels based on bookings and revenue
 */
router.get("/hotels", verifyToken, async (req: Request, res: Response) => {
    try {
        const currentUserId = req.userId;

        const rankings = await Booking.aggregate([
            // Group by hotelId to get total revenue and bookings
            {
                $group: {
                    _id: "$hotelId",
                    bookingCount: { $sum: 1 },
                    totalRevenue: { $sum: "$totalCost" },
                },
            },
            // Convert _id to ObjectId for Lookup
            {
                $addFields: {
                    hotelIdObj: { $toObjectId: "$_id" },
                },
            },
            // Join with Hotels to get details
            {
                $lookup: {
                    from: "hotels",
                    localField: "hotelIdObj",
                    foreignField: "_id",
                    as: "hotel",
                },
            },
            { $unwind: "$hotel" },
            // Project necessary fields
            {
                $project: {
                    _id: "$hotel._id",
                    name: "$hotel.name",
                    city: "$hotel.city",
                    country: "$hotel.country",
                    bookingCount: 1,
                    totalRevenue: 1,
                    ownerId: "$hotel.userId",
                },
            },
            // Sort by total Revenue descending
            { $sort: { totalRevenue: -1 } },
            // Limit to top 50
            { $limit: 50 },
        ]);

        // Enhance response to indicate if it's the current user's hotel
        const enhancedRankings = rankings.map((hotel, index) => ({
            ...hotel,
            rank: index + 1,
            isMyHotel: hotel.ownerId === currentUserId,
        }));

        res.json(enhancedRankings);
    } catch (error) {
        console.error("Hotel Ranking Error:", error);
        res.status(500).json({ message: "Failed to fetch hotel rankings" });
    }
});

/**
 * @swagger
 * /api/rankings/owners:
 *   get:
 *     summary: Get top performing owners
 *     description: Returns a ranked list of owners based on total revenue
 */
router.get("/owners", verifyToken, async (req: Request, res: Response) => {
    try {
        const currentUserId = req.userId;

        const rankings = await Booking.aggregate([
            // Convert hotelId to ObjectId
            {
                $addFields: {
                    hotelIdObj: { $toObjectId: "$hotelId" }
                }
            },
            // Join with Hotels to get Owner ID
            {
                $lookup: {
                    from: "hotels",
                    localField: "hotelIdObj",
                    foreignField: "_id",
                    as: "hotel",
                },
            },
            { $unwind: "$hotel" },
            // Group by Owner ID
            {
                $group: {
                    _id: "$hotel.userId",
                    bookingCount: { $sum: 1 },
                    totalRevenue: { $sum: "$totalCost" },
                    hotelCount: { $addToSet: "$hotel._id" }, // Count unique hotels contributing
                },
            },
            // Join with Users to get Name
            {
                $addFields: {
                    userIdObj: { $toObjectId: "$_id" }
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "userIdObj",
                    foreignField: "_id",
                    as: "owner",
                },
            },
            { $unwind: "$owner" },
            // Project (Be careful with privacy, only show Name)
            {
                $project: {
                    _id: 1, // Owner ID
                    firstName: "$owner.firstName",
                    lastName: "$owner.lastName", // Optional: Mask last name? Users usually public in rankings? I'll show full name for now.
                    bookingCount: 1,
                    totalRevenue: 1,
                    hotelCount: { $size: "$hotelCount" },
                },
            },
            // Sort by Revenue
            { $sort: { totalRevenue: -1 } },
            // Limit
            { $limit: 50 },
        ]);

        // Enhance response
        const enhancedRankings = rankings.map((owner, index) => ({
            ...owner,
            rank: index + 1,
            isMe: owner._id.toString() === currentUserId,
        }));

        res.json(enhancedRankings);
    } catch (error) {
        console.error("Owner Ranking Error:", error);
        res.status(500).json({ message: "Failed to fetch owner rankings" });
    }
});

export default router;
