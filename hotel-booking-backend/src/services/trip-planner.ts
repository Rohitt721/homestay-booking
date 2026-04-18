import { GoogleGenerativeAI } from "@google/generative-ai";
import Hotel from "../models/hotel";
import Booking from "../models/booking";

// GoogleGenerativeAI will be initialized dynamically
// to ensure process.env is fully loaded and overridden by dotenv

export interface TripPlanInput {
    destination: string;
    startDate: string;
    duration: number; // days
    travelStyle: "adventure" | "cultural" | "relaxation" | "food" | "mixed";
    budget: "budget" | "moderate" | "luxury";
    mustVisitPlaces?: string[];
}

export interface DayActivity {
    time: string;
    activity: string;
    location: string;
    description: string;
    coordinates?: { lat: number; lng: number };
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

// Budget to price range mapping (in INR)
const BUDGET_RANGES = {
    budget: { min: 0, max: 2000 },
    moderate: { min: 2000, max: 5000 },
    luxury: { min: 5000, max: 100000 },
};

/**
 * Generate itinerary using Gemini AI
 */
async function generateItineraryWithAI(input: TripPlanInput): Promise<any> {
    const genAI = new GoogleGenerativeAI((process.env.GEMINI_API_KEY || "").trim());
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const prompt = `
You are a travel planning expert. Generate a detailed day-by-day travel itinerary for the following trip:

Destination: ${input.destination}
Duration: ${input.duration} days
Travel Style: ${input.travelStyle}
Budget Level: ${input.budget}
${input.mustVisitPlaces?.length ? `Must Visit Places: ${input.mustVisitPlaces.join(", ")}` : ""}

For EACH day, provide:
1. 3-5 activities with specific times (morning, afternoon, evening)
2. The area/neighborhood where activities are located
3. Brief descriptions of each activity

Return the response in this exact JSON format:
{
  "summary": "Brief 2-3 sentence overview of the trip",
  "days": [
    {
      "day": 1,
      "areaName": "Area name where most activities happen",
      "coordinates": { "lat": 12.34, "lng": 56.78 },
      "activities": [
        {
          "time": "9:00 AM",
          "activity": "Activity name",
          "location": "Specific location name",
          "description": "Brief description",
          "coordinates": { "lat": 12.345, "lng": 56.789 }
        }
      ]
    }
  ]
}

Important: 
- Make activities appropriate for the ${input.travelStyle} travel style
- Consider ${input.budget} budget level for activity suggestions
- End each day in a different area to explore more of the destination
- Provide realistic approximate latitude and longitude coordinates for the "areaName"
- Return ONLY valid JSON, no markdown or extra text
`;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Parse JSON from response (handle potential markdown wrapping)
        let jsonText = text;
        if (text.includes("```json")) {
            jsonText = text.split("```json")[1].split("```")[0];
        } else if (text.includes("```")) {
            jsonText = text.split("```")[1].split("```")[0];
        }

        return JSON.parse(jsonText.trim());
    } catch (error) {
        console.error("AI Itinerary generation error:", error);
        // Return a fallback basic itinerary
        return generateFallbackItinerary(input);
    }
}

/**
 * Fallback itinerary if AI fails
 */
function generateFallbackItinerary(input: TripPlanInput): any {
    const days = [];
    for (let i = 1; i <= input.duration; i++) {
        days.push({
            day: i,
            areaName: `${input.destination} - Area ${i}`,
            activities: [
                {
                    time: "9:00 AM",
                    activity: "Morning Exploration",
                    location: `Popular spot in ${input.destination}`,
                    description: "Start your day exploring local attractions",
                },
                {
                    time: "12:00 PM",
                    activity: "Local Cuisine Experience",
                    location: "Local Restaurant",
                    description: "Enjoy authentic local food",
                },
                {
                    time: "3:00 PM",
                    activity: "Afternoon Activity",
                    location: `${input.destination} landmark`,
                    description: "Continue your adventure",
                },
                {
                    time: "7:00 PM",
                    activity: "Evening Leisure",
                    location: "City center",
                    description: "Relax and enjoy the evening atmosphere",
                },
            ],
        });
    }

    return {
        summary: `A ${input.duration}-day ${input.travelStyle} trip to ${input.destination}, tailored for ${input.budget} travelers.`,
        days,
    };
}

/**
 * Check hotel availability for a specific date range
 */
async function checkHotelAvailability(
    hotelId: string,
    checkIn: Date,
    checkOut: Date
): Promise<"available" | "limited" | "unavailable"> {
    try {
        const overlappingBookings = await Booking.countDocuments({
            hotelId,
            status: { $nin: ["CANCELLED", "REJECTED", "REFUNDED"] },
            checkIn: { $lt: checkOut },
            checkOut: { $gt: checkIn },
        });

        if (overlappingBookings === 0) return "available";
        if (overlappingBookings < 3) return "limited";
        return "unavailable";
    } catch (error) {
        console.error("Availability check error:", error);
        return "available"; // Default to available on error
    }
}

/**
 * Find nearby hotels based on city/destination, budget, and coordinates
 */
