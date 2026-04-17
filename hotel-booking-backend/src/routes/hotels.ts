import express, { Request, Response } from "express";
import Hotel from "../models/hotel";
import Booking from "../models/booking";
import User from "../models/user";
import { BookingType, HotelSearchResponse } from "../types";
import { param, validationResult } from "express-validator";
import verifyToken from "../middleware/auth";

const router = express.Router();

router.get("/search", async (req: Request, res: Response) => {
  try {
    const query = constructSearchQuery(req.query);

    let sortOptions = {};
    switch (req.query.sortOption) {
      case "starRating":
        sortOptions = { starRating: -1 };
        break;
      case "pricePerNightAsc":
        sortOptions = { pricePerNight: 1 };
        break;
      case "pricePerNightDesc":
        sortOptions = { pricePerNight: -1 };
        break;
    }

    const pageSize = 5;
    const pageNumber = parseInt(
      req.query.page ? req.query.page.toString() : "1"
    );
    const skip = (pageNumber - 1) * pageSize;

    const hotels = await Hotel.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(pageSize);

    const total = await Hotel.countDocuments(query);

    const response: HotelSearchResponse = {
      data: hotels,
      pagination: {
        total,
        page: pageNumber,
        pages: Math.ceil(total / pageSize),
      },
    };

    res.json(response);
  } catch (error) {
    console.log("error", error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

router.get("/", async (req: Request, res: Response) => {
  try {
    const hotels = await Hotel.find({ status: "PUBLISHED" }).sort("-lastUpdated");
    res.json(hotels);
  } catch (error) {
    console.log("error", error);
    res.status(500).json({ message: "Error fetching hotels" });
  }
});

router.get(
  "/:id",
  [param("id").notEmpty().withMessage("Hotel ID is required")],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const id = req.params.id.toString();

    try {
      const hotel = await Hotel.findOne({
        _id: id,
        status: "PUBLISHED",
      });
      res.json(hotel);
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Error fetching hotel" });
    }
  }
);
router.get(
  "/:id/availability",
  [param("id").notEmpty().withMessage("Hotel ID is required")],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const hotelId = req.params.id;
      // Fetch all non-cancelled/non-rejected bookings
      const bookings = await Booking.find({
        hotelId,
        status: { $nin: ["CANCELLED", "REJECTED", "REFUNDED"] },
      }).select("checkIn checkOut bookingType");

      // Transform into a simple array of date/time ranges
      const bookedDates = bookings.map((booking) => ({
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        bookingType: booking.bookingType,
      }));

      res.status(200).json(bookedDates);
    } catch (error) {
      console.error("Error fetching availability:", error);
      res.status(500).json({ message: "Error fetching availability" });
    }
  }
);


router.post(
  "/:hotelId/bookings",
  verifyToken,
  async (req: Request, res: Response) => {
    try {
      // In dummy mode, we don't verify with external providers
      console.log("📝 Processing dummy booking for hotel:", req.params.hotelId);

      const { checkIn, checkOut, bookingType } = req.body;
      const hotel = await Hotel.findById(req.params.hotelId);

      if (!hotel) {
        return res.status(404).json({ message: "Hotel not found" });
      }

      // 0. Support check for hourly bookings
      if (bookingType === "hourly") {
        if (!hotel.pricePerHour || hotel.pricePerHour <= 0) {
          return res.status(400).json({
            message: "Hourly bookings are not supported for this hotel."
          });
        }

        const start = new Date(checkIn);
        const end = new Date(checkOut);
        const durationInMs = end.getTime() - start.getTime();
        if (durationInMs < 1000 * 60 * 60) {
          return res.status(400).json({
            message: "The minimum booking duration is 1 hour.",
          });
        }
      }

      // 1. Double-booking prevention: Check for overlapping bookings
      // Logic: (StartA < EndB) && (EndA > StartB)
      const existingBooking = await Booking.findOne({
        hotelId: req.params.hotelId,
        status: { $nin: ["CANCELLED", "REJECTED", "REFUNDED"] },
        $or: [
          {
            checkIn: { $lt: new Date(checkOut) },
            checkOut: { $gt: new Date(checkIn) },
          },
        ],
      });

      if (existingBooking) {
        return res.status(400).json({
          message: "The selected time slot is already booked. Please choose a different time or date.",
        });
      }

      // 2. Identity Verification Check
      const user = await User.findById(req.userId);
      if (!user || user.verification?.status !== "VERIFIED") {
        return res.status(403).json({
          message: "Account verification required. Please verify your identity before booking.",
        });
      }

      const newBooking: BookingType = {
        ...req.body,
        userId: req.userId,
        hotelId: req.params.hotelId,
        createdAt: new Date(),
        status: "CONFIRMED", // Verified users get automatic confirmation (unless logic dictates otherwise)
        paymentStatus: "paid",
        idProof: {
          idType: (["Aadhaar", "Passport", "Driving License", "Voter ID"].includes(user.verification.documents[0]?.documentType || "")
            ? user.verification.documents[0]?.documentType as any
            : "Aadhaar"),
          frontImage: user.verification.documents[0]?.url || "",
          backImage: user.verification.documents[1]?.url || "",
          status: "VERIFIED",
          uploadedAt: user.verification.documents[0]?.uploadedAt || new Date(),
          verifiedAt: new Date(),
        },
      };

      // Create booking in separate collection
      const booking = new Booking(newBooking);
      await booking.save();

      // Update hotel analytics
      await Hotel.findByIdAndUpdate(req.params.hotelId, {
        $inc: {
          totalBookings: 1,
          totalRevenue: newBooking.totalCost,
        },
      });

      // Update user analytics
      await User.findByIdAndUpdate(req.userId, {
        $inc: {
          totalBookings: 1,
          totalSpent: newBooking.totalCost,
        },
      });

      res.status(200).send();
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "something went wrong" });
    }
  }
);
const constructSearchQuery = (queryParams: any) => {
  let constructedQuery: any = { status: "PUBLISHED" };

  if (queryParams.destination && queryParams.destination.trim() !== "") {
    const destination = queryParams.destination.trim();

    constructedQuery.$or = [
      { city: { $regex: destination, $options: "i" } },
      { country: { $regex: destination, $options: "i" } },
    ];
  }

  if (queryParams.adultCount) {
    constructedQuery.adultCount = {
      $gte: parseInt(queryParams.adultCount),
    };
  }

  if (queryParams.childCount) {
    constructedQuery.childCount = {
      $gte: parseInt(queryParams.childCount),
    };
  }

  if (queryParams.facilities) {
    constructedQuery.facilities = {
      $all: Array.isArray(queryParams.facilities)
        ? queryParams.facilities
        : [queryParams.facilities],
    };
  }

  if (queryParams.types) {
    constructedQuery.type = {
      $in: Array.isArray(queryParams.types)
        ? queryParams.types
        : [queryParams.types],
    };
  }

  if (queryParams.stars) {
    const starRatings = Array.isArray(queryParams.stars)
      ? queryParams.stars.map((star: string) => parseInt(star))
      : parseInt(queryParams.stars);

    constructedQuery.starRating = { $in: starRatings };
  }

  if (queryParams.maxPrice) {
    constructedQuery.pricePerNight = {
      $lte: parseInt(queryParams.maxPrice).toString(),
    };
  }

  return constructedQuery;
};

export default router;
