import { useState } from "react";
import { useQuery, useMutation } from "react-query";
import { useNavigate } from "react-router-dom";
import * as apiClient from "../api-client";
import {
    MapPin,
    Calendar,
    Clock,
    Compass,
    DollarSign,
    Sparkles,
    Loader2,
    ChevronRight,
    ChevronLeft,
    Hotel,
    Star,
    Check,
    AlertCircle,
    Map,
    Utensils,
    Camera,
    RefreshCw,
    Save,
    Trash2,
    History,
    X,
    ExternalLink,
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});
import useAppContext from "../hooks/useAppContext";

type TravelStyle = "adventure" | "cultural" | "relaxation" | "food" | "mixed";
type Budget = "budget" | "moderate" | "luxury";

interface FormData {
    destination: string;
    startDate: string;
    duration: number;
    travelStyle: TravelStyle;
    budget: Budget;
    mustVisitPlaces: string;
}

const TRAVEL_STYLE_ICONS: Record<TravelStyle, React.ReactNode> = {
    adventure: <Compass className="w-6 h-6" />,
    cultural: <Camera className="w-6 h-6" />,
    relaxation: <Star className="w-6 h-6" />,
    food: <Utensils className="w-6 h-6" />,
    mixed: <Sparkles className="w-6 h-6" />,
};

/**
 * Helper component to fit map to bounds of markers
 */
const MapBounds = ({ points }: { points: [number, number][] }) => {
    const map = useMap();
    useEffect(() => {
        if (points.length > 0) {
            const bounds = L.latLngBounds(points);
            map.fitBounds(bounds, { padding: [50, 50], animate: true, duration: 2 });
        }
    }, [points, map]);
    return null;
};

import { useEffect } from "react";