async function findNearbyHotels(
    destination: string,
    budget: "budget" | "moderate" | "luxury",
    checkIn: Date,
    checkOut: Date,
    coordinates?: { lat: number; lng: number },
    limit: number = 3
): Promise<HotelRecommendation[]> {
    const priceRange = BUDGET_RANGES[budget];

    try {
        let query: any = {
            status: "PUBLISHED",
            pricePerNight: { $gte: priceRange.min, $lte: priceRange.max },
        };

        // Use geospatial search if coordinates are available
        if (coordinates && coordinates.lat && coordinates.lng) {
            query.location = {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [coordinates.lng, coordinates.lat],
                    },
                    $maxDistance: 10000, // 10km radius
                },
            };
        } else {
            // Fallback to city/destination search
            query.$or = [
                { city: { $regex: destination, $options: "i" } },
                { country: { $regex: destination, $options: "i" } },
                { "location.address.city": { $regex: destination, $options: "i" } },
            ];
        }

        const hotels = await Hotel.find(query)
            .sort(coordinates ? {} : { starRating: -1, pricePerNight: 1 }) // $near already sorts by distance
            .limit(limit * 2);

        const recommendations: HotelRecommendation[] = [];

        for (const hotel of hotels) {
            if (recommendations.length >= limit) break;

            const availability = await checkHotelAvailability(
                hotel._id.toString(),
                checkIn,
                checkOut
            );

            if (availability !== "unavailable") {
                recommendations.push({
                    hotelId: hotel._id.toString(),
                    name: hotel.name,
                    pricePerNight: hotel.pricePerNight,
                    starRating: hotel.starRating,
                    availabilityStatus: availability,
                    imageUrl: hotel.imageUrls?.[0],
                    city: hotel.city,
                });
            }
        }

        return recommendations;
    } catch (error) {
        console.error("Hotel search error:", error);
        // If geospatial fails (e.g. no index), fallback to simple city search
        if (coordinates) {
            return findNearbyHotels(destination, budget, checkIn, checkOut, undefined, limit);
        }
        return [];
    }
}

/**
 * Main function to generate a complete trip plan
 */
export async function generateTripPlan(input: TripPlanInput): Promise<TripPlan> {
    // 1. Generate AI itinerary
    const aiItinerary = await generateItineraryWithAI(input);

    // 2. Calculate date for each day
    const startDate = new Date(input.startDate);
    const days: DayPlan[] = [];

    for (let i = 0; i < input.duration; i++) {
        const dayDate = new Date(startDate);
        dayDate.setDate(startDate.getDate() + i);

        const nextDate = new Date(dayDate);
        nextDate.setDate(dayDate.getDate() + 1);

        const aiDay = aiItinerary.days?.[i] || {
            areaName: input.destination,
            activities: [],
        };

        // 3. Find hotels for each day's stay
        const hotels = await findNearbyHotels(
            input.destination,
            input.budget,
            dayDate,
            nextDate,
            aiDay.coordinates
        );

        const fallbackMessage =
            hotels.length === 0
                ? `No hotels available in ${input.destination} for this date. Consider nearby areas.`
                : undefined;

        days.push({
            day: i + 1,
            date: dayDate.toISOString().split("T")[0],
            activities: aiDay.activities || [],
            areaName: aiDay.areaName || input.destination,
            hotels,
            fallbackMessage,
        });
    }

    // Calculate end date
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + input.duration - 1);

    return {
        destination: input.destination,
        startDate: input.startDate,
        endDate: endDate.toISOString().split("T")[0],
        duration: input.duration,
        travelStyle: input.travelStyle,
        budget: input.budget,
        days,
        summary: aiItinerary.summary || `Your ${input.duration}-day trip to ${input.destination}`,
    };
}

/**
 * Find alternate hotels in nearby areas (expanded radius)
 */
export async function findAlternateHotels(
    originalDestination: string,
    budget: "budget" | "moderate" | "luxury",
    checkIn: Date,
    checkOut: Date
): Promise<HotelRecommendation[]> {
    const priceRange = BUDGET_RANGES[budget];

    try {
        // Search without city filter to get any available hotels
        const hotels = await Hotel.find({
            status: "PUBLISHED",
            pricePerNight: { $gte: priceRange.min, $lte: priceRange.max },
        })
            .sort({ starRating: -1 })
            .limit(10);

        const recommendations: HotelRecommendation[] = [];

        for (const hotel of hotels) {
            if (recommendations.length >= 3) break;

            const availability = await checkHotelAvailability(
                hotel._id.toString(),
                checkIn,
                checkOut
            );

            if (availability === "available") {
                recommendations.push({
                    hotelId: hotel._id.toString(),
                    name: hotel.name,
                    pricePerNight: hotel.pricePerNight,
                    starRating: hotel.starRating,
                    availabilityStatus: availability,
                    imageUrl: hotel.imageUrls?.[0],
                    city: hotel.city,
                    distance: `Near ${hotel.city}`,
                });
            }
        }

        return recommendations;
    } catch (error) {
        console.error("Alternate hotel search error:", error);
        return [];
    }
}
