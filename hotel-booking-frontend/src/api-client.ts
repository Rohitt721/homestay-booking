import axiosInstance from "./lib/api-client";
import { RegisterFormData } from "./pages/Register";
import { SignInFormData } from "./pages/SignIn";
import {
  HotelSearchResponse,
  HotelType,
  UserType,
  HotelWithBookingsType,
  BookingType,
  SubscriptionType,
} from "../../shared/types";
import { queryClient } from "./main";

export const fetchCurrentUser = async (): Promise<UserType> => {
  const response = await axiosInstance.get("/api/users/me");
  return response.data;
};

export const updateUserProfile = async (formData: FormData): Promise<UserType> => {
  const response = await axiosInstance.put("/api/profile", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const sendOTP = async (email: string) => {
  const response = await axiosInstance.post("/api/users/send-otp", { email });
  return response.data;
};

export const verifyOTP = async (email: string, otp: string) => {
  const response = await axiosInstance.post("/api/users/verify-otp", { email, otp });
  return response.data;
};

export const register = async (formData: RegisterFormData & { otpToken: string }) => {
  const response = await axiosInstance.post("/api/users/register", formData);
  return response.data;
};

export const signIn = async (formData: SignInFormData) => {
  const response = await axiosInstance.post("/api/auth/login", formData);

  // Store JWT token from response body in localStorage
  const token = response.data?.token;
  if (token) {
    localStorage.setItem("session_id", token);
    console.log("JWT token stored in localStorage for incognito compatibility");
  }

  // Store user info for incognito mode fallback
  if (response.data?.userId) {
    localStorage.setItem("user_id", response.data.userId);
    console.log("User ID stored for incognito mode fallback");
  }

  // Force validate token after successful login to update React Query cache
  try {
    const validationResult = await validateToken();
    console.log("Token validation after login:", validationResult);

    // Invalidate and refetch the validateToken query to update the UI
    queryClient.invalidateQueries("validateToken");

    // Force a refetch to ensure the UI updates
    await queryClient.refetchQueries("validateToken");
  } catch (error) {
    console.log("Token validation failed after login, but continuing...");

    // Even if validation fails, if we have a token stored, consider it a success for incognito mode
    if (localStorage.getItem("session_id")) {
      console.log("Incognito mode detected - using stored token as fallback");
    }
  }

  return response.data;
};

export const googleSignIn = async (idToken: string, role?: string) => {
  console.log("🔵 Sending Google ID token to backend...");
  try {
    const response = await axiosInstance.post("/api/auth/google-login", {
      idToken,
      role,
    });

    // Store JWT token from response body in localStorage
    const token = response.data?.token;
    if (token) {
      localStorage.setItem("session_id", token);
      console.log("✅ Google JWT token stored in localStorage");
    }

    // Store user info for incognito mode fallback
    if (response.data?.userId) {
      localStorage.setItem("user_id", response.data.userId);
    }

    // Force validate token after successful login to update React Query cache
    try {
      console.log("🔵 Validating fresh Google session...");
      await validateToken();
      queryClient.invalidateQueries("validateToken");
      await queryClient.refetchQueries("validateToken");
      console.log("✅ Token validation successful after Google login");
    } catch (error) {
      console.warn(
        "⚠️ Token validation failed after Google login, but session is likely active:",
        error
      );
    }

    return response.data;
  } catch (error: any) {
    console.error(
      "❌ Google SignIn API Call Failed:",
      error.response?.data || error.message
    );
    throw new Error(error.response?.data?.message || "Google login failed");
  }
};

export const validateToken = async () => {
  try {
    const response = await axiosInstance.get("/api/auth/validate-token");
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 401) {
      // Not logged in, throw error so React Query knows it failed
      throw new Error("Token invalid");
    }
    // For any other error (network, etc.), also throw
    throw new Error("Token validation failed");
  }
};

export const signOut = async () => {
  const response = await axiosInstance.post("/api/auth/logout");

  // Clear localStorage (JWT tokens)
  localStorage.removeItem("session_id");
  localStorage.removeItem("user_id");

  return response.data;
};

// Development utility to clear all browser storage
export const clearAllStorage = () => {
  // Clear localStorage
  localStorage.clear();
  // Clear sessionStorage
  sessionStorage.clear();
  // Clear cookies (by setting them to expire in the past)
  document.cookie.split(";").forEach((c) => {
    document.cookie = c
      .replace(/^ +/, "")
      .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
  });
};

export const addMyHotel = async (hotelFormData: FormData) => {
  const response = await axiosInstance.post("/api/my-hotels", hotelFormData);
  return response.data;
};

export const fetchMyHotels = async (): Promise<HotelType[]> => {
  const response = await axiosInstance.get("/api/my-hotels");
  return response.data;
};

export const fetchMyGuests = async (): Promise<any[]> => {
  const response = await axiosInstance.get("/api/my-hotels/guests");
  return response.data;
};

export const fetchMyHotelById = async (hotelId: string): Promise<HotelType> => {
  const response = await axiosInstance.get(`/api/my-hotels/${hotelId}`);
  return response.data;
};

export const updateMyHotelById = async (hotelFormData: FormData) => {
  const hotelId = hotelFormData.get("hotelId");
  const response = await axiosInstance.put(
    `/api/my-hotels/${hotelId}`,
    hotelFormData
  );
  return response.data;
};

export type SearchParams = {
  destination?: string;
  checkIn?: string;
  checkOut?: string;
  adultCount?: string;
  childCount?: string;
  page?: string;
  facilities?: string[];
  types?: string[];
  stars?: string[];
  maxPrice?: string;
  sortOption?: string;
};

export const searchHotels = async (
  searchParams: SearchParams
): Promise<HotelSearchResponse> => {
  const queryParams = new URLSearchParams();

  // Only add destination if it's not empty
  if (searchParams.destination && searchParams.destination.trim() !== "") {
    queryParams.append("destination", searchParams.destination.trim());
  }

  queryParams.append("checkIn", searchParams.checkIn || "");
  queryParams.append("checkOut", searchParams.checkOut || "");
  queryParams.append("adultCount", searchParams.adultCount || "");
  queryParams.append("childCount", searchParams.childCount || "");
  queryParams.append("page", searchParams.page || "");
  queryParams.append("maxPrice", searchParams.maxPrice || "");
  queryParams.append("sortOption", searchParams.sortOption || "");

  searchParams.facilities?.forEach((facility) =>
    queryParams.append("facilities", facility)
  );

  searchParams.types?.forEach((type) => queryParams.append("types", type));
  searchParams.stars?.forEach((star) => queryParams.append("stars", star));

  const response = await axiosInstance.get(`/api/hotels/search?${queryParams}`);
  return response.data;
};

export const fetchHotels = async (): Promise<HotelType[]> => {
  const response = await axiosInstance.get("/api/hotels");
  return response.data;
};

export const fetchHotelById = async (hotelId: string): Promise<HotelType> => {
  const response = await axiosInstance.get(`/api/hotels/${hotelId}`);
  return response.data;
};

export const fetchHotelAvailability = async (
  hotelId: string
): Promise<{ checkIn: string; checkOut: string }[]> => {
  const response = await axiosInstance.get(`/api/hotels/${hotelId}/availability`);
  return response.data;
};

export const createRoomBooking = async (
  hotelId: string,
  formData: any
) => {
  const response = await axiosInstance.post(
    `/api/hotels/${hotelId}/bookings`,
    formData
  );
  return response.data;
};

export const fetchMyBookings = async (): Promise<HotelWithBookingsType[]> => {
  const response = await axiosInstance.get("/api/my-bookings");
  return response.data;
};

export const fetchHotelBookings = async (
  hotelId: string
): Promise<BookingType[]> => {
  const response = await axiosInstance.get(`/api/bookings/hotel/${hotelId}`);
  return response.data;
};

// Business Insights API functions
export const fetchBusinessInsightsDashboard = async () => {
  const response = await axiosInstance.get("/api/business-insights/dashboard");
  return response.data;
};

export const fetchBusinessInsightsForecast = async () => {
  const response = await axiosInstance.get("/api/business-insights/forecast");
  return response.data;
};



export const fetchSubscriptionStatus = async (): Promise<SubscriptionType | null> => {
  const response = await axiosInstance.get("/api/subscriptions/status");
  return response.data;
};

export const subscribeToPlan = async (plan: "MONTHLY" | "YEARLY"): Promise<SubscriptionType> => {
  const response = await axiosInstance.post("/api/subscriptions/subscribe", { plan });
  return response.data;
};

export const publishHotel = async (hotelId: string) => {
  const response = await axiosInstance.post(`/api/my-hotels/${hotelId}/publish`);
  return response.data;
};

export const uploadBookingId = async (bookingId: string, formData: FormData) => {
  const response = await axiosInstance.post(
    `/api/my-bookings/${bookingId}/upload-id`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
};

export const verifyBookingId = async (
  bookingId: string,
  action: "approve" | "reject",
  rejectionReason?: string
) => {
  const response = await axiosInstance.patch(`/api/bookings/${bookingId}/verify-id`, {
    action,
    rejectionReason,
  });
  return response.data;
};

export const cancelBooking = async (bookingId: string, reason?: string) => {
  const response = await axiosInstance.post(`/api/my-bookings/${bookingId}/cancel`, {
    reason,
  });
  return response.data;
};

export const fetchVerificationStatus = async () => {
  const response = await axiosInstance.get("/api/verification/status");
  return response.data;
};

export const uploadVerificationDocuments = async (formData: FormData) => {
  const response = await axiosInstance.post("/api/verification/upload", formData);
  return response.data;
};

export const fetchPendingVerifications = async () => {
  const response = await axiosInstance.get("/api/admin/verifications");
  return response.data;
};

export const updateVerificationStatus = async (userId: string, status: "VERIFIED" | "REJECTED", rejectionReason?: string) => {
  const response = await axiosInstance.post(`/api/admin/verifications/${userId}/status`, {
    status,
    rejectionReason
  });
  return response.data;
};

export const fetchAdminStats = async () => {
  const response = await axiosInstance.get("/api/admin/stats");
  return response.data;
};

export const fetchAllUsers = async () => {
  const response = await axiosInstance.get("/api/admin/users");
  return response.data;
};

export const fetchAllHotels = async () => {
  const response = await axiosInstance.get("/api/admin/hotels");
  return response.data;
};
export const fetchAllSubscriptions = async () => {
  const response = await axiosInstance.get("/api/admin/subscriptions");
  return response.data;
};

export const fetchHotelRankings = async () => {
  const response = await axiosInstance.get("/api/rankings/hotels");
  return response.data;
};

export const fetchOwnerRankings = async () => {
  const response = await axiosInstance.get("/api/rankings/owners");
  return response.data;
};

export const submitReview = async (reviewData: any) => {
  const response = await axiosInstance.post("/api/reviews", reviewData);
  return response.data;
};

export const fetchMessages = async (bookingId: string) => {
  const response = await axiosInstance.get(`/api/messages/${bookingId}`);
  return response.data;
};

export const sendMessage = async (messageData: { bookingId: string; content: string; senderRole: string; senderName: string }) => {
  const response = await axiosInstance.post("/api/messages", messageData);
  return response.data;
};

export const fetchOwnerChats = async () => {
  const response = await axiosInstance.get("/api/messages/owner/chats");
  return response.data;
};

// Reports API functions
export const fetchAllReports = async () => {
  const response = await axiosInstance.get("/api/reports");
  return response.data;
};

export const updateReportStatus = async (reportId: string, status: "Open" | "In Review" | "Resolved") => {
  const response = await axiosInstance.put(`/api/reports/${reportId}/status`, { status });
  return response.data;
};

export const submitReport = async (reportData: FormData) => {
  const response = await axiosInstance.post("/api/reports", reportData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

// ============ Trip Planner APIs ============

export interface TripPlanInput {
  destination: string;
  startDate: string;
  duration: number;
  travelStyle: "adventure" | "cultural" | "relaxation" | "food" | "mixed";
  budget: "budget" | "moderate" | "luxury";
  mustVisitPlaces?: string[];
}

export interface DayActivity {
  time: string;
  activity: string;
  location: string;
  description: string;
}

export interface HotelRecommendation {
  hotelId: string;
  name: string;
  pricePerNight: number;
  starRating: number;
  distance?: string;
  availabilityStatus: "available" | "limited" | "unavailable";
  imageUrl?: string;
  city: string;
}

export interface DayPlan {
  day: number;
  date: string;
  activities: DayActivity[];
  areaName: string;
  hotels: HotelRecommendation[];
  fallbackMessage?: string;
}

export interface TripPlan {
  destination: string;
  startDate: string;
  endDate: string;
  duration: number;
  travelStyle: string;
  budget: string;
  days: DayPlan[];
  summary: string;
}

export interface TravelStyle {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface BudgetOption {
  id: string;
  name: string;
  description: string;
  priceRange: string;
  icon: string;
}

export const generateTripPlan = async (input: TripPlanInput): Promise<TripPlan> => {
  const response = await axiosInstance.post("/api/trip-planner/generate", input);
  return response.data;
};

export const getTravelStyles = async (): Promise<TravelStyle[]> => {
  const response = await axiosInstance.get("/api/trip-planner/travel-styles");
  return response.data;
};

export const getBudgetOptions = async (): Promise<BudgetOption[]> => {
  const response = await axiosInstance.get("/api/trip-planner/budget-options");
  return response.data;
};

export const getAlternateHotels = async (
  destination: string,
  checkIn: string,
  checkOut: string,
  budget: string
): Promise<{ hotels: HotelRecommendation[] }> => {
  const response = await axiosInstance.post("/api/trip-planner/alternate-hotels", {
    destination,
    checkIn,
    checkOut,
    budget,
  });
  return response.data;
};

