import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAppContext from "../hooks/useAppContext";
import { useQueryWithLoading } from "../hooks/useLoadingHooks";
import {
  fetchBusinessInsightsDashboard,
  fetchBusinessInsightsForecast,
} from "../api-client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Building,
  Calendar,
  DollarSign,
  BarChart3,
  RefreshCw,
  Sparkles,
  AlertCircle,
  XCircle,
} from "lucide-react";

interface AnalyticsData {
  overview: {
    totalHotels: number;
    totalUsers: number;
    totalBookings: number;
    recentBookings: number;
    totalRevenue: number;
    recentRevenue: number;
    revenueGrowth: number;
    occupancyRate: number;
    cancelledBookings: number;
  };
  statusBreakdown: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  popularDestinations: Array<{
    _id: string;
    count: number;
    totalRevenue: number;
    avgPrice: number;
  }>;
  dailyBookings: Array<{
    date: string;
    bookings: number;
    revenue: number;
  }>;
  hotelPerformance: Array<{
    _id: string;
    name: string;
    city: string;
    type: string[];
    starRating: number;
    pricePerNight: number;
    bookingCount: number;
    totalRevenue: number;
    cancelledCount: number;
    occupancy: number;
  }>;
  insights: Array<{
    type: "success" | "warning" | "error";
    message: string;
    icon: string;
  }>;
  lastUpdated: string;
}

interface ForecastData {
  historical: Array<{
    week: string;
    bookings: number;
    revenue: number;
  }>;
  forecasts: Array<{
    week: string;
    bookings: number;
    revenue: number;
    confidence: number;
  }>;
  seasonalGrowth: number;
  trends: {
    bookingTrend: string;
    revenueTrend: string;
  };
  lastUpdated: string;
}

