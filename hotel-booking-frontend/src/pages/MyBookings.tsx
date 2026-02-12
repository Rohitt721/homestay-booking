import * as apiClient from "../api-client";
import type { BookingType, HotelWithBookingsType } from "../../../shared/types";
import {
  Calendar,
  Users,
  Clock,
  MapPin,
  Building,
  Star,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  History as HistoryIcon,
  PlaneTakeoff,
  LayoutDashboard,
  Gem,
  ArrowRight,
  MessageSquare,
  AlertTriangle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import ReviewModal from "../components/ReviewModal";
import ChatModal from "../components/ChatModal";
import ReportModal from "../components/ReportModal";
import { useState, useMemo } from "react";
import { Button } from "../components/ui/button";
import useAppContext from "../hooks/useAppContext";
import { useNavigate } from "react-router-dom";
import { Badge } from "../components/ui/badge";
import { useQuery } from "react-query";

const MyBookings = () => {
  const { showToast } = useAppContext();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");

  // Review modal state
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewBookingData, setReviewBookingData] = useState<{
    id: string;
    hotelId: string;
    hotelName: string;
  } | null>(null);

  // Chat Modal State
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [chatBookingData, setChatBookingData] = useState<{
    id: string;
    hotelName: string;
    ownerName: string;
  } | null>(null);

  // Report Modal State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportBookingData, setReportBookingData] = useState<{
    booking: BookingType;
    hotelName: string;
    hotelId: string;
    ownerId: string;
  } | null>(null);

  const { data: hotels, isLoading, isError, error, refetch } = useQuery(
    "fetchMyBookings",
    apiClient.fetchMyBookings
  );

  const handleCancelBooking = async (bookingId: string) => {
    if (window.confirm("Are you sure you want to cancel this booking?")) {
      try {
        await apiClient.cancelBooking(bookingId);
        showToast({ title: "Booking Cancelled", description: "Your booking has been successfully cancelled.", type: "SUCCESS" });
        refetch();
      } catch (error: any) {
        showToast({ title: "Cancellation Failed", description: error.message || "An error occurred", type: "ERROR" });
      }
    }
  };

  // Process and sort all bookings
  const { upcomingBookings, pastBookings, stats } = useMemo(() => {
    if (!hotels) return { upcomingBookings: [], pastBookings: [], stats: { total: 0, spent: 0, hotels: 0, nights: 0 } };

    const allBookings: { hotel: HotelWithBookingsType; booking: BookingType }[] = [];
    let totalSpent = 0;
    let totalNights = 0;

    hotels.forEach(hotel => {
      hotel.bookings.forEach(booking => {
        allBookings.push({ hotel, booking });

        const checkIn = new Date(booking.checkIn);
        const checkOut = new Date(booking.checkOut);
        const nights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));

        totalSpent += hotel.pricePerNight * nights;
        totalNights += nights;
      });
    });

    const now = new Date();
    const upcoming = allBookings
      .filter(({ booking }) => new Date(booking.checkOut) >= now)
      .sort((a, b) => new Date(a.booking.checkIn).getTime() - new Date(b.booking.checkIn).getTime());

    const past = allBookings
      .filter(({ booking }) => new Date(booking.checkOut) < now)
      .sort((a, b) => new Date(b.booking.checkIn).getTime() - new Date(a.booking.checkIn).getTime());

    return {
      upcomingBookings: upcoming,
      pastBookings: past,
      stats: {
        total: allBookings.length,
        spent: totalSpent,
        hotels: hotels.length,
        nights: totalNights
      }
    };
  }, [hotels]);

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
        <div className="bg-red-50 p-8 rounded-3xl shadow-lg text-center max-w-md border border-red-100">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-red-900 mb-2">Oops! Something went wrong</h3>
          <p className="text-red-600 mb-6">{(error as Error).message || "We couldn't load your bookings. Please try again."}</p>
          <Button onClick={() => refetch()} className="bg-red-600 hover:bg-red-700 text-white">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!hotels || hotels.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
        <div className="bg-white p-12 rounded-3xl shadow-xl text-center max-w-md border border-gray-100 animate-in fade-in zoom-in duration-500">
          <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <PlaneTakeoff className="w-12 h-12 text-gray-300" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">No Adventures Yet?</h3>
          <p className="text-gray-500 mb-8 leading-relaxed">
            Your travel history is empty. Start exploring thousands of beautiful hotels and book your next stay!
          </p>
          <Button
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-6 rounded-2xl font-bold transition-all hover:scale-105"
            onClick={() => navigate("/")}
          >
            Explore Hotels
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CONFIRMED": return "from-green-500/10 to-emerald-500/10 text-emerald-700 border-emerald-200/50";
      case "CANCELLED":
      case "REJECTED": return "from-rose-500/10 to-red-500/10 text-rose-700 border-rose-200/50";
      case "COMPLETED": return "from-indigo-500/10 to-violet-500/10 text-indigo-700 border-indigo-200/50";
      default: return "from-gray-500/10 to-slate-500/10 text-slate-700 border-slate-200/50";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "CONFIRMED": return <CheckCircle2 className="w-4 h-4" />;
      case "COMPLETED": return <Gem className="w-4 h-4" />;
      case "CANCELLED":
      case "REJECTED": return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const BookingCard = ({ hotel, booking }: { hotel: HotelWithBookingsType, booking: BookingType }) => {
    const checkIn = new Date(booking.checkIn);
    const checkOut = new Date(booking.checkOut);
    const nights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));
    const isPast = new Date(booking.checkOut) < new Date();

    return (
      <div className="bg-white rounded-3xl shadow-sm hover:shadow-xl transition-all duration-500 border border-gray-100 overflow-hidden group">
        <div className="flex flex-col lg:flex-row">
          {/* Hotel Image Section */}
          <div className="lg:w-72 h-56 lg:h-auto relative overflow-hidden">
            <img
              src={hotel.imageUrls?.[0] || ""}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              alt={hotel.name}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
            <div className="absolute top-4 left-4">
              <Badge className={`bg-white/90 backdrop-blur-md text-gray-900 border-none shadow-sm rounded-full px-3 py-1 font-bold flex items-center gap-1`}>
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                {hotel.starRating}
              </Badge>
            </div>
          </div>

          {/* Content Section */}
          <div className="flex-1 p-6 lg:p-8 flex flex-col">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors">
                  {hotel.name}
                </h3>
                <div className="flex items-center text-gray-500 text-sm">
                  <MapPin className="w-4 h-4 mr-1 text-indigo-500" />
                  {hotel.city}, {hotel.country}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge className={`bg-gradient-to-r shadow-sm border ${getStatusColor(booking.status)} px-3 py-1.5 rounded-full font-semibold flex items-center gap-2`}>
                  {getStatusIcon(booking.status)}
                  {booking.status}
                </Badge>
                <p className="text-xs text-gray-400 font-medium tracking-wider uppercase">
                  #{booking._id.slice(-8).toUpperCase()}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8 bg-gray-50/50 rounded-2xl p-5 border border-gray-100/50">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Check-In</p>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-500" />
                  <span className="font-bold text-gray-700">{checkIn.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Stay</p>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-500" />
                  <span className="font-bold text-gray-700">{nights} {nights === 1 ? 'Night' : 'Nights'}</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Guests</p>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-500" />
                  <span className="font-bold text-gray-700">{booking.adultCount + booking.childCount} Total</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Amount</p>
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-green-100 rounded text-green-700">
                    <DollarSign className="w-3 h-3" />
                  </div>
                  <span className="font-bold text-green-600 text-lg">₹{booking.totalCost}</span>
                </div>
              </div>
            </div>

            <div className="mt-auto flex flex-col md:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-100">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex -space-x-2">
                    {[...Array(Math.min(3, booking.adultCount))].map((_, i) => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                        {booking.firstName?.[0] || "?"}
                      </div>
                    ))}
                  </div>
                  <span className="text-gray-500 font-medium">{booking.firstName || "Unknown"} {booking.lastName || ""}</span>
                </div>
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1.5 bg-emerald-50 px-2 py-1 rounded-lg w-fit">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verified Identity Linked
                </span>
              </div>

              <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
                {isPast && booking.status === "COMPLETED" && (
                  <Button
                    onClick={() => {
                      setReviewBookingData({
                        id: booking._id,
                        hotelId: hotel._id,
                        hotelName: hotel.name
                      });
                      setIsReviewModalOpen(true);
                    }}
                    className="flex-1 md:flex-none border-indigo-200 text-indigo-700 hover:bg-indigo-50 rounded-xl px-6 py-5 font-bold flex items-center gap-2"
                    variant="outline"
                  >
                    <Star className="w-4 h-4" />
                    Rate Stay
                  </Button>
                )}

                {!isPast && ["CONFIRMED", "PAYMENT_DONE"].includes(booking.status) && (
                  <Button
                    onClick={() => {
                      setChatBookingData({
                        id: booking._id,
                        hotelName: hotel.name,
                        ownerName: "Hotel Host"
                      });
                      setIsChatModalOpen(true);
                    }}
                    className="flex-1 md:flex-none border-indigo-200 text-indigo-700 hover:bg-indigo-50 rounded-xl px-6 py-5 font-bold flex items-center gap-2"
                    variant="outline"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Chat
                  </Button>
                )}

                {!isPast && !["CANCELLED", "REJECTED", "COMPLETED", "REFUNDED"].includes(booking.status) && (
                  <Button
                    variant="outline"
                    className="flex-1 md:flex-none border-red-200 text-red-600 hover:bg-red-50 rounded-xl px-6 py-5 font-bold"
                    onClick={() => handleCancelBooking(booking._id)}
                  >
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                )}

                <Button
                  variant="outline"
                  className="flex-1 md:flex-none border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl px-6 py-5 font-bold"
                  onClick={() => {
                    setReportBookingData({
                      booking: booking,
                      hotelName: hotel.name,
                      hotelId: hotel._id,
                      ownerId: hotel.userId,
                    });
                    setIsReportModalOpen(true);
                  }}
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Report
                </Button>

                <Button
                  variant="outline"
                  className="flex-1 md:flex-none border-gray-200 hover:bg-gray-50 rounded-xl px-6 py-5 font-bold"
                  onClick={() => navigate(`/detail/${hotel._id}`)}
                >
                  View Hotel
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="space-y-12">
        {/* Modern Stats Header */}
        <div className="relative overflow-hidden rounded-[2.5rem] bg-indigo-900 border border-indigo-800 shadow-2xl">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-indigo-500 rounded-full blur-[100px] opacity-20" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-60 h-60 bg-purple-500 rounded-full blur-[100px] opacity-20" />

          <div className="relative p-8 lg:p-12">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-12">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-widest mb-4 border border-indigo-500/20">
                  <LayoutDashboard className="w-3 h-3" />
                  Traveler Dashboard
                </div>
                <h1 className="text-4xl lg:text-5xl font-black text-white mb-3 tracking-tight">
                  Welcome Back, Adventure Awaits!
                </h1>
                <p className="text-indigo-200 text-lg max-w-xl leading-relaxed">
                  Manage your recent trips, track upcoming stays, and share feedback on your favorite destinations.
                </p>
                <div className="flex flex-wrap gap-4 mt-8">
                  <Button
                    onClick={() => navigate("/trip-planner")}
                    className="bg-white text-indigo-900 hover:bg-indigo-50 px-8 py-6 rounded-2xl font-black transition-all hover:scale-105 shadow-xl flex items-center gap-3"
                  >
                    <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse" />
                    AI Trip Planner
                  </Button>
                  <Button
                    onClick={() => navigate("/")}
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10 px-8 py-6 rounded-2xl font-bold transition-all"
                  >
                    Find Hotels
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-2 gap-4">
                {[
                  { icon: Building, label: "Total Stays", value: stats.total, color: "bg-blue-500" },
                  { icon: Calendar, label: "Total Nights", value: stats.nights, color: "bg-emerald-500" },
                  { icon: DollarSign, label: "Total Invested", value: `₹${stats.spent.toLocaleString()}`, color: "bg-amber-500" },
                  { icon: Gem, label: "Happy Experiences", value: stats.total, color: "bg-purple-500" },
                ].map((stat, i) => (
                  <div key={i} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex items-center gap-4 transition-transform hover:scale-105 duration-300">
                    <div className={`${stat.color} p-2 rounded-xl text-white shadow-lg`}>
                      <stat.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-indigo-400 text-[10px] font-bold uppercase tracking-wider">{stat.label}</p>
                      <p className="text-white text-xl font-black">{stat.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tabbed Navigation */}
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 border-b border-gray-100 pb-1">
            <div className="flex bg-gray-100/80 p-1 rounded-2xl border border-gray-200/50 backdrop-blur-sm">
              <button
                onClick={() => setActiveTab("upcoming")}
                className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${activeTab === "upcoming"
                  ? "bg-white text-indigo-600 shadow-lg shadow-gray-200"
                  : "text-gray-500 hover:text-gray-900"
                  }`}
              >
                <PlaneTakeoff className={`w-4 h-4 ${activeTab === "upcoming" ? "animate-bounce" : ""}`} />
                Upcoming Stays
                <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] ${activeTab === "upcoming" ? "bg-indigo-100 text-indigo-600" : "bg-gray-200 text-gray-500"}`}>
                  {upcomingBookings.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab("past")}
                className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${activeTab === "past"
                  ? "bg-white text-indigo-600 shadow-lg shadow-gray-200"
                  : "text-gray-500 hover:text-gray-900"
                  }`}
              >
                <HistoryIcon className="w-4 h-4" />
                Travel History
                <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] ${activeTab === "past" ? "bg-indigo-100 text-indigo-600" : "bg-gray-200 text-gray-500"}`}>
                  {pastBookings.length}
                </span>
              </button>
            </div>

            <div className="flex items-center gap-2 text-sm font-medium text-gray-400">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
              Showing {activeTab === "upcoming" ? "active and future" : "completed"} reservations
            </div>
          </div>

          {/* Bookings Display */}
          <div className="grid grid-cols-1 gap-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
            {activeTab === "upcoming" ? (
              upcomingBookings.length > 0 ? (
                upcomingBookings.map(({ hotel, booking }, i) => (
                  <BookingCard key={`${booking._id}-${i}`} hotel={hotel} booking={booking} />
                ))
              ) : (
                <div className="text-center py-20 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <PlaneTakeoff className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-gray-400 font-bold">No upcoming bookings found.</p>
                </div>
              )
            ) : (
              pastBookings.length > 0 ? (
                pastBookings.map(({ hotel, booking }, i) => (
                  <BookingCard key={`${booking._id}-${i}`} hotel={hotel} booking={booking} />
                ))
              ) : (
                <div className="text-center py-20 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <HistoryIcon className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-gray-400 font-bold">No travel history available.</p>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {isReviewModalOpen && reviewBookingData && (
        <ReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => {
            setIsReviewModalOpen(false);
            setReviewBookingData(null);
            setTimeout(refetch, 500);
          }}
          bookingId={reviewBookingData.id}
          hotelId={reviewBookingData.hotelId}
          hotelName={reviewBookingData.hotelName}
        />
      )}

      {isChatModalOpen && chatBookingData && (
        <ChatModal
          isOpen={isChatModalOpen}
          onClose={() => {
            setIsChatModalOpen(false);
            setChatBookingData(null);
          }}
          bookingId={chatBookingData.id}
          hotelName={chatBookingData.hotelName}
          receiverName={chatBookingData.ownerName}
          userRole="user"
        />
      )}

      {isReportModalOpen && reportBookingData && (
        <ReportModal
          isOpen={isReportModalOpen}
          onClose={() => {
            setIsReportModalOpen(false);
            setReportBookingData(null);
          }}
          booking={reportBookingData.booking}
          hotelName={reportBookingData.hotelName}
          hotelId={reportBookingData.hotelId}
          ownerId={reportBookingData.ownerId}
        />
      )}
    </div>
  );
};

export default MyBookings;
