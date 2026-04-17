import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { UserType } from "../types";

const verificationDocumentSchema = new mongoose.Schema({
  url: { type: String, required: true },
  documentType: { type: String },
  name: { type: String },
  uploadedAt: { type: Date, default: Date.now },
});

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String },
    // Names moved to UserProfile
    // role remains here for auth logic
    role: {
      type: String,
      enum: ["user", "admin", "hotel_owner"],
      default: "user",
    },
    // Analytics and tracking fields
    totalBookings: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    lastLogin: { type: Date },
    isActive: { type: Boolean, default: true },
    emailVerified: { type: Boolean, default: false },
    onboardingCompleted: { type: Boolean, default: false },
    // Verification documents for identity verification
    verification: {
      status: {
        type: String,
        enum: ["PENDING", "SUBMITTED", "VERIFIED", "REJECTED"],
        default: "PENDING",
      },
      documents: [verificationDocumentSchema],
      aadhaarNumber: { type: String },
      selfieUrl: { type: String },
      confidenceScore: { type: Number, min: 0, max: 100 },
      ocrExtractedName: { type: String },
      ocrExtractedNumber: { type: String },
      verificationChecks: {
        verhoeffValid: { type: Boolean },
        ocrNumberMatch: { type: Boolean },
        ocrNameMatch: { type: Boolean },
        ocrKeywordsFound: { type: Boolean },
        duplicateCheck: { type: Boolean },
        imageQuality: { type: Boolean },
      },
      rejectionReason: { type: String },
    },
    // Profile data moved to UserProfile / OwnerProfile
    // Audit fields
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  if (this.isModified("password") && this.password) {
    this.password = await bcrypt.hash(this.password, 8);
  }
  next();
});

const User = mongoose.model<UserType>("User", userSchema);

export default User;
