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
  CheckCircle2,
  FileUp,
  History,
  PlaneTakeoff,
  LayoutDashboard,
  Gem,
  ArrowRight,
  MessageSquare,
  AlertTriangle,
} from "lucide-react";
import IdUploadModal from "../components/IdUploadModal";
import ReviewModal from "../components/ReviewModal";
import ChatModal from "../components/ChatModal";
import ReportModal from "../components/ReportModal";
import { useState, useMemo } from "react";
import { Button } from "../components/ui/button";

const MyBookings = () => {
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [isIdModalOpen, setIsIdModalOpen] = useState(false);
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

  // Report Modal State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportBookingData, setReportBookingData] = useState<{
    booking: BookingType;
    hotelName: string;
    hotelId: string;
    ownerId: string;
  } | null>(null);
  const [chatBookingData, setChatBookingData] = useState<{ id: string, hotelName: string, ownerName: string } | null>(null);

  const { data: hotels, isLoading, refetch } = useQueryWithLoading<HotelWithBookingsType[]>(
    "fetchMyBookings",
    apiClient.fetchMyBookings,
    {
      loadingMessage: "Loading your bookings...",
    }
  );

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
            onClick={() => window.location.href = "/"}
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
      case "ID_PENDING": return "from-amber-500/10 to-orange-500/10 text-orange-700 border-orange-200/50";
      case "ID_SUBMITTED": return "from-blue-500/10 to-cyan-500/10 text-blue-700 border-blue-200/50";
      case "CANCELLED":
      case "REJECTED": return "from-rose-500/10 to-red-500/10 text-rose-700 border-rose-200/50";
      case "COMPLETED": return "from-indigo-500/10 to-violet-500/10 text-indigo-700 border-indigo-200/50";
      default: return "from-gray-500/10 to-slate-500/10 text-slate-700 border-slate-200/50";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "CONFIRMED": return <CheckCircle2 className="w-4 h-4" />;
      case "ID_PENDING": return <Clock className="w-4 h-4" />;
      case "ID_SUBMITTED": return <Clock className="w-4 h-4" />;
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
              src={hotel.imageUrls[0]}
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
              <div className="flex items-center gap-3 text-sm">
                <div className="flex -space-x-2">
                  {[...Array(booking.adultCount)].map((_, i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs ring-2 ring-transparent group-hover:ring-indigo-50 transition-all">
                      {booking.firstName[0]}
                    </div>
                  ))}
                </div>
                <span className="text-gray-500 font-medium">Recorded for {booking.firstName} {booking.lastName}</span>
              </div>

              <div className="flex gap-3 w-full md:w-auto">
                {booking.status === "ID_PENDING" && (
                  <Button
                    onClick={() => {
                      setSelectedBookingId(booking._id);
                      setIsIdModalOpen(true);
                    }}
                    className="flex-1 md:flex-none bg-amber-500 hover:bg-amber-600 text-white font-bold px-6 py-5 rounded-xl shadow-lg shadow-amber-200 transition-all hover:scale-[1.02]"
                  >
                    <FileUp className="w-4 h-4 mr-2" />
                    Upload ID
                  </Button>
                )}

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
                    className="flex-1 md:flex-none bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-5 rounded-xl shadow-lg shadow-indigo-200 transition-all hover:scale-[1.02]"
                  >
                    <Star className="w-4 h-4 mr-2" />
                    Rate Experience
                  </Button>
                )}

                {(booking.status === "CONFIRMED" || booking.status === "ID_SUBMITTED") && (
                  <Button
                    onClick={() => {
                      setChatBookingData({
                        id: booking._id,
                        hotelName: hotel.name,
                        ownerName: "Hotel Host" // We could fetch actual owner name, but for now this works
                      });
                      setIsChatModalOpen(true);
                    }}
                    className="flex-1 md:flex-none border-indigo-200 text-indigo-700 hover:bg-indigo-50 rounded-xl px-6 py-5 font-bold flex items-center gap-2"
                    variant="outline"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Chat with Owner
                  </Button>
                )}

                <Button
                  variant="outline"
                  className="flex-1 md:flex-none border-gray-200 hover:bg-gray-50 rounded-xl px-6 py-5 font-bold"
                  onClick={() => window.location.href = `/detail/${hotel._id}`}
                >
                  View Hotel
                </Button>

                {/* Report Button - Always available */}
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
                <History className="w-4 h-4" />
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
                <div className="py-20 text-center bg-gray-50 rounded-[3rem] border border-dashed border-gray-200">
                  <PlaneTakeoff className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">No upcoming stays found. Ready for a new trip?</p>
                </div>
              )
            ) : (
              pastBookings.length > 0 ? (
                pastBookings.map(({ hotel, booking }, i) => (
                  <BookingCard key={`${booking._id}-${i}`} hotel={hotel} booking={booking} />
                ))
              ) : (
                <div className="py-20 text-center bg-gray-50 rounded-[3rem] border border-dashed border-gray-200">
                  <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">No travel history records found.</p>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      <IdUploadModal
        bookingId={selectedBookingId || ""}
        isOpen={isIdModalOpen}
        onClose={() => {
          setIsIdModalOpen(false);
          setSelectedBookingId(null);
          refetch(); // Refresh after upload
        }}
      />

      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => {
          setIsReviewModalOpen(false);
          setReviewBookingData(null);
          // Small delay before refetch to allow DB update
          setTimeout(refetch, 500);
        }}
        bookingId={reviewBookingData?.id || ""}
        hotelId={reviewBookingData?.hotelId || ""}
        hotelName={reviewBookingData?.hotelName || ""}
      />

      <ChatModal
        isOpen={isChatModalOpen}
        onClose={() => {
          setIsChatModalOpen(false);
          setChatBookingData(null);
        }}
        bookingId={chatBookingData?.id || ""}
        hotelName={chatBookingData?.hotelName || ""}
        receiverName={chatBookingData?.ownerName || ""}
        userRole="user"
      />

      {reportBookingData && (
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
