import express, { Request, Response } from "express";
import Booking from "../models/booking";
import Hotel from "../models/hotel";
import User from "../models/user";
import verifyToken from "../middleware/auth";
import { body, param, validationResult } from "express-validator";

const router = express.Router();

// Get all bookings (admin only)
router.get("/", verifyToken, async (req: Request, res: Response) => {
  try {
    const bookings = await Booking.find()
      .sort({ createdAt: -1 })
      .populate("hotelId", "name city country");

    res.status(200).json(bookings);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Unable to fetch bookings" });
  }
});

// Get bookings by hotel ID (for hotel owners)
router.get(
  "/hotel/:hotelId",
  verifyToken,
  async (req: Request, res: Response) => {
    try {
      const { hotelId } = req.params;

      // Verify the hotel belongs to the authenticated user
      const hotel = await Hotel.findById(hotelId);
      if (!hotel) {
        return res.status(404).json({ message: "Hotel not found" });
      }

      if (hotel.userId.toString() !== req.userId.toString()) {
        return res.status(403).json({ message: "Access denied" });
      }

      const bookings = await Booking.find({ hotelId })
        .sort({ createdAt: -1 })
        .populate("userId", "firstName lastName email");

      res.status(200).json(bookings);
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Unable to fetch hotel bookings" });
    }
  }
);

// Get booking by ID
router.get("/:id", verifyToken, async (req: Request, res: Response) => {
  try {
    const booking = await Booking.findById(req.params.id).populate(
      "hotelId",
      "name city country imageUrls"
    );

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.status(200).json(booking);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Unable to fetch booking" });
  }
});

// Update booking status
router.patch(
  "/:id/status",
  verifyToken,
  [
    body("status")
      .isIn(["pending", "confirmed", "cancelled", "completed", "refunded"])
      .withMessage("Invalid status"),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { status, cancellationReason } = req.body;
      const booking = await Booking.findById(req.params.id);

      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      const previousStatus = booking.status;

      // Update fields
      booking.status = status;
      if (status === "cancelled" && cancellationReason) {
        booking.cancellationReason = cancellationReason;
      }
      if (status === "refunded") {
        booking.paymentStatus = "refunded";
        booking.refundAmount = req.body.refundAmount || 0;
      }

      await booking.save();

      // Update analytics if status changed to cancelled/rejected (and wasn't already)
      // Note: "rejected" is handled in verify-id route usually, but if done here manually:
      if (
        (status === "cancelled" || status === "rejected") &&
        !["cancelled", "rejected", "refunded"].includes(previousStatus as string)
      ) {
        // Update hotel analytics
        await Hotel.findByIdAndUpdate(booking.hotelId, {
          $inc: {
            totalBookings: -1,
            totalRevenue: -(booking.totalCost || 0),
          },
        });

        // Update user analytics
        await User.findByIdAndUpdate(booking.userId, {
          $inc: {
            totalBookings: -1,
            totalSpent: -(booking.totalCost || 0),
          },
        });
      }

      res.status(200).json(booking);
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Unable to update booking" });
    }
  }
);

// Verify Guest ID (for hotel owners)
router.patch(
  "/:id/verify-id",
  verifyToken,
  async (req: Request, res: Response) => {
    try {
      console.log("=== VERIFY ID ENDPOINT HIT ===");
      console.log("Booking ID:", req.params.id);
      console.log("Request body:", req.body);
      console.log("User ID:", req.userId);

      const { action, rejectionReason } = req.body; // action: 'approve' | 'reject'

      const booking = await Booking.findById(req.params.id);
      console.log("Found booking:", booking ? "Yes" : "No");
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Verify hotel owner
      const hotel = await Hotel.findById(booking.hotelId);
      console.log("Found hotel:", hotel ? "Yes" : "No");
      console.log("Hotel userId:", hotel?.userId);
      console.log("Request userId:", req.userId);
      if (!hotel || hotel.userId.toString() !== req.userId.toString()) {
        console.log("Authorization failed - hotel owner mismatch");
        return res.status(403).json({ message: "Unauthorized" });
      }

      if (action === "approve") {
        booking.status = "CONFIRMED";
        if (booking.idProof) {
          booking.idProof.status = "VERIFIED";
          booking.idProof.verifiedAt = new Date();
        }
      } else if (action === "reject") {
        booking.status = "REJECTED";
        booking.rejectionReason = rejectionReason;
        if (booking.idProof) {
          booking.idProof.status = "REJECTED";
        }

        // Automatic refund simulation
        booking.paymentStatus = "refunded";
        booking.refundAmount = booking.totalCost;

        // Revert analytics
        await Hotel.findByIdAndUpdate(booking.hotelId, {
          $inc: {
            totalBookings: -1,
            totalRevenue: -booking.totalCost,
          },
        });
        await User.findByIdAndUpdate(booking.userId, {
          $inc: {
            totalBookings: -1,
            totalSpent: -booking.totalCost,
          },
        });
      }

      await booking.save();
      res.status(200).json(booking);
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Server error during verification" });
    }
  }
);

// Update payment status
router.patch(
  "/:id/payment",
  verifyToken,
  [
    body("paymentStatus")
      .isIn(["pending", "paid", "failed", "refunded"])
      .withMessage("Invalid payment status"),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { paymentStatus, paymentMethod } = req.body;

      const updateData: any = { paymentStatus };
      if (paymentMethod) {
        updateData.paymentMethod = paymentMethod;
      }

      const booking = await Booking.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true }
      );

      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      res.status(200).json(booking);
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Unable to update payment status" });
    }
  }
);

// Delete booking (admin only)
router.delete("/:id", verifyToken, async (req: Request, res: Response) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Update hotel analytics
    await Hotel.findByIdAndUpdate(booking.hotelId, {
      $inc: {
        totalBookings: -1,
        totalRevenue: -(booking.totalCost || 0),
      },
    });

    // Update user analytics
    await User.findByIdAndUpdate(booking.userId, {
      $inc: {
        totalBookings: -1,
        totalSpent: -(booking.totalCost || 0),
      },
    });

    res.status(200).json({ message: "Booking deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Unable to delete booking" });
  }
});

export default router;
