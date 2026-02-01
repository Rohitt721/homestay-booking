import { useState } from "react";
import { useQuery } from "react-query";
import * as apiClient from "../api-client";
import {
    Trophy,
    Building2,
    Users,
    TrendingUp,
    MapPin,
    DollarSign,
    Medal,
    Crown,
    Sparkles,
} from "lucide-react";

const Ranking = () => {
    const [activeTab, setActiveTab] = useState<"hotels" | "owners">("hotels");

    const { data: hotelRankings, isLoading: isLoadingHotels } = useQuery(
        "fetchHotelRankings",
        apiClient.fetchHotelRankings,
        {
            refetchInterval: 300000, // 5 minutes
        }
    );

    const { data: ownerRankings, isLoading: isLoadingOwners } = useQuery(
        "fetchOwnerRankings",
        apiClient.fetchOwnerRankings,
        {
            refetchInterval: 300000,
        }
    );

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const getRankBadge = (rank: number) => {
        switch (rank) {
            case 1:
                return (
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-yellow-100 border-2 border-yellow-400 shadow-sm relative">
                        <Crown className="w-6 h-6 text-yellow-600" />
                        <span className="absolute -bottom-1 -right-1 bg-yellow-500 text-white text-[10px] font-bold px-1.5 rounded-full ring-2 ring-white">1</span>
                    </div>
                );
            case 2:
                return (
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 border-2 border-slate-300 shadow-sm relative">
                        <Medal className="w-6 h-6 text-slate-500" />
                        <span className="absolute -bottom-1 -right-1 bg-slate-400 text-white text-[10px] font-bold px-1.5 rounded-full ring-2 ring-white">2</span>
                    </div>
                );
            case 3:
                return (
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-orange-100 border-2 border-orange-300 shadow-sm relative">
                        <Medal className="w-6 h-6 text-orange-600" />
                        <span className="absolute -bottom-1 -right-1 bg-orange-500 text-white text-[10px] font-bold px-1.5 rounded-full ring-2 ring-white">3</span>
                    </div>
                );
            default:
                return (
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-50 border border-gray-200">
                        <span className="text-gray-600 font-bold text-sm">{rank}</span>
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] pb-20">
            {/* Hero Header */}
            <div className="bg-gradient-to-r from-primary-700 via-primary-800 to-primary-900 pt-12 pb-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-48 -mt-48"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary-400/10 rounded-full blur-3xl -ml-32 -mb-32"></div>

                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div>
                            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white/90 text-sm font-medium mb-4">
                                <Sparkles className="w-4 h-4 text-yellow-400" />
                                <span>Live Leaderboard</span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
                                Global <span className="text-yellow-400">Rankings</span>
                            </h1>
                            <p className="text-primary-100 text-lg max-w-2xl font-medium">
                                Analyze market performance and see how you stack up against the top hoteliers in the ecosystem.
                            </p>
                        </div>
                        <div className="mt-8 md:mt-0 p-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl shadow-2xl">
                            <Trophy className="w-16 h-16 text-yellow-400 mb-2 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
                            <div className="text-white">
                                <p className="text-sm font-bold opacity-80 uppercase tracking-wider">Top Goal</p>
                                <p className="text-2xl font-black italic">ELITE CLUB</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-20">
                {/* Navigation Wrapper */}
                <div className="p-1 px-1 bg-white border border-slate-200 shadow-xl rounded-2xl md:rounded-full max-w-md mx-auto mb-12 flex space-x-1">
                    <button
                        onClick={() => setActiveTab("hotels")}
                        className={`flex-1 flex items-center justify-center py-3 px-6 rounded-2xl md:rounded-full font-bold text-sm transition-all duration-300 ${activeTab === "hotels"
                            ? "bg-primary-600 text-white shadow-lg shadow-primary-200"
                            : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                            }`}
                    >
                        <Building2 className="w-4 h-4 mr-2" />
                        Hotels
                    </button>
                    <button
                        onClick={() => setActiveTab("owners")}
                        className={`flex-1 flex items-center justify-center py-3 px-6 rounded-2xl md:rounded-full font-bold text-sm transition-all duration-300 ${activeTab === "owners"
                            ? "bg-primary-600 text-white shadow-lg shadow-primary-200"
                            : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                            }`}
                    >
                        <Users className="w-4 h-4 mr-2" />
                        Owners
                    </button>
                </div>

                {/* Content Table */}
                <div className="bg-white rounded-[2rem] shadow-2xl border border-slate-200 overflow-hidden">
                    {activeTab === "hotels" && (
                        <div className="overflow-x-auto">
                            {isLoadingHotels ? (
                                <div className="p-20 text-center flex flex-col items-center">
                                    <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-4"></div>
                                    <p className="text-slate-400 font-bold">Calculating rankings...</p>
                                </div>
                            ) : (
                                <table className="min-w-full">
                                    <thead>
                                        <tr className="bg-slate-50/50 border-b border-slate-100">
                                            <th className="px-8 py-6 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Rank</th>
                                            <th className="px-8 py-6 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Hotel Identity</th>
                                            <th className="px-8 py-6 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Market Status</th>
                                            <th className="px-8 py-6 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Performance</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {hotelRankings?.map((hotel: any) => (
                                            <tr
                                                key={hotel._id}
                                                className={`${hotel.isMyHotel
                                                    ? "bg-primary-50/50 border-l-4 border-primary-500"
                                                    : "hover:bg-slate-50/50"
                                                    } transition-all duration-200`}
                                            >
                                                <td className="px-8 py-6 whitespace-nowrap">
                                                    {getRankBadge(hotel.rank)}
                                                </td>
                                                <td className="px-8 py-6 whitespace-nowrap">
                                                    <div className="flex items-center space-x-4">
                                                        <div className="p-3 bg-slate-100 rounded-2xl">
                                                            <Building2 className="w-6 h-6 text-slate-600" />
                                                        </div>
                                                        <div>
                                                            <div className="text-lg font-black text-slate-900 leading-tight">
                                                                {hotel.name}
                                                            </div>
                                                            <div className="flex items-center text-slate-500 text-xs font-bold mt-1">
                                                                <MapPin className="w-3 h-3 mr-1" />
                                                                {hotel.city}, {hotel.country}
                                                            </div>
                                                            {hotel.isMyHotel && (
                                                                <div className="mt-2 text-[10px] font-black bg-primary-100 text-primary-700 px-2 py-0.5 rounded-md inline-block uppercase tracking-wider">
                                                                    Your Property
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 whitespace-nowrap">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-black text-slate-700">{hotel.bookingCount} Bookings</span>
                                                        <div className="flex items-center mt-1">
                                                            <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-emerald-500 rounded-full"
                                                                    style={{ width: `${Math.min(100, (hotel.bookingCount / (hotelRankings[0]?.bookingCount || 1)) * 100)}%` }}
                                                                ></div>
                                                            </div>
                                                            <span className="ml-2 text-[10px] font-bold text-slate-400">Market Share</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 whitespace-nowrap text-right">
                                                    <div className="text-xl font-black text-slate-900 italic">
                                                        {formatCurrency(hotel.totalRevenue)}
                                                    </div>
                                                    <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-tighter flex items-center justify-end mt-1 font-mono">
                                                        <TrendingUp className="w-3 h-3 mr-1" />
                                                        Top Tier
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}

                    {activeTab === "owners" && (
                        <div className="overflow-x-auto">
                            {isLoadingOwners ? (
                                <div className="p-20 text-center flex flex-col items-center">
                                    <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-4"></div>
                                    <p className="text-slate-400 font-bold">Analyzing market data...</p>
                                </div>
                            ) : (
                                <table className="min-w-full">
                                    <thead>
                                        <tr className="bg-slate-50/50 border-b border-slate-100">
                                            <th className="px-8 py-6 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Rank</th>
                                            <th className="px-8 py-6 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Executive</th>
                                            <th className="px-8 py-6 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Portfolio</th>
                                            <th className="px-8 py-6 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Total Returns</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {ownerRankings?.map((owner: any) => (
                                            <tr
                                                key={owner._id}
                                                className={`${owner.isMe
                                                    ? "bg-primary-50/50 border-l-4 border-primary-500"
                                                    : "hover:bg-slate-50/50"
                                                    } transition-all duration-200`}
                                            >
                                                <td className="px-8 py-6 whitespace-nowrap">
                                                    {getRankBadge(owner.rank)}
                                                </td>
                                                <td className="px-8 py-6 whitespace-nowrap">
                                                    <div className="flex items-center space-x-4">
                                                        <div className="p-3 bg-primary-100 rounded-2xl">
                                                            <Users className="w-6 h-6 text-primary-600" />
                                                        </div>
                                                        <div>
                                                            <div className="text-lg font-black text-slate-900 leading-tight">
                                                                {owner.firstName} {owner.lastName}
                                                            </div>
                                                            <div className="text-slate-500 text-xs font-bold mt-1 uppercase tracking-tight"> Verified Partner </div>
                                                            {owner.isMe && (
                                                                <div className="mt-2 text-[10px] font-black bg-primary-600 text-white px-2 py-0.5 rounded-md inline-block uppercase tracking-wider shadow-lg shadow-primary-200">
                                                                    That's You
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 whitespace-nowrap">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="flex flex-col">
                                                            <div className="flex items-center text-sm font-black text-slate-700">
                                                                <Building2 className="w-4 h-4 mr-1 text-slate-400" />
                                                                {owner.hotelCount} Properties
                                                            </div>
                                                            <div className="text-[10px] font-bold text-slate-400 mt-1">{owner.bookingCount} Total Transactions</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 whitespace-nowrap text-right">
                                                    <div className="flex items-center justify-end text-xl font-black text-slate-900 italic">
                                                        <DollarSign className="w-5 h-5 text-emerald-500 mr-0.5" />
                                                        {formatCurrency(owner.totalRevenue)}
                                                    </div>
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Platform Revenue</div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}
                </div>

                {/* Info Card */}
                <div className="mt-8 p-8 bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2rem] shadow-xl text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between">
                        <div className="mb-6 md:mb-0 text-center md:text-left">
                            <h3 className="text-xl font-black mb-2 flex items-center justify-center md:justify-start">
                                <Sparkles className="w-5 h-5 text-yellow-400 mr-2" />
                                How rankings are calculated?
                            </h3>
                            <p className="text-slate-400 text-sm font-medium max-w-xl">
                                Rankings are updated in real-time based on successful bookings and total revenue generated through the platform. Top performers receive exclusive platform benefits and increased visibility.
                            </p>
                        </div>
                        <div className="bg-white/10 p-4 rounded-2xl border border-white/10 backdrop-blur-md text-center min-w-[200px]">
                            <p className="text-[10px] font-black text-primary-300 uppercase mb-1">Update Frequency</p>
                            <p className="text-lg font-black tracking-widest">REAL-TIME</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Ranking;