const TripPlanner = () => {
    const navigate = useNavigate();
    const { showToast, isLoggedIn } = useAppContext();
    const [step, setStep] = useState(1);
    const [viewMode, setViewMode] = useState<"new" | "saved">("new");
    const [tripPlan, setTripPlan] = useState<apiClient.TripPlan | null>(null);
    const [selectedDay, setSelectedDay] = useState(1);
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [tripName, setTripName] = useState("");
    const [focusedActivityIndex, setFocusedActivityIndex] = useState<number | null>(null);
    const [activeSavedTripId, setActiveSavedTripId] = useState<string | null>(null);


    const [formData, setFormData] = useState<FormData>({
        destination: "",
        startDate: "",
        duration: 3,
        travelStyle: "mixed",
        budget: "moderate",
        mustVisitPlaces: "",
    });

    const { data: travelStyles } = useQuery("travelStyles", apiClient.getTravelStyles);
    const { data: budgetOptions } = useQuery("budgetOptions", apiClient.getBudgetOptions);

    const { data: myTrips, refetch: refetchMyTrips } = useQuery("myTrips", apiClient.getMyTrips, {
        enabled: isLoggedIn && viewMode === "saved",
    });

    const saveTripMutation = useMutation(apiClient.saveTripPlan, {
        onSuccess: () => {
            showToast({ title: "Trip Saved!", type: "SUCCESS" });
            setIsSaveModalOpen(false);
            setTripName("");
            refetchMyTrips();
        },
        onError: () => {
            showToast({ title: "Failed to save trip", type: "ERROR" });
        },
    });

    const deleteTripMutation = useMutation(apiClient.deleteTrip, {
        onSuccess: () => {
            showToast({ title: "Trip Deleted", type: "SUCCESS" });
            refetchMyTrips();
            if (activeSavedTripId) {
                setActiveSavedTripId(null);
                setTripPlan(null);
            }
        },
        onError: () => {
            showToast({ title: "Failed to delete trip", type: "ERROR" });
        },
    });

    const generateMutation = useMutation(apiClient.generateTripPlan, {
        onSuccess: (data) => {
            setTripPlan(data);
            setStep(3);
            showToast({
                title: "Trip Plan Generated!",
                description: `Your ${data.duration}-day itinerary to ${data.destination} is ready.`,
                type: "SUCCESS",
            });
        },
        onError: () => {
            showToast({
                title: "Failed to Generate Plan",
                description: "Please try again or adjust your preferences.",
                type: "ERROR",
            });
        },
    });

    const handleSaveTrip = () => {
        if (!tripPlan || !tripName) return;
        saveTripMutation.mutate({
            name: tripName,
            destination: tripPlan.destination,
            planData: tripPlan,
        });
    };

    const handleInputChange = (field: keyof FormData, value: string | number) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleGenerate = () => {
        if (!formData.destination || !formData.startDate) {
            showToast({
                title: "Missing Information",
                description: "Please fill in destination and start date.",
                type: "ERROR",
            });
            return;
        }

        generateMutation.mutate({
            destination: formData.destination,
            startDate: formData.startDate,
            duration: formData.duration,
            travelStyle: formData.travelStyle,
            budget: formData.budget,
            mustVisitPlaces: formData.mustVisitPlaces
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
        });
    };

    const handleBookHotel = (hotelId: string) => {
        navigate(`/detail/${hotelId}`);
    };

    const handleRefreshHotels = async (dayNumber: number) => {
        if (!tripPlan) return;

        const day = tripPlan.days.find((d) => d.day === dayNumber);
        if (!day) return;

        try {
            const result = await apiClient.getAlternateHotels(
                tripPlan.destination,
                day.date,
                new Date(new Date(day.date).getTime() + 86400000).toISOString().split("T")[0],
                tripPlan.budget
            );

            if (result.hotels.length > 0) {
                const updatedDays = tripPlan.days.map((d) =>
                    d.day === dayNumber ? { ...d, hotels: result.hotels, fallbackMessage: undefined } : d
                );
                setTripPlan({ ...tripPlan, days: updatedDays });
                showToast({
                    title: "Hotels Updated",
                    description: "Found some alternate options for you.",
                    type: "SUCCESS",
                });
            } else {
                showToast({
                    title: "No alternates found",
                    description: "We couldn't find other hotels matching your criteria nearby.",
                    type: "ERROR",
                });
            }
        } catch (error) {
            showToast({
                title: "Error",
                description: "Failed to fetch alternate hotels.",
                type: "ERROR",
            });
        }
    };

    // Step 1: Destination & Dates
    const renderSaveModal = () => {
        if (!isSaveModalOpen) return null;

        return (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-300">
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <Save className="w-5 h-5 text-blue-600" />
                                Save Your Trip
                            </h3>
                            <button onClick={() => setIsSaveModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-sm text-gray-500 mb-4">
                            Give your trip to {tripPlan?.destination} a name to find it later.
                        </p>
                        <input
                            type="text"
                            placeholder="My Dream Vacation..."
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-6"
                            value={tripName}
                            onChange={(e) => setTripName(e.target.value)}
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsSaveModalOpen(false)}
                                className="flex-1 py-3 px-4 rounded-xl border border-gray-200 font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveTrip}
                                disabled={!tripName || saveTripMutation.isLoading}
                                className="flex-1 py-3 px-4 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {saveTripMutation.isLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        Save Trip
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderSavedTrips = () => {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <History className="w-6 h-6 text-blue-600" />
                        My Saved Trips
                    </h2>
                    <button
                        onClick={() => setViewMode("new")}
                        className="text-sm text-blue-600 font-medium hover:underline"
                    >
                        + Plan New Trip
                    </button>
                </div>

                {!isLoggedIn ? (
                    <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                        <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Login to see your trips</h3>
                        <p className="text-gray-500 mb-6">Save and revisit your AI-powered itineraries anytime.</p>
                        <button
                            onClick={() => navigate("/sign-in")}
                            className="bg-blue-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"
                        >
                            Sign In
                        </button>
                    </div>
                ) : myTrips?.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                        <Map className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No saved trips yet</h3>
                        <p className="text-gray-500 mb-6">Your generated trip plans will appear here.</p>
                        <button
                            onClick={() => setViewMode("new")}
                            className="bg-blue-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"
                        >
                            Start Planning
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {myTrips?.map((trip) => (
                            <div
                                key={trip._id}
                                className={`group p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                                    activeSavedTripId === trip._id
                                        ? "border-blue-500 bg-blue-50 shadow-md"
                                        : "border-gray-100 bg-white hover:border-blue-200 hover:shadow-sm"
                                }`}
                                onClick={() => {
                                    setActiveSavedTripId(trip._id);
                                    setTripPlan(trip.planData);
                                    setStep(3);
                                    setSelectedDay(1);
                                }}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <h4 className="font-bold text-gray-900 group-hover:text-blue-600 mb-1">
                                            {trip.name}
                                        </h4>
                                        <p className="text-sm text-gray-500 flex items-center gap-1">
                                            <MapPin className="w-3 h-3" />
                                            {trip.destination} • {trip.planData.duration} days
                                        </p>
                                        <p className="text-[10px] text-gray-400 mt-2 uppercase tracking-wider font-semibold">
                                            Created on {new Date(trip.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (window.confirm("Delete this trip plan?")) {
                                                deleteTripMutation.mutate(trip._id);
                                            }
                                        }}
                                        className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const renderStep1 = () => (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white">Where do you want to go?</h2>
                <p className="text-blue-100/80 mt-2">Tell us your destination and travel dates</p>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-white mb-2">
                        <MapPin className="w-4 h-4 text-blue-400" />
                        Destination
                    </label>
                    <input
                        type="text"
                        value={formData.destination}
                        onChange={(e) => handleInputChange("destination", e.target.value)}
                        placeholder="e.g., Jaipur, Goa, Kerala..."
                        className="w-full px-4 py-3 bg-white border-2 border-white/20 rounded-xl focus:ring-4 focus:ring-blue-500/30 focus:border-blue-400 transition-all text-gray-900 placeholder:text-gray-400 font-medium"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-white mb-2">
                            <Calendar className="w-4 h-4 text-green-400" />
                            Start Date
                        </label>
                        <input
                            type="date"
                            value={formData.startDate}
                            onChange={(e) => handleInputChange("startDate", e.target.value)}
                            min={new Date().toISOString().split("T")[0]}
                            className="w-full px-4 py-3 bg-white border-2 border-white/20 rounded-xl focus:ring-4 focus:ring-blue-500/30 focus:border-blue-400 transition-all text-gray-900 font-medium"
                        />
                    </div>

                    <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-white mb-2">
                            <Clock className="w-4 h-4 text-purple-400" />
                            Duration
                        </label>
                        <select
                            value={formData.duration}
                            onChange={(e) => handleInputChange("duration", parseInt(e.target.value))}
                            className="w-full px-4 py-3 bg-white border-2 border-white/20 rounded-xl focus:ring-4 focus:ring-blue-500/30 focus:border-blue-400 transition-all bg-white text-gray-900 font-medium cursor-pointer"
                        >
                            {[1, 2, 3, 4, 5, 6, 7, 10, 14].map((d) => (
                                <option key={d} value={d}>
                                    {d} {d === 1 ? "day" : "days"}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-white mb-2">
                        <Map className="w-4 h-4 text-orange-400" />
                        Must-Visit Places <span className="text-blue-100/50 font-normal">(optional)</span>
                    </label>
                    <input
                        type="text"
                        value={formData.mustVisitPlaces}
                        onChange={(e) => handleInputChange("mustVisitPlaces", e.target.value)}
                        placeholder="Taj Mahal, Red Fort, Hawa Mahal..."
                        className="w-full px-4 py-3 bg-white border-2 border-white/20 rounded-xl focus:ring-4 focus:ring-blue-500/30 focus:border-blue-400 transition-all text-gray-900 placeholder:text-gray-400 font-medium"
                    />
                    <p className="text-xs text-blue-100/60 mt-2 italic px-1">Separate multiple places with commas</p>
                </div>
            </div>
        </div>
    );

    // Step 2: Preferences
    const renderStep2 = () => (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white">What's your travel style?</h2>
                <p className="text-blue-100/80 mt-2">Help us personalize your itinerary</p>
            </div>

            {/* Travel Style */}
            <div>
                <label className="block text-sm font-semibold text-white mb-3">Travel Style</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {(travelStyles || []).map((style) => (
                        <button
                            key={style.id}
                            type="button"
                            onClick={() => handleInputChange("travelStyle", style.id as TravelStyle)}
                            className={`p-4 rounded-xl border-2 transition-all text-left group ${formData.travelStyle === style.id
                                ? "border-blue-400 bg-blue-600/20 shadow-xl shadow-blue-500/10 ring-2 ring-blue-500/20"
                                : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20"
                                }`}
                        >
                            <div className="text-3xl mb-3 transform group-hover:scale-110 transition-transform">{style.icon}</div>
                            <p className={`font-bold ${formData.travelStyle === style.id ? "text-white" : "text-blue-100"}`}>{style.name}</p>
                            <p className="text-xs text-blue-100/60 mt-1 leading-relaxed">{style.description}</p>
                        </button>
                    ))}
                </div>
            </div>

            {/* Budget */}
            <div>
                <label className="block text-sm font-semibold text-white mb-3">Budget Level</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {(budgetOptions || []).map((option) => (
                        <button
                            key={option.id}
                            type="button"
                            onClick={() => handleInputChange("budget", option.id as Budget)}
                            className={`p-4 rounded-xl border-2 transition-all text-left group ${formData.budget === option.id
                                ? "border-emerald-400 bg-emerald-600/20 shadow-xl shadow-emerald-500/10 ring-2 ring-emerald-500/20"
                                : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20"
                                }`}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-3xl transform group-hover:scale-110 transition-transform">{option.icon}</span>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${formData.budget === option.id ? "bg-emerald-500/20 text-emerald-400" : "bg-white/10 text-blue-100/60 text-emerald-400"}`}>{option.priceRange}</span>
                            </div>
                            <p className={`font-bold ${formData.budget === option.id ? "text-white" : "text-blue-100"}`}>{option.name}</p>
                            <p className="text-xs text-blue-100/60 mt-1 leading-relaxed">{option.description}</p>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );

    // Step 3: Results
    const renderStep3 = () => {
        if (!tripPlan) return null;

        const currentDay = tripPlan.days.find((d) => d.day === selectedDay);

        return (
            <div className="space-y-6">
                {/* Trip Summary */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden mb-4">
                    <div className="relative z-10">
                        <h2 className="text-2xl font-bold mb-2">
                            {tripPlan.duration}-Day Trip to {tripPlan.destination}
                        </h2>
                        <p className="text-blue-100 max-w-2xl leading-relaxed">{tripPlan.summary}</p>
                    </div>
                </div>

                {/* Secondary Action Bar */}
                <div className="flex flex-wrap items-center justify-between gap-4 py-2">
                    <div className="flex flex-wrap gap-4 text-sm font-medium">
                        <span className="flex items-center gap-1.5 text-gray-600 bg-gray-100 px-3 py-1.5 rounded-xl border border-gray-200">
                            <Calendar className="w-4 h-4 text-blue-500" />
                            {tripPlan.startDate} → {tripPlan.endDate}
                        </span>
                        <span className="flex items-center gap-1.5 text-gray-600 bg-gray-100 px-3 py-1.5 rounded-xl border border-gray-200">
                            {formData.travelStyle ? TRAVEL_STYLE_ICONS[formData.travelStyle] : <Compass className="w-4 h-4" />}
                            {formData.travelStyle || tripPlan.travelStyle}
                        </span>
                        <span className="flex items-center gap-1.5 text-gray-600 bg-gray-100 px-3 py-1.5 rounded-xl border border-gray-200">
                            <DollarSign className="w-4 h-4 text-green-500" />
                            {formData.budget || tripPlan.budget}
                        </span>
                    </div>

                    {viewMode === "new" && isLoggedIn && (
                        <button
                            onClick={() => setIsSaveModalOpen(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl font-semibold shadow-lg shadow-blue-200 transition-all flex items-center gap-2 transform active:scale-95"
                        >
                            <Save className="w-4 h-4" />
                            Save to My Trips
                        </button>
                    )}
                </div>

                {renderSaveModal()}

                {/* Day Selection & View Switching */}
                <div className="flex flex-wrap items-center justify-between gap-4 mt-6 pt-6 border-t border-gray-100">
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {tripPlan.days.map((day) => (
                            <button
                                key={day.day}
                                onClick={() => {
                                    setSelectedDay(day.day);
                                    setFocusedActivityIndex(null);
                                }}
                                className={`flex-shrink-0 px-4 py-2 rounded-xl font-medium transition-all ${selectedDay === day.day
                                    ? "bg-blue-600 text-white shadow-lg"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200"
                                    }`}
                            >
                                Day {day.day}
                            </button>
                        ))}
                    </div>
                    {viewMode === "saved" && (
                        <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
                            <button
                                onClick={() => setViewMode("new")}
                                className="px-5 py-1.5 rounded-lg text-sm font-semibold text-gray-500 hover:text-gray-700 transition-all"
                            >
                                List
                            </button>
                            <button
                                className="px-5 py-1.5 rounded-lg text-sm font-bold bg-white text-blue-600 shadow-sm border border-gray-100 transition-all"
                            >
                                Map View
                            </button>
                        </div>
                    )}
                </div>

                {viewMode === "saved" && currentDay && (
                    <div className="h-[400px] w-full bg-gray-100 rounded-3xl overflow-hidden border border-gray-200 shadow-inner group relative">
                        <MapContainer
                            center={[currentDay.coordinates?.lat || 0, currentDay.coordinates?.lng || 0]}
                            zoom={13}
                            scrollWheelZoom={false}
                            className="h-full w-full z-10"
                        >
                            <TileLayer
                                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                            />
                            {currentDay.activities.map((activity, idx) => (
                                activity.coordinates && (
                                    <Marker
                                        key={idx}
                                        position={[activity.coordinates.lat, activity.coordinates.lng]}
                                        eventHandlers={{
                                            click: () => setFocusedActivityIndex(idx),
                                        }}
                                    >
                                        <Popup>
                                            <div className="p-1">
                                                <h4 className="font-bold text-gray-900">{activity.activity}</h4>
                                                <p className="text-xs text-gray-500">{activity.time}</p>
                                            </div>
                                        </Popup>
                                    </Marker>
                                )
                            ))}
                            {/* Path between activities */}
                            <Polyline
                                positions={currentDay.activities
                                    .filter(a => a.coordinates)
                                    .map(a => [a.coordinates!.lat, a.coordinates!.lng]) as [number, number][]}
                                color="#2563eb"
                                weight={3}
                                opacity={0.6}
                                dashArray="10, 10"
                            />
                            <MapBounds
                                points={currentDay.activities
                                    .filter(a => a.coordinates)
                                    .map(a => [a.coordinates!.lat, a.coordinates!.lng]) as [number, number][]}
                            />
                        </MapContainer>
                    </div>
                )}

                {/* Day Details */}
                {currentDay && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Activities */}
                        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <Compass className="w-5 h-5 text-blue-600" />
                                Day {currentDay.day} - {currentDay.areaName}
                            </h3>
                            <p className="text-sm text-gray-500 mb-4">{currentDay.date}</p>

                            <div className="space-y-4">
                                {currentDay.activities.map((activity, index) => (
                                    <div key={index} className="flex gap-4">
                                        <div className="flex flex-col items-center">
                                            <div className="w-3 h-3 bg-blue-600 rounded-full" />
                                            {index < currentDay.activities.length - 1 && (
                                                <div className="w-0.5 h-full bg-gray-200 mt-1" />
                                            )}
                                        </div>
                                        <div className="flex-1 pb-4">
                                            <p className="text-sm text-gray-500">{activity.time}</p>
                                            <p className="font-medium text-gray-800">{activity.activity}</p>
                                            <p className="text-sm text-gray-600 mt-1">{activity.location}</p>
                                            <p className="text-xs text-gray-400 mt-1">{activity.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Hotels */}
                        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                    <Hotel className="w-5 h-5 text-green-600" />
                                    Recommended Stays
                                </h3>
                                <button
                                    onClick={() => handleRefreshHotels(currentDay.day)}
                                    className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium bg-blue-50 px-2 py-1 rounded-lg transition-colors"
                                >
                                    <RefreshCw className="w-3 h-3" />
                                    Find Alternates
                                </button>
                            </div>

                            {currentDay.fallbackMessage && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4 flex gap-3">
                                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                                    <p className="text-sm text-yellow-700">{currentDay.fallbackMessage}</p>
                                </div>
                            )}

                            <div className="space-y-4">
                                {currentDay.hotels.length > 0 ? (
                                    currentDay.hotels.map((hotel) => (
                                        <div
                                            key={hotel.hotelId}
                                            className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all"
                                        >
                                            <div className="flex gap-4">
                                                {hotel.imageUrl && (
                                                    <img
                                                        src={hotel.imageUrl}
                                                        alt={hotel.name}
                                                        className="w-20 h-20 object-cover rounded-lg"
                                                    />
                                                )}
                                                <div className="flex-1">
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <h4 className="font-medium text-gray-800">{hotel.name}</h4>
                                                            <p className="text-sm text-gray-500">{hotel.city}</p>
                                                        </div>
                                                        <span
                                                            className={`text-xs px-2 py-1 rounded-full ${hotel.availabilityStatus === "available"
                                                                ? "bg-green-100 text-green-700"
                                                                : hotel.availabilityStatus === "limited"
                                                                    ? "bg-yellow-100 text-yellow-700"
                                                                    : "bg-red-100 text-red-700"
                                                                }`}
                                                        >
                                                            {hotel.availabilityStatus === "available" && (
                                                                <Check className="w-3 h-3 inline mr-1" />
                                                            )}
                                                            {hotel.availabilityStatus}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <div className="flex items-center">
                                                            {Array.from({ length: hotel.starRating }).map((_, i) => (
                                                                <Star
                                                                    key={i}
                                                                    className="w-3 h-3 text-yellow-400 fill-yellow-400"
                                                                />
                                                            ))}
                                                        </div>
                                                        <span className="text-sm font-medium text-gray-800">
                                                            ₹{hotel.pricePerNight}/night
                                                        </span>
                                                    </div>
                                                    <button
                                                        onClick={() => handleBookHotel(hotel.hotelId)}
                                                        className="mt-3 w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                                                    >
                                                        View & Book
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        <Hotel className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                        <p>No hotels found for this location.</p>
                                        <p className="text-sm">Try adjusting your budget or dates.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 py-8">
            <div className="max-w-4xl mx-auto px-4">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full mb-6 border border-white/20">
                        <Sparkles className="w-5 h-5 text-yellow-400" />
                        <span className="text-white font-medium">AI-Powered Travel Intelligence</span>
                    </div>
                    <h1 className="text-5xl font-extrabold text-white mb-4 tracking-tight">
                        Plan Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">Perfect Trip</span>
                    </h1>
                    <p className="text-xl text-blue-200/80 max-w-2xl mx-auto mb-10">
                        Get hyper-personalized itineraries and top-rated hotel recommendations in seconds.
                    </p>

                    <div className="flex justify-center gap-4">
                        <button
                            onClick={() => {
                                setViewMode("new");
                                if (step === 3) setStep(1); // Reset if they go back to Plan
                            }}
                            className={`inline-flex items-center gap-2 backdrop-blur-md px-6 py-2.5 rounded-full transition-all duration-300 ${
                                viewMode === "new" 
                                ? "bg-white text-blue-600 shadow-xl shadow-white/10 scale-105" 
                                : "text-white/60 hover:text-white hover:bg-white/10 border border-white/10"
                            }`}
                        >
                            <Sparkles className={`w-5 h-5 ${viewMode === "new" ? "text-blue-600" : ""}`} />
                            <span className="font-bold">Plan New Trip</span>
                        </button>
                        <button
                            onClick={() => setViewMode("saved")}
                            className={`inline-flex items-center gap-2 backdrop-blur-md px-6 py-2.5 rounded-full transition-all duration-300 ${
                                viewMode === "saved" 
                                ? "bg-white text-blue-600 shadow-xl shadow-white/10 scale-105" 
                                : "text-white/60 hover:text-white hover:bg-white/10 border border-white/10"
                            }`}
                        >
                            <History className={`w-5 h-5 ${viewMode === "saved" ? "text-blue-600" : ""}`} />
                            <span className="font-bold">My Saved Trips</span>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-4 md:p-8 shadow-2xl border border-white/10">
                    {viewMode === "saved" && step < 3 ? (
                        renderSavedTrips()
                    ) : (
                        <>
                {/* Progress Tracker */}
                {step < 3 && (
                    <div className="relative mb-12">
                        <div className="flex items-center justify-between max-w-xs mx-auto">
                            {[1, 2].map((s) => (
                                <div key={s} className="flex flex-col items-center gap-2 relative z-10">
                                    <div
                                        className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold transition-all duration-500 ${step >= s 
                                            ? "bg-white text-blue-600 shadow-xl shadow-blue-500/20 scale-110" 
                                            : "bg-white/10 text-white/40 border border-white/10"
                                        }`}
                                    >
                                        {step > s ? <Check className="w-5 h-5" /> : s}
                                    </div>
                                    <span className={`text-[10px] font-bold uppercase tracking-widest ${step >= s ? "text-white" : "text-white/30"}`}>
                                        Step {s}
                                    </span>
                                </div>
                            ))}
                            {/* Connector Line */}
                            <div className="absolute top-5 left-1/2 -translate-x-1/2 w-32 h-[2px] bg-white/10 -z-0">
                                <div 
                                    className="h-full bg-gradient-to-r from-blue-400 to-white transition-all duration-700 ease-in-out"
                                    style={{ width: step > 1 ? "100%" : "0%" }}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
                {step === 3 && renderStep3()}
                        </>
                    )}
                </div>

                {/* Navigation */}
                {step < 3 && (
                    <div className="flex items-center justify-between mt-6">
                        <button
                            type="button"
                            onClick={() => setStep(step - 1)}
                            disabled={step === 1}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${step === 1
                                ? "text-white/20 cursor-not-allowed"
                                : "text-white/70 hover:text-white hover:bg-white/10"
                                }`}
                        >
                            <ChevronLeft className="w-5 h-5" />
                            Back
                        </button>

                        {step === 2 ? (
                            <button
                                onClick={handleGenerate}
                                disabled={generateMutation.isLoading || !formData.travelStyle || !formData.budget}
                                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 hover:from-blue-600 hover:to-indigo-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95"
                            >
                                {generateMutation.isLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-5 h-5" />
                                        Generate Trip Plan
                                    </>
                                )}
                            </button>
                        ) : (
                            <button
                                onClick={() => setStep(step + 1)}
                                disabled={!formData.destination.trim() || !formData.startDate}
                                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 hover:from-blue-600 hover:to-indigo-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95"
                            >
                                Next Step
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                )}

                {/* Reset Button */}
                {step === 3 && (
                    <div className="text-center mt-6">
                        <button
                            onClick={() => {
                                setStep(1);
                                setTripPlan(null);
                            }}
                            className="text-white/70 hover:text-white transition-colors"
                        >
                            Plan Another Trip
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TripPlanner;
