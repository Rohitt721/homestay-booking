import express, { Request, Response } from "express";
import Hotel from "../models/hotel";
import User from "../models/user";
import Booking from "../models/booking";
import mongoose from "mongoose";
import verifyToken from "../middleware/auth";

const router = express.Router();

interface BookingDocument {
  _id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  adultCount: number;
  childCount: number;
  checkIn: Date;
  checkOut: Date;
  totalCost: number;
  hotelId: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @swagger
 * /api/business-insights/dashboard:
 *   get:
 *     summary: Get business insights dashboard data
 *     description: Returns comprehensive business insights data for the dashboard including bookings, revenue, and performance metrics
 *     tags: [Business Insights]
 *     responses:
 *       200:
 *         description: Business insights dashboard data
 */
router.get("/dashboard", verifyToken, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;

    // Get current date and date 30 days ago
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // Fetch Owner's Hotels
    const myHotels = await Hotel.find({ userId });
    const hotelIds = myHotels.map(hotel => hotel._id);

    // Count Total Hotels (My Hotels)
    const totalHotels = myHotels.length;

    // Fetch Bookings for these hotels
    const myBookings = await Booking.find({ hotelId: { $in: hotelIds } });

    // Calculate Total Guests (Unique Users who booked)
    const uniqueGuests = new Set(myBookings.map(b => b.userId)).size;

    // Calculate total bookings
    const totalBookings = myBookings.length;

    // Recent bookings (last 30 days)
    const recentBookings = myBookings.filter(
      (booking) => new Date(booking.createdAt) >= thirtyDaysAgo
    ).length;

    // Revenue calculations
    const totalRevenue = myBookings.reduce(
      (sum: number, booking: any) => sum + (booking.totalCost || 0),
      0
    );

    const recentRevenue = myBookings
      .filter((booking: any) => new Date(booking.createdAt) >= thirtyDaysAgo)
      .reduce((sum: number, booking: any) => sum + (booking.totalCost || 0), 0);

    const lastMonthRevenue = myBookings
      .filter((booking: any) => {
        const bookingDate = new Date(booking.createdAt);
        return bookingDate >= lastMonth && bookingDate < thirtyDaysAgo;
      })
      .reduce((sum: number, booking: any) => sum + (booking.totalCost || 0), 0);

    // Revenue growth percentage - compare current month vs previous month
    const currentMonthRevenue = myBookings
      .filter((booking: any) => {
        const bookingDate = new Date(booking.createdAt);
        return bookingDate >= new Date(now.getFullYear(), now.getMonth(), 1);
      })
      .reduce((sum: number, booking: any) => sum + (booking.totalCost || 0), 0);

    const previousMonthRevenue = myBookings
      .filter((booking: any) => {
        const bookingDate = new Date(booking.createdAt);
        return (
          bookingDate >= new Date(now.getFullYear(), now.getMonth() - 1, 1) &&
          bookingDate < new Date(now.getFullYear(), now.getMonth(), 1)
        );
      })
      .reduce((sum: number, booking: any) => sum + (booking.totalCost || 0), 0);

    // Calculate revenue growth more accurately
    let revenueGrowth = 0;
    if (previousMonthRevenue > 0) {
      revenueGrowth =
        ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) *
        100;
    } else if (currentMonthRevenue > 0) {
      revenueGrowth = 100; // First month growth
    } else {
      revenueGrowth = 0;
    }

