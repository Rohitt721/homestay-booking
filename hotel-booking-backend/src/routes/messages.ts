import express, { Request, Response } from "express";
import { check, validationResult } from "express-validator";
import Message from "../models/message";
import verifyToken from "../middleware/auth";
import Booking from "../models/booking";
import Hotel from "../models/hotel";

const router = express.Router();

// GET /api/messages/:bookingId
router.get("/:bookingId", verifyToken, async (req: Request, res: Response) => {
    try {
        const booking = await Booking.findById(req.params.bookingId);
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        // Check if user is either the traveler or the hotel owner
        const hotel = await Hotel.findById(booking.hotelId);
        const isTraveler = booking.userId.toString() === req.userId;
        const isHotelOwner = hotel?.userId.toString() === req.userId;

        if (!isTraveler && !isHotelOwner) {
            return res.status(403).json({ message: "Not authorized to view messages for this booking" });
        }

        const messages = await Message.find({ bookingId: req.params.bookingId }).sort({ createdAt: 1 });
        res.json(messages);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Error fetching messages" });
    }
});

// GET /api/messages/owner/chats - Get all bookings that have messages for the current owner
router.get("/owner/chats", verifyToken, async (req: Request, res: Response) => {
    try {
        // 1. Find all hotels owned by this user
        const ownerHotels = await Hotel.find({ userId: req.userId });
        const hotelIds = ownerHotels.map(h => h._id);

        // 2. Find all bookings for these hotels
        const ownerBookings = await Booking.find({ hotelId: { $in: hotelIds } });
        const bookingIds = ownerBookings.map(b => b._id);

        // 3. Find unique bookingIds that have messages
        const bookingIdsWithMessages = await Message.distinct("bookingId", {
            bookingId: { $in: bookingIds }
        });

        // 4. Fetch the booking details for these IDs
        const chats = await Booking.find({ _id: { $in: bookingIdsWithMessages } })
            .populate("hotelId", "name")
            .populate("userId", "firstName lastName email")
            .sort({ updatedAt: -1 });

        res.json(chats);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Error fetching owner chats" });
    }
});

// POST /api/messages
router.post(
    "/",
    verifyToken,
    [
        check("bookingId", "Booking ID is required").notEmpty(),
        check("content", "Message content is required").notEmpty(),
        check("senderRole", "Sender role is required").isIn(["user", "hotel_owner"]),
    ],
    async (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { bookingId, content, senderRole, senderName } = req.body;

            const booking = await Booking.findById(bookingId);
            if (!booking) {
                return res.status(404).json({ message: "Booking not found" });
            }

            // Authorization check
            const hotel = await Hotel.findById(booking.hotelId);
            const isTraveler = booking.userId.toString() === req.userId;
            const isHotelOwner = hotel?.userId.toString() === req.userId;

            if (senderRole === "user" && !isTraveler) {
                return res.status(403).json({ message: "Only the traveler can send messages as 'user'" });
            }
            if (senderRole === "hotel_owner" && !isHotelOwner) {
                return res.status(403).json({ message: "Only the hotel owner can send messages as 'hotel_owner'" });
            }

            const newMessage = new Message({
                bookingId,
                content,
                senderId: req.userId,
                senderName,
                senderRole,
            });

            await newMessage.save();
            res.status(201).json(newMessage);
        } catch (error) {
            console.log(error);
            res.status(500).json({ message: "Error sending message" });
        }
    }
);

export default router;
