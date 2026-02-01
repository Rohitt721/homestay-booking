import express, { Request, Response } from "express";
import multer from "multer";
import Hotel from "../models/hotel";
import Booking from "../models/booking";
import verifyToken from "../middleware/auth";
import verifySubscription from "../middleware/verifySubscription";
import { body } from "express-validator";
import { HotelType } from "../../../shared/types";

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

router.post(
  "/",
  verifyToken,
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("city").notEmpty().withMessage("City is required"),
    body("country").notEmpty().withMessage("Country is required"),
    body("description").notEmpty().withMessage("Description is required"),
    body("type")
      .notEmpty()
      .isArray({ min: 1 })
      .withMessage("Select at least one hotel type"),
    body("pricePerNight")
      .notEmpty()
      .isNumeric()
      .withMessage("Price per night is required and must be a number"),
    body("facilities")
      .notEmpty()
      .isArray()
      .withMessage("Facilities are required"),
  ],
  upload.array("imageFiles", 6),
  async (req: Request, res: Response) => {
    try {
      const imageFiles = (req as any).files as any[];
      const newHotel: HotelType = req.body;

      // Ensure type is always an array
      if (typeof newHotel.type === "string") {
        newHotel.type = [newHotel.type];
      }

      // Handle nested objects from FormData
      newHotel.contact = {
        phone: req.body["contact.phone"] || "",
        email: req.body["contact.email"] || "",
        website: req.body["contact.website"] || "",
      };

      newHotel.policies = {
        checkInTime: req.body["policies.checkInTime"] || "",
        checkOutTime: req.body["policies.checkOutTime"] || "",
        cancellationPolicy: req.body["policies.cancellationPolicy"] || "",
        petPolicy: req.body["policies.petPolicy"] || "",
        smokingPolicy: req.body["policies.smokingPolicy"] || "",
      };

      const imageUrls = await uploadImages(imageFiles);

      newHotel.imageUrls = imageUrls;
      newHotel.lastUpdated = new Date();
      newHotel.userId = req.userId;

      const hotel = new Hotel(newHotel);
      await hotel.save();

      res.status(201).send(hotel);
    } catch (e) {
      console.log(e);
      res.status(500).json({ message: "Something went wrong" });
    }
  }
);

