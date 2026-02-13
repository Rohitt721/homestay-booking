import express, { Request, Response } from "express";
import User from "../models/user";
import jwt from "jsonwebtoken";
import { check, validationResult } from "express-validator";
import verifyToken from "../middleware/auth";
import Otp from "../models/otp";
import { sendOTPEmail } from "../services/emailService";

import UserProfile from "../models/userProfile";
import OwnerProfile from "../models/ownerProfile";
import AdminProfile from "../models/adminProfile";

const router = express.Router();

// ─── GET /me ────────────────────────────────────────────────────────────────
router.get("/me", verifyToken, async (req: Request, res: Response) => {
  const userId = req.userId;

  try {
    const user = await User.findById(userId).select("-password -__v");
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const userProfile = await UserProfile.findOne({ userId }).select("-_id -userId -__v -createdAt -updatedAt -verification");

    let ownerProfile = null;
    if (user.role === "hotel_owner") {
      ownerProfile = await OwnerProfile.findOne({ userId }).select("-_id -userId -__v -createdAt -updatedAt");
    }

    let adminProfile = null;
    if (user.role === "admin") {
      adminProfile = await AdminProfile.findOne({ userId }).select("-_id -userId -__v -createdAt -updatedAt");
    }

    const combinedUser = {
      ...user.toObject(),
      ...(userProfile ? userProfile.toObject() : {}),
      ...(ownerProfile ? ownerProfile.toObject() : {}),
      ...(adminProfile ? adminProfile.toObject() : {}),
    };

    res.json(combinedUser);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "something went wrong" });
  }
});

// ─── POST /send-otp ─────────────────────────────────────────────────────────
router.post(
  "/send-otp",
  [check("email", "Valid email is required").isEmail()],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array() });
    }

    const { email } = req.body;

    try {
      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "An account with this email already exists" });
      }

      // Rate limit: don't allow resending within 60 seconds
      const recentOtp = await Otp.findOne({
        email,
        createdAt: { $gt: new Date(Date.now() - 60 * 1000) },
      });
      if (recentOtp) {
        return res.status(429).json({ message: "Please wait before requesting a new OTP" });
      }

      // Delete any existing OTPs for this email
      await Otp.deleteMany({ email });

      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      // Save to database (expires in 5 minutes)
      await new Otp({
        email,
        otp,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      }).save();

      // Send email
      await sendOTPEmail(email, otp);

      console.log(`📧 OTP sent to ${email}`);
      return res.status(200).json({ message: "OTP sent successfully" });
    } catch (error) {
      console.error("Error sending OTP:", error);
      return res.status(500).json({ message: "Failed to send OTP. Please try again." });
    }
  }
);

// ─── POST /verify-otp ───────────────────────────────────────────────────────
router.post(
  "/verify-otp",
  [
    check("email", "Valid email is required").isEmail(),
    check("otp", "OTP is required").isString().isLength({ min: 6, max: 6 }),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array() });
    }

    const { email, otp } = req.body;

    try {
      // Find the OTP record
      const otpRecord = await Otp.findOne({ email, otp });

      if (!otpRecord) {
        return res.status(400).json({ message: "Invalid or expired OTP" });
      }

      // Check if expired
      if (otpRecord.expiresAt < new Date()) {
        await Otp.deleteMany({ email });
        return res.status(400).json({ message: "OTP has expired. Please request a new one." });
      }

      // OTP is valid – generate a short-lived token to prove verification
      const otpToken = jwt.sign(
        { email, verified: true },
        process.env.JWT_SECRET_KEY as string,
        { expiresIn: "10m" } // valid for 10 minutes to complete registration
      );

      // Clean up used OTP
      await Otp.deleteMany({ email });

      console.log(`✅ OTP verified for ${email}`);
      return res.status(200).json({ message: "Email verified successfully", otpToken });
    } catch (error) {
      console.error("Error verifying OTP:", error);
      return res.status(500).json({ message: "Verification failed. Please try again." });
    }
  }
);

// ─── POST /register ─────────────────────────────────────────────────────────
router.post(
  "/register",
  [
    check("firstName", "First Name is required").isString(),
    check("lastName", "Last Name is required").isString(),
    check("email", "Email is required").isEmail(),
    check("password", "Password with 6 or more characters required").isLength({
      min: 6,
    }),
    check("otpToken", "Email verification is required").isString(),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array() });
    }

    try {
      // Verify the OTP token
      const { otpToken } = req.body;
      try {
        const decoded = jwt.verify(otpToken, process.env.JWT_SECRET_KEY as string) as {
          email: string;
          verified: boolean;
        };
        if (!decoded.verified || decoded.email !== req.body.email) {
          return res.status(400).json({ message: "Invalid email verification. Please verify your email again." });
        }
      } catch {
        return res.status(400).json({ message: "Email verification expired. Please verify your email again." });
      }

      let user = await User.findOne({
        email: req.body.email,
      });

      if (user) {
        return res.status(400).json({ message: "User already exists" });
      }

      // 1. Create User (Auth) - always 'user' initially, onboarding sets final role
      user = new User({
        email: req.body.email,
        password: req.body.password,
        emailVerified: true,
        onboardingCompleted: false,
      });

      await user.save();

      // 2. Create UserProfile (Basic Info)
      const userProfile = new UserProfile({
        userId: user._id,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
      });
      await userProfile.save();

      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET_KEY as string,
        {
          expiresIn: "1d",
        }
      );

      // Return token in response body so frontend can store it
      return res.status(200).json({
        message: "User registered OK",
        token: token,
        userId: user._id,
      });
    } catch (error) {
      console.log(error);
      res.status(500).send({ message: "Something went wrong" });
    }
  }
);

// ─── POST /complete-onboarding ──────────────────────────────────────────────
router.post(
  "/complete-onboarding",
  verifyToken,
  async (req: Request, res: Response) => {
    const userId = req.userId;
    const { role, heardFrom } = req.body;

    try {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Set the role
      const validRole = (role === "hotel_owner") ? "hotel_owner" : "user";
      user.role = validRole;
      user.onboardingCompleted = true;
      await user.save();

      // Create OwnerProfile if hotel_owner
      if (validRole === "hotel_owner") {
        const existingOwnerProfile = await OwnerProfile.findOne({ userId });
        if (!existingOwnerProfile) {
          const ownerProfile = new OwnerProfile({ userId });
          await ownerProfile.save();
        }
      }

      console.log(`✅ Onboarding completed for user ${userId} as ${validRole}`);

      // Return combined user data
      const userProfile = await UserProfile.findOne({ userId }).select("-_id -userId -__v -createdAt -updatedAt -verification");
      let ownerProfile = null;
      if (validRole === "hotel_owner") {
        ownerProfile = await OwnerProfile.findOne({ userId }).select("-_id -userId -__v -createdAt -updatedAt");
      }

      const combinedUser = {
        ...user.toObject(),
        ...(userProfile ? userProfile.toObject() : {}),
        ...(ownerProfile ? ownerProfile.toObject() : {}),
      };

      return res.status(200).json({
        message: "Onboarding completed",
        user: combinedUser,
      });
    } catch (error) {
      console.error("Error completing onboarding:", error);
      return res.status(500).json({ message: "Failed to complete onboarding" });
    }
  }
);

export default router;
