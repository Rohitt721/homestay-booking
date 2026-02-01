import express, { Request, Response } from "express";
import multer from "multer";
import verifyToken from "../middleware/auth";
import Hotel from "../models/hotel";
import Booking from "../models/booking";

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

// /api/my-bookings
router.get("/", verifyToken, async (req: Request, res: Response) => {
  try {
    // Get user's bookings from separate collection
    const userBookings = await Booking.find({ userId: req.userId }).sort({
      createdAt: -1,
    });

    // Get hotel details for each booking
    const results = await Promise.all(
      userBookings.map(async (booking) => {
        const hotel = await Hotel.findById(booking.hotelId);
        if (!hotel) {
          return null;
        }

        // Create response object with hotel and booking data
        const hotelWithUserBookings = {
          ...hotel.toObject(),
          bookings: [booking.toObject()],
        };

        return hotelWithUserBookings;
      })
    );

    // Filter out null results and send
    const validResults = results.filter((result) => result !== null);
    res.status(200).send(validResults);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Unable to fetch bookings" });
  }
});

router.post(
  "/:bookingId/upload-id",
  verifyToken,
  upload.fields([
    { name: "frontImage", maxCount: 1 },
    { name: "backImage", maxCount: 1 },
  ]),
  async (req: Request, res: Response) => {
    try {
      const { bookingId } = req.params;
      const { idType } = req.body;

      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      if (!files.frontImage) {
        return res.status(400).json({ message: "Front image is required" });
      }

      const frontImageUrl = await uploadToDataURI(files.frontImage[0]);
      let backImageUrl = "";
      if (files.backImage) {
        backImageUrl = await uploadToDataURI(files.backImage[0]);
      }

      const booking = await Booking.findOneAndUpdate(
        { _id: bookingId, userId: req.userId },
        {
          idProof: {
            idType,
            frontImage: frontImageUrl,
            backImage: backImageUrl,
            status: "SUBMITTED",
            uploadedAt: new Date(),
          },
          status: "ID_SUBMITTED",
        },
        { new: true }
      );

      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      res.status(200).json(booking);
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Server error during ID upload" });
    }
  }
);

async function uploadToDataURI(file: Express.Multer.File) {
  const b64 = Buffer.from(file.buffer as Uint8Array).toString("base64");
  const dataURI = `data:${file.mimetype};base64,${b64}`;
  return dataURI;
}

export default router;