// Get all guests who have booked any of the owner's hotels
router.get("/guests", verifyToken, async (req: Request, res: Response) => {
  try {
    // 1. Find all hotels owned by this user
    const hotels = await Hotel.find({ userId: req.userId });
    const hotelIds = hotels.map((hotel) => hotel._id);

    // 2. Find all bookings for these hotels and populate user details
    const bookings = await Booking.find({ hotelId: { $in: hotelIds } })
      .populate("userId", "firstName lastName email")
      .populate("hotelId", "name city");

    // 3. Group bookings by user to create a Guest List with stay history
    const guestsMap = new Map();

    bookings.forEach((booking) => {
      const user = booking.userId as any;
      if (!user) return; // Skip if user no longer exists

      const guestId = user._id?.toString() || user.toString();

      if (!guestsMap.has(guestId)) {
        guestsMap.set(guestId, {
          _id: guestId,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          totalStays: 0,
          totalSpent: 0,
          stayHistory: [],
        });
      }

      const guest = guestsMap.get(guestId);
      guest.totalStays += 1;
      guest.totalSpent += booking.totalCost || 0;
      guest.stayHistory.push({
        bookingId: booking._id.toString(),
        hotelName: (booking.hotelId as any)?.name || "Unknown Hotel",
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        totalCost: booking.totalCost,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        idProof: booking.idProof,
        phone: booking.phone || user.phone || "",
      });
    });

    const guestList = Array.from(guestsMap.values());
    res.json(guestList);
  } catch (error) {
    console.error("DEBUG: Error in /guests endpoint:", error);
    res.status(500).json({
      message: "Error fetching guests",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

router.get("/", verifyToken, async (req: Request, res: Response) => {
  try {
    const hotels = await Hotel.find({ userId: req.userId });
    res.json(hotels);
  } catch (error) {
    res.status(500).json({ message: "Error fetching hotels" });
  }
});

router.get("/:id", verifyToken, async (req: Request, res: Response) => {
  const id = req.params.id.toString();
  try {
    const hotel = await Hotel.findOne({
      _id: id,
      userId: req.userId,
    });
    res.json(hotel);
  } catch (error) {
    res.status(500).json({ message: "Error fetching hotels" });
  }
});

router.put(
  "/:hotelId",
  verifyToken,
  upload.array("imageFiles"),
  async (req: Request, res: Response) => {
    try {
      console.log("Request body:", req.body);
      console.log("Hotel ID:", req.params.hotelId);
      console.log("User ID:", req.userId);

      // First, find the existing hotel
      const existingHotel = await Hotel.findOne({
        _id: req.params.hotelId,
        userId: req.userId,
      });

      if (!existingHotel) {
        return res.status(404).json({ message: "Hotel not found" });
      }

      // Prepare update data
      const updateData: any = {
        name: req.body.name,
        city: req.body.city,
        country: req.body.country,
        description: req.body.description,
        type: Array.isArray(req.body.type) ? req.body.type : [req.body.type],
        pricePerNight: Number(req.body.pricePerNight),
        starRating: Number(req.body.starRating),
        adultCount: Number(req.body.adultCount),
        childCount: Number(req.body.childCount),
        facilities: Array.isArray(req.body.facilities)
          ? req.body.facilities
          : [req.body.facilities],
        lastUpdated: new Date(),
      };

      // Handle contact information
      updateData.contact = {
        phone: req.body["contact.phone"] || "",
        email: req.body["contact.email"] || "",
        website: req.body["contact.website"] || "",
      };

      // Handle policies
      updateData.policies = {
        checkInTime: req.body["policies.checkInTime"] || "",
        checkOutTime: req.body["policies.checkOutTime"] || "",
        cancellationPolicy: req.body["policies.cancellationPolicy"] || "",
        petPolicy: req.body["policies.petPolicy"] || "",
        smokingPolicy: req.body["policies.smokingPolicy"] || "",
      };

      console.log("Update data:", updateData);

      // Update the hotel
      const updatedHotel = await Hotel.findByIdAndUpdate(
        req.params.hotelId,
        updateData,
        { new: true }
      );

      if (!updatedHotel) {
        return res.status(404).json({ message: "Hotel not found" });
      }

      // Handle image uploads if any
      const files = (req as any).files as any[];
      if (files && files.length > 0) {
        const updatedImageUrls = await uploadImages(files);
        updatedHotel.imageUrls = [
          ...updatedImageUrls,
          ...(req.body.imageUrls
            ? Array.isArray(req.body.imageUrls)
              ? req.body.imageUrls
              : [req.body.imageUrls]
            : []),
        ];
        await updatedHotel.save();
      }

      res.status(200).json(updatedHotel);
    } catch (error) {
      console.error("Error updating hotel:", error);
      console.error("Request body:", req.body);
      console.error("Hotel ID:", req.params.hotelId);
      console.error("User ID:", req.userId);
      res.status(500).json({
        message: "Something went wrong",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

router.post(
  "/:hotelId/publish",
  verifyToken,
  verifySubscription,
  async (req: Request, res: Response) => {
    try {
      const hotel = await Hotel.findOneAndUpdate(
        { _id: req.params.hotelId, userId: req.userId },
        { status: "PUBLISHED", lastUpdated: new Date() },
        { new: true }
      );

      if (!hotel) {
        return res.status(404).json({ message: "Hotel not found" });
      }

      res.status(200).json(hotel);
    } catch (error) {
      res.status(500).json({ message: "Error publishing hotel" });
    }
  }
);

async function uploadImages(imageFiles: any[]) {
  const uploadPromises = imageFiles.map(async (image) => {
    const b64 = Buffer.from(image.buffer as Uint8Array).toString("base64");
    const dataURI = `data:${image.mimetype};base64,${b64}`;
    return dataURI;
  });

  const imageUrls = await Promise.all(uploadPromises);
  return imageUrls;
}

export default router;