    // Popular destinations (Cities where this owner has hotels)
    // We already have myHotels, so we can group by city from that, but verify with bookings
    const popularDestinations = await Booking.aggregate([
      { $match: { hotelId: { $in: hotelIds.map(id => id.toString()) } } }, // Filter by owner's hotels
      {
        $addFields: {
          hotelIdObjectId: { $toObjectId: "$hotelId" },
        },
      },
      {
        $group: {
          _id: "$hotelIdObjectId",
          count: { $sum: 1 },
          totalRevenue: { $sum: "$totalCost" },
        },
      },
      {
        $lookup: {
          from: "hotels",
          localField: "_id",
          foreignField: "_id",
          as: "hotel",
        },
      },
      {
        $unwind: "$hotel",
      },
      {
        $group: {
          _id: "$hotel.city",
          count: { $sum: "$count" },
          totalRevenue: { $sum: "$totalRevenue" },
          avgPrice: { $avg: "$hotel.pricePerNight" },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: 5,
      },
    ]);

    // Booking trends
    const bookingDates = myBookings.reduce((acc: any, booking: any) => {
      if (booking.createdAt) {
        const dateObj = new Date(booking.createdAt);
        const dateKey = dateObj.toISOString().split("T")[0];
        if (acc[dateKey]) {
          acc[dateKey]++;
        } else {
          acc[dateKey] = 1;
        }
      }
      return acc;
    }, {});

    let dailyBookings = Object.entries(bookingDates)
      .map(([date, count]) => ({
        date,
        bookings: count as number,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (dailyBookings.length > 7) {
      dailyBookings = dailyBookings.slice(-7);
    }

    // Hotel performance metrics (Filtered)
    const hotelPerformance = await Booking.aggregate([
      { $match: { hotelId: { $in: hotelIds.map(id => id.toString()) } } },
      {
        $group: {
          _id: "$hotelId",
          bookingCount: { $sum: 1 },
          totalRevenue: { $sum: "$totalCost" },
        },
      },
      {
        $addFields: {
          hotelIdObjectId: { $toObjectId: "$_id" }
        }
      },
      {
        $lookup: {
          from: "hotels",
          localField: "hotelIdObjectId",
          foreignField: "_id",
          as: "hotel",
        },
      },
      {
        $unwind: "$hotel",
      },
      {
        $project: {
          _id: "$hotel._id",
          name: "$hotel.name",
          city: "$hotel.city",
          starRating: "$hotel.starRating",
          pricePerNight: "$hotel.pricePerNight",
          bookingCount: 1,
          totalRevenue: 1,
        },
      },
      {
        $sort: { bookingCount: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    const businessInsightsData = {
      overview: {
        totalHotels,
        totalUsers: uniqueGuests, // Renaming semantically in frontend, sending as totalUsers key to keep contract
        totalBookings,
        recentBookings,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        recentRevenue: Math.round(recentRevenue * 100) / 100,
        revenueGrowth: Math.round(revenueGrowth * 100) / 100,
      },
      popularDestinations,
      dailyBookings,
      hotelPerformance,
      lastUpdated: now.toISOString(),
    };

    res.status(200).json(businessInsightsData);
  } catch (error) {
    console.error("Dashboard Error:", error);
    res.status(500).json({
      error: "Failed to fetch business insights data",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

router.get("/forecast", verifyToken, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const now = new Date();
    const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // Fetch owner's hotels first to get IDs
    const myHotels = await Hotel.find({ userId });
    const hotelIds = myHotels.map(h => h._id.toString());

    // Get Owner's bookings
    const myBookings = await Booking.find({ hotelId: { $in: hotelIds } });

    // Get historical data for the last 2 months
    const historicalBookings = myBookings.filter(
      (booking: any) => new Date(booking.createdAt) >= twoMonthsAgo
    );

    // Group bookings by actual week for trend analysis
    const weekGroups = historicalBookings.reduce((acc: any, booking: any) => {
      const bookingDate = new Date(booking.createdAt);
      const weekStart = new Date(bookingDate);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)
      weekStart.setHours(0, 0, 0, 0);

      const weekKey = weekStart.toISOString().split("T")[0];

      if (!acc[weekKey]) {
        acc[weekKey] = {
          week: weekKey,
          bookings: 0,
          revenue: 0,
        };
      }

      acc[weekKey].bookings++;
      acc[weekKey].revenue += booking.totalCost;

      return acc;
    }, {});

    // Convert to array and sort by date
    let weeklyData = Object.values(weekGroups)
      .map((week: any) => ({
        week: week.week,
        bookings: week.bookings,
        revenue: Math.round(week.revenue * 100) / 100,
      }))
      .sort(
        (a: any, b: any) =>
          new Date(a.week).getTime() - new Date(b.week).getTime()
      );

    if (weeklyData.length === 0) {
      weeklyData = [];
    }

    // Simple linear regression for forecasting
    const calculateTrend = (data: number[]) => {
      const n = data.length;
      if (n < 2) return { slope: 0, intercept: 0 };

      const sumX = (n * (n - 1)) / 2;
      const sumY = data.reduce((sum, val) => sum + val, 0);
      const sumXY = data.reduce((sum, val, index) => sum + val * index, 0);
      const sumXX = (n * (n - 1) * (2 * n - 1)) / 6;

      const denom = (n * sumXX - sumX * sumX);
      if (denom === 0) return { slope: 0, intercept: sumY / n };

      const slope = (n * sumXY - sumX * sumY) / denom;
      const intercept = (sumY - slope * sumX) / n;

      return { slope, intercept };
    };

    const bookingTrends = calculateTrend(weeklyData.map((d) => d.bookings));
    const revenueTrends = calculateTrend(weeklyData.map((d) => d.revenue));

    // Generate forecasts for next 4 weeks
    const forecasts = [];
    for (let i = 1; i <= 4; i++) {
      // ... (Prediction logic similar to before, but using calculated trends)
      const weekIndex = weeklyData.length + i - 1;
      let forecastedBookings = 0;
      let forecastedRevenue = 0;

      if (weeklyData.length > 1) {
        forecastedBookings = Math.max(0, Math.round(bookingTrends.slope * weekIndex + bookingTrends.intercept));
        forecastedRevenue = Math.max(0, revenueTrends.slope * weekIndex + revenueTrends.intercept);
      } else if (weeklyData.length === 1) {
        // Fallback for single data point
        forecastedBookings = weeklyData[0].bookings;
        forecastedRevenue = weeklyData[0].revenue;
      }

      const forecastDate = new Date(
        now.getTime() + i * 7 * 24 * 60 * 60 * 1000
      );

      forecasts.push({
        week: forecastDate.toISOString().split("T")[0],
        bookings: forecastedBookings,
        revenue: Math.round(forecastedRevenue * 100) / 100,
        confidence: Math.max(0.6, 1 - i * 0.1),
      });
    }

    const forecastData = {
      historical: weeklyData,
      forecasts,
      seasonalGrowth: 0, // Placeholder as calculation is complex without year-over-year data
      trends: {
        bookingTrend: weeklyData.length > 1 ? (bookingTrends.slope > 0 ? "increasing" : "decreasing") : "stable",
        revenueTrend: weeklyData.length > 1 ? (revenueTrends.slope > 0 ? "increasing" : "decreasing") : "stable",
      },
      lastUpdated: now.toISOString(),
    };

    res.status(200).json(forecastData);
  } catch (error) {
    console.error("Forecast Error:", error);
    res.status(500).json({
      error: "Failed to generate forecasts",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;

