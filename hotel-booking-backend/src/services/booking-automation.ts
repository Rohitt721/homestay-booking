import Booking from "../models/booking";
import Hotel from "../models/hotel";
import User from "../models/user";

export const runAutomatedBookingChecks = async () => {
    console.log("🕒 Running automated booking verification checks...");

    const now = new Date();
    const guestUploadLimit = new Date(now.getTime() - 6 * 60 * 60 * 1000); // 6 hours
    const ownerVerifyLimit = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours

    try {
        // 1. Auto-cancel if guest failed to upload ID within 6 hours
        const expiredGuestUploads = await Booking.find({
            status: "ID_PENDING",
            createdAt: { $lt: guestUploadLimit }
        });

        for (const booking of expiredGuestUploads) {
            console.log(`❌ Auto-cancelling booking ${booking._id}: Guest upload timeout`);
            booking.status = "CANCELLED";
            booking.cancellationReason = "Auto-cancelled: ID proof not uploaded within 6 hours.";
            booking.paymentStatus = "refunded";
            booking.refundAmount = booking.totalCost;
            await booking.save();

            // Revert Analytics
            await Hotel.findByIdAndUpdate(booking.hotelId, { $inc: { totalBookings: -1, totalRevenue: -booking.totalCost } });
            await User.findByIdAndUpdate(booking.userId, { $inc: { totalBookings: -1, totalSpent: -booking.totalCost } });
        }

        // 2. Auto-refund/reject if owner failed to verify within 24 hours
        // (Choice: Auto-confirm or auto-reject? User said "auto-cancellation/refunds for non-compliance")
        const expiredOwnerVerifications = await Booking.find({
            status: "ID_SUBMITTED",
            "idProof.uploadedAt": { $lt: ownerVerifyLimit }
        });

        for (const booking of expiredOwnerVerifications) {
            console.log(`❌ Auto-rejecting booking ${booking._id}: Owner verification timeout`);
            booking.status = "REJECTED";
            booking.rejectionReason = "Auto-rejected: Hotel owner failed to verify ID within 24 hours.";
            booking.paymentStatus = "refunded";
            booking.refundAmount = booking.totalCost;
            if (booking.idProof) booking.idProof.status = "REJECTED";
            await booking.save();

            // Revert Analytics
            await Hotel.findByIdAndUpdate(booking.hotelId, { $inc: { totalBookings: -1, totalRevenue: -booking.totalCost } });
            await User.findByIdAndUpdate(booking.userId, { $inc: { totalBookings: -1, totalSpent: -booking.totalCost } });
        }

        // 3. Auto-delete IDs after checkout (e.g., 7 days after checkout)
        const sevenDaysAfterCheckout = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const bookingsForIdCleanup = await Booking.find({
            checkOut: { $lt: sevenDaysAfterCheckout },
            "idProof.frontImage": { $exists: true, $ne: "" }
        });

        for (const booking of bookingsForIdCleanup) {
            console.log(`🧹 Cleaning up ID proof for booking ${booking._id} (Stay completed 7+ days ago)`);
            if (booking.idProof) {
                booking.idProof.frontImage = ""; // Securely "delete" by clearing
                booking.idProof.backImage = "";
            }
            await booking.save();
        }

    } catch (error) {
        console.error("❌ Error in automated booking checks:", error);
    }
};
