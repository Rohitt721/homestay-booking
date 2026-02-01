export type UserType = {
  _id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: "user" | "admin" | "hotel_owner";
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
  preferences?: {
    preferredDestinations: string[];
    preferredHotelTypes: string[];
    budgetRange: {
      min: number;
      max: number;
    };
  };
  totalBookings?: number;
  totalSpent?: number;
  lastLogin?: Date;
  isActive?: boolean;
  emailVerified?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  verification?: {
    status: "PENDING" | "SUBMITTED" | "VERIFIED" | "REJECTED";
    documents?: {
      url: string;
      documentType?: string;
      name?: string;
      uploadedAt: Date;
    }[];
    rejectionReason?: string;
  };
};

export type HotelStatus = "DRAFT" | "PUBLISHED" | "BLOCKED";

export type HotelType = {
  _id: string;
  userId: string;
  name: string;
  city: string;
  country: string;
  description: string;
  type: string[];
  adultCount: number;
  childCount: number;
  facilities: string[];
  pricePerNight: number;
  pricePerHour?: number;
  starRating: number;
  imageUrls: string[];
  lastUpdated: Date;
  status: HotelStatus;
  // Remove embedded bookings - using separate collection now
  // bookings: BookingType[];
  // ... rest remains mostly similar but I'll update the whole block for safety
  location?: {
    latitude: number;
    longitude: number;
    address: {
      street: string;
      city: string;
      state: string;
      country: string;
      zipCode: string;
    };
  };
  contact?: {
    phone: string;
    email: string;
    website: string;
  };
  policies?: {
    checkInTime: string;
    checkOutTime: string;
    cancellationPolicy: string;
    petPolicy: string;
    smokingPolicy: string;
  };
  amenities?: {
    parking: boolean;
    wifi: boolean;
    pool: boolean;
    gym: boolean;
    spa: boolean;
    restaurant: boolean;
    bar: boolean;
    airportShuttle: boolean;
    businessCenter: boolean;
  };
  totalBookings?: number;
  totalRevenue?: number;
  averageRating?: number;
  reviewCount?: number;
  occupancyRate?: number;
  isActive?: boolean;
  isFeatured?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};

export type SubscriptionPlan = "MONTHLY" | "YEARLY";
export type SubscriptionStatus = "ACTIVE" | "EXPIRED";

export type SubscriptionType = {
  _id: string;
  userId: string;
  plan: SubscriptionPlan;
  startDate: Date;
  endDate: Date;
  status: SubscriptionStatus;
  createdAt?: Date;
  updatedAt?: Date;
};

export type BookingStatus =
  | "PAYMENT_DONE"
  | "ID_PENDING"
  | "ID_SUBMITTED"
  | "CONFIRMED"
  | "COMPLETED"
  | "REJECTED"
  | "CANCELLED"
  | "REFUND_PENDING"
  | "REFUNDED";

export type IdType = "Aadhaar" | "Passport" | "Driving License" | "Voter ID";

export type BookingType = {
  _id: string;
  userId: string;
  hotelId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  adultCount: number;
  childCount: number;
  checkIn: Date;
  checkOut: Date;
  totalCost: number;
  status: BookingStatus;
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  paymentMethod?: string;
  specialRequests?: string;
  cancellationReason?: string;
  rejectionReason?: string;
  refundAmount?: number;
  idProof?: {
    idType: IdType;
    frontImage: string;
    backImage?: string;
    status: "PENDING" | "SUBMITTED" | "VERIFIED" | "REJECTED";
    uploadedAt?: Date;
    verifiedAt?: Date;
  };
  createdAt?: Date;
  updatedAt?: Date;
};

export type HotelWithBookingsType = HotelType & {
  bookings: BookingType[];
};

export type HotelSearchResponse = {
  data: HotelType[];
  pagination: {
    total: number;
    page: number;
    pages: number;
  };
};

export type PaymentIntentResponse = {
  paymentIntentId: string;
  clientSecret: string;
  totalCost: number;
};

// Report Types
export type ReportStatus = "Open" | "In Review" | "Resolved";
export type BookingState = "future" | "ongoing" | "past";

export type ReportType = {
  _id: string;
  bookingId: string;
  bookingStatus: string;
  userId: string;
  hotelId: string;
  ownerId: string;
  reason: string;
  subReason?: string;
  message: string;
  evidenceUrls?: string[];
  status: ReportStatus;
  createdAt: Date;
  updatedAt: Date;
};

// Report Reasons - Comprehensive list based on booking state
export const REPORT_REASONS = {
  // Universal reasons apply to all booking states
  UNIVERSAL: [
    { reason: "Incorrect booking details", subReasons: ["Wrong room type"] },
    { reason: "Payment-related issue", subReasons: ["Refund not received"] },
    { reason: "Owner / hotel unresponsive", subReasons: ["No reply to messages", "Calls/messages ignored"] },
    { reason: "Policy or rule violation", subReasons: ["Hidden rules", "Different rules than shown on listing"] },
    { reason: "Suspicious or fraudulent activity", subReasons: ["Fake listing", "Asking for off-platform payment", "Fake confirmation"] },
    { reason: "Other" },
  ],
  // Future booking specific - booking hasn't started yet
  FUTURE: [
    { reason: "Owner asking to cancel without reason" },
    { reason: "Hotel unavailable after confirmation" },
    { reason: "Forced upgrade / extra charges requested" },
    { reason: "Booking confirmation mismatch" },
  ],
  // Ongoing booking specific - currently checked in
  ONGOING: [
    { reason: "Room not as described" },
    { reason: "Cleanliness / hygiene issue" },
    { reason: "Amenities not provided" },
    { reason: "Staff misbehavior" },
    { reason: "Safety or security concern" },
    { reason: "Noise / disturbance issue" },
  ],
  // Past booking specific - stay completed
  PAST: [
    { reason: "Refund not processed" },
    { reason: "Overcharged during stay" },
    { reason: "Property condition mismatch" },
    { reason: "Misleading photos or description" },
  ],
};
