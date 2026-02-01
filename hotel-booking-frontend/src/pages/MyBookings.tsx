import { useQueryWithLoading } from "../hooks/useLoadingHooks";
import * as apiClient from "../api-client";
import type { BookingType, HotelWithBookingsType } from "../../../shared/types";
import { Badge } from "../components/ui/badge";
import {
  Calendar,
  Users,
  CreditCard,
  Clock,
  MapPin,
  Phone,
  Building,
  Star,
  Package,
  DollarSign,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  FileUp,
  TrendingUp,
} from "lucide-react";
import IdUploadModal from "../components/IdUploadModal";
import { useState } from "react";
import { Button } from "../components/ui/button";

const MyBookings = () => {
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [isIdModalOpen, setIsIdModalOpen] = useState(false);

  const { data: hotels } = useQueryWithLoading<HotelWithBookingsType[]>(
    "fetchMyBookings",
    apiClient.fetchMyBookings,
    {
      loadingMessage: "Loading your bookings...",
    }
  );

  if (!hotels || hotels.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            No Bookings Found
          </h3>
          <p className="text-gray-500">You haven't made any bookings yet.</p>
        </div>
      </div>
    );
  }

  // Calculate booking statistics
  const totalBookings = hotels.reduce(
    (total, hotel) => total + hotel.bookings.length,
    0
  );

  // Count unique hotels by hotel ID
  const uniqueHotelIds = new Set(hotels.map((hotel) => hotel._id));
  const differentHotels = uniqueHotelIds.size;

  // Calculate total spent across all bookings
  const totalSpent = hotels.reduce((total, hotel) => {
    return (
      total +
      hotel.bookings.reduce((hotelTotal, booking) => {
        const checkInDate = new Date(booking.checkIn);
        const checkOutDate = new Date(booking.checkOut);
        const nights = Math.max(
          1,
          Math.ceil(
            (checkOutDate.getTime() - checkInDate.getTime()) /
            (1000 * 60 * 60 * 24)
          )
        );
        return hotelTotal + hotel.pricePerNight * nights;
      }, 0)
    );
  }, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CONFIRMED":
      case "confirmed":
        return "bg-green-100 text-green-800 border-green-200";
      case "ID_PENDING":
      case "pending":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "ID_SUBMITTED":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "REJECTED":
      case "CANCELLED":
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      case "COMPLETED":
      case "completed":
        return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "REFUND_PENDING":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "REFUNDED":
      case "refunded":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "PAYMENT_DONE":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "failed":
        return "bg-red-100 text-red-800 border-red-200";
      case "refunded":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "CONFIRMED":
      case "confirmed":
        return <TrendingUp className="w-4 h-4" />;
      case "ID_PENDING":
      case "ID_SUBMITTED":
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "REJECTED":
      case "CANCELLED":
      case "cancelled":
        return <Building className="w-4 h-4" />;
      case "COMPLETED":
      case "completed":
        return <Star className="w-4 h-4" />;
      case "REFUND_PENDING":
      case "REFUNDED":
      case "refunded":
        return <CreditCard className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="space-y-8">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-white">
          <h1 className="text-4xl font-bold mb-2">My Bookings History</h1>
          <p className="text-blue-100 text-lg">
            Track all your hotel reservations and booking details
          </p>
          <div className="flex items-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              <span className="text-blue-100">
                {totalBookings} Total Bookings
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              <span className="text-blue-100">
                {differentHotels} Different Hotels
              </span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              <span className="text-blue-100">
                ₹{totalSpent.toFixed(2)} Total Spent
              </span>
            </div>
          </div>
        </div>

        {/* Bookings Grid */}
        <div className="grid grid-cols-1 gap-8">
          {hotels.map((hotel, hotelIndex) => (
            <div
              key={`${hotel._id}-${hotelIndex}`}
              className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300"
            >
              {/* Hotel Header */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 border-b border-gray-200">
                <div className="flex items-start gap-6">
                  <div className="relative">
                    <img
                      src={hotel.imageUrls[0]}
                      className="w-24 h-24 rounded-lg object-cover object-center shadow-md"
                      alt={hotel.name}
                    />
                    <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full">
                      {hotel.starRating}★
                    </div>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      {hotel.name}
                    </h2>
                    <div className="flex items-center gap-4 text-gray-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>
                          {hotel.city}, {hotel.country}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Building className="w-4 h-4" />
                        <span>₹{hotel.pricePerNight}/night</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bookings List */}
              <div className="p-6">
                <div className="space-y-6">
                  {hotel.bookings.map((booking: BookingType) => {
                    const checkInDate = new Date(booking.checkIn);
                    const checkOutDate = new Date(booking.checkOut);
                    const createdAt = new Date(
                      booking.createdAt || booking.checkIn
                    );
                    const nights = Math.max(
                      1,
                      Math.ceil(
                        (checkOutDate.getTime() - checkInDate.getTime()) /
                        (1000 * 60 * 60 * 24)
                      )
                    );
                    const totalPrice = hotel.pricePerNight * nights;

                    return (
                      <div
                        key={booking._id}
                        className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl p-6 border border-slate-200 hover:shadow-md transition-shadow duration-200"
                      >
                        {/* Status Header */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`p-2 rounded-lg ${getStatusColor(
                                booking.status || "pending"
                              )}`}
                            >
                              {getStatusIcon(booking.status || "pending")}
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">
                                Booking #{booking._id.slice(-8).toUpperCase()}
                              </h3>
                              <p className="text-sm text-gray-500">
                                Booked on {createdAt.toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Badge
                              className={`${getStatusColor(
                                booking.status || "pending"
                              )} border`}
                            >
                              {getStatusIcon(booking.status || "pending")}
                              <span className="ml-1">
                                {booking.status || "pending"}
                              </span>
                            </Badge>
                            <Badge
                              className={`${getPaymentStatusColor(
                                booking.paymentStatus || "pending"
                              )} border`}
                            >
                              {booking.paymentStatus || "pending"}
                            </Badge>
                            {booking.paymentMethod && (
                              <Badge
                                variant="outline"
                                className="border-gray-300"
                              >
                                {booking.paymentMethod}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Booking Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                          {/* Dates */}
                          <div className="bg-white rounded-lg p-4 border border-gray-200">
                            <div className="flex items-center gap-2 mb-2">
                              <Calendar className="w-4 h-4 text-blue-600" />
                              <span className="font-semibold text-gray-900">
                                Stay Dates
                              </span>
                            </div>
                            <div className="text-sm text-gray-600">
                              <div className="mb-1">
                                <span className="font-medium">Check-in:</span>{" "}
                                {checkInDate.toDateString()}
                              </div>
                              <div>
                                <span className="font-medium">Check-out:</span>{" "}
                                {checkOutDate.toDateString()}
                              </div>
                            </div>
                          </div>

                          {/* Guests */}
                          <div className="bg-white rounded-lg p-4 border border-gray-200">
                            <div className="flex items-center gap-2 mb-2">
                              <Users className="w-4 h-4 text-green-600" />
                              <span className="font-semibold text-gray-900">
                                Guests
                              </span>
                            </div>
                            <div className="text-sm text-gray-600">
                              <div className="mb-1">
                                <span className="font-medium">
                                  {booking.adultCount}
                                </span>{" "}
                                Adults
                              </div>
                              <div>
                                <span className="font-medium">
                                  {booking.childCount}
                                </span>{" "}
                                Children
                              </div>
                            </div>
                          </div>

                          {/* Contact */}
                          <div className="bg-white rounded-lg p-4 border border-gray-200">
                            <div className="flex items-center gap-2 mb-2">
                              <Phone className="w-4 h-4 text-purple-600" />
                              <span className="font-semibold text-gray-900">
                                Contact
                              </span>
                            </div>
                            <div className="text-sm text-gray-600">
                              <div className="mb-1">{booking.email}</div>
                              {booking.phone && <div>{booking.phone}</div>}
                            </div>
                          </div>

                          {/* Pricing */}
                          {totalPrice > 0 && (
                            <div className="bg-white rounded-lg p-4 border border-gray-200">
                              <div className="flex items-center gap-2 mb-2">
                                <CreditCard className="w-4 h-4 text-orange-600" />
                                <span className="font-semibold text-gray-900">
                                  Pricing
                                </span>
                              </div>
                              <div className="text-sm text-gray-600">
                                <div className="mb-1">
                                  <span className="font-medium">{nights}</span>{" "}
                                  Nights
                                </div>
                                <div className="text-lg font-bold text-green-600">
                                  ₹{totalPrice}
                                </div>
                                {/* Only show refund if it exists and is greater than 0 */}
                                {booking.refundAmount !== undefined &&
                                  booking.refundAmount !== null &&
                                  booking.refundAmount > 0 && (
                                    <div className="text-sm text-red-600">
                                      Refund: ₹{booking.refundAmount}
                                    </div>
                                  )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* ID Verification Section */}
                        <div className="mt-6">
                          {booking.status === "ID_PENDING" && (
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                              <div className="flex gap-4">
                                <div className="bg-amber-100 p-3 rounded-full h-fit">
                                  <AlertCircle className="w-6 h-6 text-amber-600" />
                                </div>
                                <div>
                                  <h4 className="text-lg font-bold text-amber-900">ID Verification Required</h4>
                                  <p className="text-amber-700 text-sm">
                                    Your payment is successful, but the hotel owner requires ID proof to confirm your stay.
                                  </p>
                                </div>
                              </div>
                              <Button
                                onClick={() => {
                                  setSelectedBookingId(booking._id);
                                  setIsIdModalOpen(true);
                                }}
                                className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-8 py-6 rounded-xl shadow-lg transition-transform hover:scale-105"
                              >
                                <FileUp className="w-5 h-5 mr-2" />
                                Upload ID Proof Now
                              </Button>
                            </div>
                          )}

                          {booking.status === "ID_SUBMITTED" && (
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 flex items-center gap-4">
                              <div className="bg-blue-100 p-3 rounded-full">
                                <Clock className="w-6 h-6 text-blue-600 animate-pulse" />
                              </div>
                              <div>
                                <h4 className="text-lg font-bold text-blue-900">ID Submitted - Verification Pending</h4>
                                <p className="text-blue-700 text-sm">
                                  The hotel owner is currently reviewing your documents. You'll be notified once confirmed.
                                </p>
                              </div>
                            </div>
                          )}

                          {booking.status === "CONFIRMED" && (
                            <div className="bg-green-50 border border-green-200 rounded-xl p-6 flex items-center gap-4">
                              <div className="bg-green-100 p-3 rounded-full">
                                <CheckCircle2 className="w-6 h-6 text-green-600" />
                              </div>
                              <div>
                                <h4 className="text-lg font-bold text-green-900">Booking Confirmed 🎉</h4>
                                <p className="text-green-700 text-sm">
                                  Your stay is officially confirmed! We look forward to seeing you.
                                </p>
                              </div>
                            </div>
                          )}

                          {booking.status === "REJECTED" && (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-center gap-4">
                              <div className="bg-red-100 p-3 rounded-full">
                                <AlertCircle className="w-6 h-6 text-red-600" />
                              </div>
                              <div>
                                <h4 className="text-lg font-bold text-red-900">Booking Declined</h4>
                                <p className="text-red-700 text-sm">
                                  Reason: {booking.rejectionReason || "Invalid document details"}.
                                  A full refund of ₹{booking.totalCost} has been initiated automatically.
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Special Requests & Cancellation */}
                        {(booking.specialRequests ||
                          booking.cancellationReason) && (
                            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                              {booking.specialRequests && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                  <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                                    <Package className="w-4 h-4" />
                                    Special Requests
                                  </h4>
                                  <p className="text-blue-700 text-sm">
                                    {booking.specialRequests}
                                  </p>
                                </div>
                              )}
                              {booking.cancellationReason && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                  <h4 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                                    <Building className="w-4 h-4" />
                                    Cancellation Reason
                                  </h4>
                                  <p className="text-red-700 text-sm">
                                    {booking.cancellationReason}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <IdUploadModal
        bookingId={selectedBookingId || ""}
        isOpen={isIdModalOpen}
        onClose={() => {
          setIsIdModalOpen(false);
          setSelectedBookingId(null);
        }}
      />
    </div>
  );
};

export default MyBookings;
