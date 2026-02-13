import express, { Request, Response } from "express";
import { check, validationResult } from "express-validator";
import User from "../models/user";
import UserProfile from "../models/userProfile";
import OwnerProfile from "../models/ownerProfile";
import AdminProfile from "../models/adminProfile";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import verifyToken from "../middleware/auth";
import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const router = express.Router();

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User login
 *     description: Authenticate user with email and password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 description: User's password
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userId:
 *                   type: string
 *                   description: User ID
 *       400:
 *         description: Invalid credentials or validation error
 *       500:
 *         description: Server error
 */
router.post(
  "/login",
  [
    check("email", "Email is required").isEmail(),
    check("password", "Password with 6 or more characters required").isLength({
      min: 6,
    }),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array() });
    }

    const { email, password } = req.body;

    try {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: "Invalid Credentials" });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid Credentials" });
      }

      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET_KEY as string,
        {
          expiresIn: "1d",
        }
      );

      // Fetch profile data for response
      const userId = user._id;
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

      // Return JWT token in response body for localStorage storage
      res.status(200).json({
        userId: user._id,
        message: "Login successful",
        token: token, // JWT token in response body
        user: combinedUser,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Something went wrong" });
    }
  }
);

/**
 * @swagger
 * /api/auth/validate-token:
 *   get:
 *     summary: Validate authentication token
 *     description: Validate the current user's authentication token
 *     tags: [Authentication]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Token is valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userId:
 *                   type: string
 *                   description: User ID
 *       401:
 *         description: Token is invalid or expired
 */
router.get("/validate-token", verifyToken, (req: Request, res: Response) => {
  res.status(200).send({ userId: req.userId });
});

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: User logout
 *     description: Logout user by clearing authentication cookie
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Logout successful
 */
router.post("/logout", (req: Request, res: Response) => {
  res.cookie("session_id", "", {
    expires: new Date(0),
    maxAge: 0,
    httpOnly: false,
    secure: true,
    sameSite: "none",
    path: "/",
  });
  res.send();
});

/**
 * @swagger
 * /api/auth/google-login:
 *   post:
 *     summary: Google OAuth login
 *     description: Authenticate user using Google ID token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idToken
 *             properties:
 *               idToken:
 *                 type: string
 *                 description: Google ID token
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Invalid Google token
 *       500:
 *         description: Server error
 */
router.post("/google-login", async (req: Request, res: Response) => {
  const { idToken } = req.body;
  console.log("🔵 Google Login Request received");

  let isNewUser = false;

  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    if (!payload) {
      console.error("❌ Google Login Error: Invalid payload from Google");
      return res.status(400).json({ message: "Invalid Google token" });
    }

    const { email, given_name, family_name, name, picture } = payload;
    console.log(`🔵 Google login attempt for email: ${email}`);

    let user = await User.findOne({ email });

    if (!user) {
      console.log(`🟡 User not found for ${email}. Creating new user.`);
      // If given_name/family_name are missing, try to split the full 'name'
      let firstName = given_name;
      let lastName = family_name;

      if (!firstName && name) {
        const nameParts = name.split(" ");
        firstName = nameParts[0];
        lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "User";
      }

      // Create User (Auth) - defaults to 'user', onboarding page will set final role
      user = new User({
        email,
        emailVerified: true,
        onboardingCompleted: false,
      });

      try {
        await user.save();

        // Create UserProfile
        const userProfile = new UserProfile({
          userId: user._id,
          firstName: firstName || "Google",
          lastName: lastName || "User",
          profileImage: picture || ""
        });
        await userProfile.save();

        isNewUser = true;
        console.log(`✅ New user created via Google: ${user._id}`);
      } catch (saveError) {
        console.error("❌ Error saving new Google user:", saveError);
        throw saveError;
      }
    } else {
      console.log(`✅ Existing user found: ${user._id}`);
      // Ideally check if UserProfile exists for existing users (migration logic), but skipping for now
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET_KEY as string,
      {
        expiresIn: "1d",
      }
    );

    console.log("✅ JWT generated for Google user");

    // Fetch complete profile for response
    const userId = user._id;
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

    res.status(200).json({
      userId: user._id,
      message: "Login successful",
      token: token,
      user: combinedUser,
      isNewUser,
    });
  } catch (error) {
    console.error("❌ Google Login Final Failure:", error);
    res.status(500).json({
      message: "Google login failed",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;