const AnalyticsDashboard = () => {
  const { user, showToast } = useAppContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/sign-in");
      return;
    }
    if (user.role !== "hotel_owner") {
      navigate("/");
      return;
    }
  }, [user, navigate]);

  const [activeTab, setActiveTab] = useState<"overview" | "forecast">("overview");
  const [timeRange, setTimeRange] = useState<7 | 30 | 90>(30);

  const {
    data: analyticsData,
    isLoading,
    error,
    refetch,
  } = useQueryWithLoading<AnalyticsData>(
    "business-insights-dashboard",
    fetchBusinessInsightsDashboard,
    {
      refetchInterval: false,
      retry: 3,
      retryDelay: 1000,
      loadingMessage: "Loading business insights dashboard...",
    }
  );

  const { data: forecastData } = useQueryWithLoading<ForecastData>(
    "business-insights-forecast",
    fetchBusinessInsightsForecast,
    {
      refetchInterval: false,
      retry: 3,
      retryDelay: 1000,
      loadingMessage: "Loading forecast data...",
    }
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US").format(num);
  };

  const handleRefresh = async () => {
    await refetch();
    showToast({
      title: "Data Updated",
      description: "Latest analytics data has been synchronized.",
      type: "SUCCESS",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center max-w-sm w-full">
          <div className="relative w-20 h-20 mb-6">
            <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Analyzing your business...</h2>
          <p className="text-slate-500 text-center">Syncing latest hotel data and calculating growth metrics.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center bg-white p-8 rounded-2xl shadow-xl border border-rose-100 max-w-md w-full">
          <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <TrendingDown className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Sync Connection Lost</h2>
          <p className="text-slate-600 mb-6">We couldn't retrieve your business insights at the moment. Please check your connection and try again.</p>
          <button
            onClick={() => refetch()}
            className="w-full bg-slate-900 text-white font-semibold py-3 px-6 rounded-xl hover:bg-slate-800 transition-all shadow-lg active:scale-95"
          >
            Reconnect Dashboard
          </button>
        </div>
      </div>
    );
  }

  const getFilteredDailyData = () => {
    if (!analyticsData) return [];
    return analyticsData.dailyBookings.slice(-timeRange);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 py-8 lg:py-12">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold uppercase tracking-wider rounded-full border border-indigo-100">
                Property Analysis
              </span>
              <span className="text-slate-400 text-sm flex items-center gap-1">
                <RefreshCw className="w-3 h-3" /> Auto-sync active
              </span>
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">
              Business Intelligence
            </h1>
            <p className="text-slate-500 mt-2 text-lg">
              Track performance, forecast trends, and optimize your hotel operations.
            </p>
          </div>
          <div className="flex items-center gap-3 p-1 bg-white rounded-xl shadow-sm border border-slate-200 w-fit">
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === "overview"
                ? "bg-slate-900 text-white shadow-md shadow-slate-200 scale-105"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                }`}
            >
              <BarChart3 className="w-4 h-4" /> Overview
            </button>
            <button
              onClick={() => setActiveTab("forecast")}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === "forecast"
                ? "bg-slate-900 text-white shadow-md shadow-slate-200 scale-105"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                }`}
            >
              <TrendingUp className="w-4 h-4" /> Forecasting
            </button>
            <div className="w-px h-6 bg-slate-200 mx-2" />
            <button
              onClick={handleRefresh}
              className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
              title="Sync Data"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Overview Content */}
        {activeTab === "overview" && analyticsData && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* 1. Top Summary Cards (FIRST IMPRESSION) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
              {[
                {
                  label: "Total Revenue",
                  value: formatCurrency(analyticsData.overview.totalRevenue),
                  subValue: `${analyticsData.overview.revenueGrowth}% vs last month`,
                  icon: DollarSign,
                  trend: analyticsData.overview.revenueGrowth >= 0 ? "up" : "down",
                  color: "indigo",
                },
                {
                  label: "Total Bookings",
                  value: formatNumber(analyticsData.overview.totalBookings),
                  subValue: `${analyticsData.overview.recentBookings} new this month`,
                  icon: Calendar,
                  trend: "neutral",
                  color: "emerald",
                },
                {
                  label: "Occupancy Rate",
                  value: `${analyticsData.overview.occupancyRate}%`,
                  subValue: "Current month average",
                  icon: Building,
                  trend: "up",
                  color: "amber",
                },
                {
                  label: "Cancellations",
                  value: formatNumber(analyticsData.overview.cancelledBookings),
                  subValue: "Last 30 days total",
                  icon: TrendingDown,
                  trend: "down",
                  color: "rose",
                },
              ].map((card, i) => (
                <div key={i} className="group relative bg-white p-6 rounded-3xl shadow-sm border border-slate-200 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 overflow-hidden">
                  <div className={`absolute -right-4 -top-4 w-32 h-32 bg-${card.color}-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700`} />
                  <div className="relative z-10 flex items-start justify-between">
                    <div>
                      <p className="text-slate-500 font-bold text-sm mb-2">{card.label}</p>
                      <h3 className="text-3xl font-black text-slate-900 tracking-tight">{card.value}</h3>
                      <div className="flex items-center gap-1.5 mt-3">
                        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${card.trend === "up" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                          card.trend === "down" ? "bg-rose-50 text-rose-600 border border-rose-100" :
                            "bg-slate-50 text-slate-400 border border-slate-100"
                          }`}>
                          {card.trend === "up" ? <TrendingUp className="w-3 h-3" /> : card.trend === "down" ? <TrendingDown className="w-3 h-3" /> : null}
                          {card.subValue}
                        </div>
                      </div>
                    </div>
                    <div className={`p-3 bg-${card.color}-50 text-${card.color}-600 rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-sm border border-white`}>
                      <card.icon className="w-6 h-6" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 2. Revenue Trend (MAIN CHART) */}
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Revenue Stream</h3>
                  <p className="text-slate-500 text-sm mt-1">Global earnings across all listed properties</p>
                </div>
                <div className="flex items-center gap-1 p-1 bg-slate-50 rounded-xl border border-slate-100">
                  {[7, 30, 90].map((days) => (
                    <button
                      key={days}
                      onClick={() => setTimeRange(days as any)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${timeRange === days
                        ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                        : "text-slate-400 hover:text-slate-600"
                        }`}
                    >
                      {days}D
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={getFilteredDailyData()}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#94A3B8", fontSize: 12, fontWeight: 600 }}
                      tickFormatter={(val) => new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#94A3B8", fontSize: 12, fontWeight: 600 }}
                      tickFormatter={(val) => `$${val}`}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', fontWeight: 'bold' }}
                      cursor={{ stroke: '#4F46E5', strokeWidth: 2 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#4F46E5"
                      strokeWidth={4}
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                      animationDuration={1500}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 3 & 5 Status Breakdown + Insights Section */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              {/* Booking Status Breakdown (Visual contrast) */}
              <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
                <h3 className="text-xl font-black text-slate-900 tracking-tight mb-6">Booking Status</h3>
                <div className="h-[280px] w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analyticsData.statusBreakdown}
                        innerRadius={70}
                        outerRadius={100}
                        paddingAngle={8}
                        dataKey="value"
                        animationBegin={200}
                        animationDuration={1500}
                      >
                        {analyticsData.statusBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-3xl font-black text-slate-900">{analyticsData.overview.totalBookings}</span>
                    <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Total</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  {analyticsData.statusBreakdown.map((status, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: status.color }} />
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase leading-none">{status.name}</p>
                        <p className="text-sm font-black text-slate-700 mt-0.5">{status.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Insights / Alerts Section (Actionable) */}
              <div className="xl:col-span-2 bg-slate-900 p-8 rounded-[2rem] shadow-xl text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-32 -mt-32" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-xl font-black tracking-tight">Smart Business Insights</h3>
                      <p className="text-slate-400 text-sm mt-1">Rule-based recommendations for growth</p>
                    </div>
                    <div className="p-3 bg-white/10 rounded-2xl">
                      <Sparkles className="w-6 h-6 text-indigo-400" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {analyticsData.insights.length > 0 ? (
                      analyticsData.insights.map((insight, i) => (
                        <div key={i} className="flex items-start gap-4 p-5 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all group/item">
                          <div className={`p-2.5 rounded-xl ${insight.type === "success" ? "bg-emerald-500/20 text-emerald-400" :
                            insight.type === "warning" ? "bg-amber-500/20 text-amber-400" :
                              "bg-rose-500/20 text-rose-400"
                            }`}>
                            <RefreshCw className="w-5 h-5 group-hover/item:rotate-180 transition-transform duration-700" />
                          </div>
                          <div>
                            <p className="text-sm font-bold leading-snug">{insight.message}</p>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-2 inline-block">Suggestion</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 py-12 text-center text-slate-500 italic">
                        No critical insights detected for the current period.
                      </div>
                    )}
                  </div>

                  <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" />
                      <span className="text-xs font-bold text-slate-400">AI Analysis Active</span>
                    </div>
                    <button className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-widest">View Detailed Audit →</button>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Room Performance Table (ACTIONABLE) */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-8 border-b border-slate-100 flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Property Performance</h3>
                  <p className="text-slate-500 text-sm mt-1">Detailed breakdown of revenue by hotel and category</p>
                </div>
                <button className="px-5 py-2.5 bg-slate-50 text-slate-900 font-bold text-sm rounded-xl border border-slate-200 hover:bg-slate-100 transition-all flex items-center gap-2">
                  Export CSV <RefreshCw className="w-4 h-4" />
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Property Details</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Category</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Bookings</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Revenue</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Occupancy %</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {analyticsData.hotelPerformance.length > 0 ? (
                      analyticsData.hotelPerformance.map((hotel, i) => (
                        <tr key={i} className="group hover:bg-slate-50/50 transition-colors">
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-black relative overflow-hidden group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                                {hotel.name[0]}
                              </div>
                              <div>
                                <p className="font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{hotel.name}</p>
                                <p className="text-xs text-slate-400 font-bold mt-0.5">{hotel.city}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-black uppercase rounded-lg">
                              {hotel.type[0] || "Standard"}
                            </span>
                          </td>
                          <td className="px-8 py-6">
                            <div className="font-black text-slate-700">{hotel.bookingCount}</div>
                            <div className="text-[10px] text-rose-400 font-bold uppercase mt-1">-{hotel.cancelledCount} Cancelled</div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="font-black text-indigo-600 text-lg">{formatCurrency(hotel.totalRevenue)}</div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="w-full max-w-[100px] space-y-2">
                              <div className="flex items-center justify-between text-[10px] font-black">
                                <span className="text-slate-400">CAPACITY</span>
                                <span className="text-slate-900">{Math.round(hotel.occupancy)}%</span>
                              </div>
                              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full transition-all duration-1000 ${hotel.occupancy > 50 ? "bg-emerald-500" :
                                    hotel.occupancy > 20 ? "bg-amber-500" :
                                      "bg-rose-500"
                                    }`}
                                  style={{ width: `${hotel.occupancy}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <button
                              onClick={() => navigate(`/my-hotels/edit/${hotel._id}`)}
                              className="px-4 py-2 bg-white text-slate-900 text-xs font-black uppercase tracking-wider rounded-xl border border-slate-200 hover:border-indigo-600 hover:text-indigo-600 transition-all shadow-sm"
                            >
                              Edit Profile
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-20 text-center">
                          <div className="flex flex-col items-center opacity-40">
                            <Building className="w-16 h-16 mb-4" />
                            <p className="text-xl font-bold">No property activity detected</p>
                            <p className="text-sm">List a new hotel to start seeing performance analytics.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Forecast Tab */}
        {activeTab === "forecast" && forecastData && (
          <div className="space-y-8 animate-in mt-2 fade-in slide-in-from-bottom-4 duration-700">
            {/* Simple Forecast UX */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
                <h3 className="text-xl font-black text-slate-900 tracking-tight mb-6">Occupancy Probability</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={[...forecastData.historical, ...forecastData.forecasts]}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="week" hide />
                    <YAxis hide />
                    <Tooltip />
                    <Line type="monotone" dataKey="bookings" stroke="#4F46E5" strokeWidth={3} dot={{ r: 4, fill: '#4F46E5' }} />
                  </LineChart>
                </ResponsiveContainer>
                <p className="text-center text-slate-400 text-xs font-bold mt-4 uppercase tracking-widest">Dashed line indicates forecasted projection</p>
              </div>
              <div className="bg-indigo-600 p-8 rounded-[2rem] shadow-xl text-white">
                <h3 className="text-xl font-black mb-6 tracking-tight">Financial Projections</h3>
                <div className="space-y-6">
                  {forecastData.forecasts.slice(0, 3).map((f, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-white/10 rounded-2xl border border-white/10">
                      <div>
                        <p className="text-[10px] font-black text-indigo-300 uppercase leading-none">WEEK OF</p>
                        <p className="text-sm font-black mt-1">{new Date(f.week).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-black">{formatCurrency(f.revenue)}</p>
                        <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">Estimated Revenue</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-8 p-4 bg-yellow-400 rounded-2xl text-slate-900 flex items-center gap-4">
                  <div className="p-2 bg-slate-900 rounded-lg text-white">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase leading-tight">Growth Forecast</p>
                    <p className="text-sm font-bold">Your listing traffic is expected to grow by {forecastData.seasonalGrowth}% next month.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="mt-12 pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
          <div>© {new Date().getFullYear()} Hotel intelligence system v2.4.0</div>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> System Online</span>
            <span>Last Updated {analyticsData?.lastUpdated ? new Date(analyticsData.lastUpdated).toLocaleTimeString() : "N/A"}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
