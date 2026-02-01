import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { AlertTriangle, X, Loader2, Upload, FileText, Image as ImageIcon } from "lucide-react";
import { BookingType } from "../../../shared/types";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import useAppContext from "../hooks/useAppContext";

// Report Reasons - moved here since shared folder isn't compiled for frontend imports
type ReasonWithSubReasons = { reason: string; subReasons?: string[] };

const REPORT_REASONS: {
    UNIVERSAL: ReasonWithSubReasons[];
    FUTURE: ReasonWithSubReasons[];
    ONGOING: ReasonWithSubReasons[];
    PAST: ReasonWithSubReasons[];
} = {
    // Universal reasons apply to all booking states
    UNIVERSAL: [
        { reason: "Incorrect booking details", subReasons: ["Wrong room type"] },
        { reason: "Payment-related issue", subReasons: ["Refund not received"] },
        { reason: "Owner / hotel unresponsive", subReasons: ["No reply to messages", "Calls/messages ignored"] },
        { reason: "Policy or rule violation", subReasons: ["Hidden rules", "Different rules than shown on listing"] },
        { reason: "Suspicious or fraudulent activity", subReasons: ["Fake listing", "Asking for off-platform payment", "Fake confirmation"] },
        { reason: "Other" },
    ],
    // Future booking specific - booking hasn't started yet
    FUTURE: [
        { reason: "Owner asking to cancel without reason" },
        { reason: "Hotel unavailable after confirmation" },
        { reason: "Forced upgrade / extra charges requested" },
        { reason: "Booking confirmation mismatch" },
    ],
    // Ongoing booking specific - currently checked in
    ONGOING: [
        { reason: "Room not as described" },
        { reason: "Cleanliness / hygiene issue" },
        { reason: "Amenities not provided" },
        { reason: "Staff misbehavior" },
        { reason: "Safety or security concern" },
        { reason: "Noise / disturbance issue" },
    ],
    // Past booking specific - stay completed
    PAST: [
        { reason: "Refund not processed" },
        { reason: "Overcharged during stay" },
        { reason: "Property condition mismatch" },
        { reason: "Misleading photos or description" },
    ],
};

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    booking: BookingType;
    hotelName: string;
    hotelId: string;
    ownerId: string;
}

interface ReportFormData {
    reason: string;
    subReason?: string;
    message: string;
}

type BookingState = "future" | "ongoing" | "past";

// Helper to determine booking state
const getBookingState = (checkIn: Date, checkOut: Date): BookingState => {
    const now = new Date();
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (now < checkInDate) return "future";
    if (now >= checkInDate && now <= checkOutDate) return "ongoing";
    return "past";
};

const ReportModal = ({ isOpen, onClose, booking, hotelName, hotelId, ownerId }: ReportModalProps) => {
    const { showToast } = useAppContext();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedReason, setSelectedReason] = useState<string>("");
    const [files, setFiles] = useState<File[]>([]);

    const { register, handleSubmit, reset, formState: { errors } } = useForm<ReportFormData>();

    // Get booking state and available reasons
    const bookingState = useMemo(() => getBookingState(booking.checkIn, booking.checkOut), [booking.checkIn, booking.checkOut]);

    const availableReasons = useMemo(() => {
        const universal = REPORT_REASONS.UNIVERSAL;
        let stateSpecific: typeof REPORT_REASONS.FUTURE = [];

        switch (bookingState) {
            case "future":
                stateSpecific = REPORT_REASONS.FUTURE;
                break;
            case "ongoing":
                stateSpecific = REPORT_REASONS.ONGOING;
                break;
            case "past":
                stateSpecific = REPORT_REASONS.PAST;
                break;
        }

        return [...universal, ...stateSpecific];
    }, [bookingState]);

    // Get sub-reasons for selected reason
    const subReasons = useMemo((): string[] | undefined => {
        const found = availableReasons.find(r => r.reason === selectedReason);
        return found?.subReasons;
    }, [selectedReason, availableReasons]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files).slice(0, 5 - files.length);
            setFiles(prev => [...prev, ...newFiles].slice(0, 5));
        }
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const onSubmit = async (data: ReportFormData) => {
        console.log("🚀 Submitting report with data:", data);
        if (!selectedReason) {
            showToast({ title: "Please select a reason", type: "ERROR" });
            return;
        }

        setIsSubmitting(true);

        try {
            const formData = new FormData();
            formData.append("bookingId", booking._id);
            formData.append("reason", selectedReason);
            if (data.subReason) formData.append("subReason", data.subReason);
            formData.append("message", data.message);

            files.forEach(file => {
                formData.append("evidence", file);
            });

            // Get token from localStorage (auth strategy uses JWT in localStorage)
            const token = localStorage.getItem("session_id");
            console.log("🔑 Auth Token present:", !!token);

            const requestUrl = `${import.meta.env.VITE_API_BASE_URL || ""}/api/reports`;
            console.log("➡️ Sending POST request to:", requestUrl);

            const headers: HeadersInit = {};
            if (token) {
                headers["Authorization"] = `Bearer ${token}`;
            }

            const response = await fetch(requestUrl, {
                method: "POST",
                headers: headers,
                body: formData,
                // credentials: "include" is risky if backend doesn't handle CORS correctly for it + header
                // but usually fine. For safety with JWT, header is key.
            });

            console.log("⬅️ Response received:", response.status, response.statusText);

            if (!response.ok) {
                // Try to parse JSON, but handle HTML/text errors (like 404s)
                const contentType = response.headers.get("content-type");
                if (contentType && contentType.indexOf("application/json") !== -1) {
                    const errorData = await response.json();
                    console.error("❌ API Error JSON:", errorData);
                    throw new Error(errorData.message || "Failed to submit report");
                } else {
                    const errorText = await response.text();
                    console.error("❌ API Error Text:", errorText);
                    throw new Error(`Server error (${response.status}): ${response.statusText}`);
                }
            }

            console.log("✅ Report submitted successfully");
            showToast({ title: "Report submitted successfully! We'll review it shortly.", type: "SUCCESS" });
            reset();
            setSelectedReason("");
            setFiles([]);
            onClose();
        } catch (error: any) {
            console.error("🔥 Submission Exception:", error);
            showToast({ title: error.message || "Failed to submit report", type: "ERROR" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const getBookingStateLabel = (state: BookingState) => {
        switch (state) {
            case "future": return { label: "Upcoming", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" };
            case "ongoing": return { label: "Currently Staying", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" };
            case "past": return { label: "Completed", color: "bg-green-500/20 text-green-400 border-green-500/30" };
        }
    };

    const stateInfo = getBookingStateLabel(bookingState);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] bg-black/90 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-0 overflow-hidden text-white max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="bg-gradient-to-br from-rose-500/20 to-orange-500/20 p-5 relative border-b border-white/5">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-rose-400" />
                            Report an Issue
                        </DialogTitle>
                        <DialogDescription className="text-white/60 text-sm mt-1">
                            {hotelName}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-5">
                    {/* Booking Info */}
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-white/40 uppercase tracking-wider">Booking ID</span>
                            <span className="text-sm font-mono text-white/80">#{booking._id.slice(-8).toUpperCase()}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-white/40 uppercase tracking-wider">Status</span>
                            <span className={`text-xs font-bold px-2 py-1 rounded-full border ${stateInfo.color}`}>
                                {stateInfo.label}
                            </span>
                        </div>
                    </div>

                    {/* Reason Selection */}
                    <div className="space-y-2">
                        <Label className="text-xs font-medium text-white/50">
                            Select Reason <span className="text-rose-400">*</span>
                        </Label>
                        <select
                            value={selectedReason}
                            onChange={(e) => setSelectedReason(e.target.value)}
                            className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:ring-2 focus:ring-rose-500/50 focus:border-transparent transition-all appearance-none cursor-pointer"
                        >
                            <option value="" className="bg-gray-900">Choose a reason...</option>
                            <optgroup label="Universal Issues" className="bg-gray-900">
                                {REPORT_REASONS.UNIVERSAL.map((r) => (
                                    <option key={r.reason} value={r.reason} className="bg-gray-900">{r.reason}</option>
                                ))}
                            </optgroup>
                            {bookingState === "future" && (
                                <optgroup label="Upcoming Booking Issues" className="bg-gray-900">
                                    {REPORT_REASONS.FUTURE.map((r) => (
                                        <option key={r.reason} value={r.reason} className="bg-gray-900">{r.reason}</option>
                                    ))}
                                </optgroup>
                            )}
                            {bookingState === "ongoing" && (
                                <optgroup label="Current Stay Issues" className="bg-gray-900">
                                    {REPORT_REASONS.ONGOING.map((r) => (
                                        <option key={r.reason} value={r.reason} className="bg-gray-900">{r.reason}</option>
                                    ))}
                                </optgroup>
                            )}
                            {bookingState === "past" && (
                                <optgroup label="Past Stay Issues" className="bg-gray-900">
                                    {REPORT_REASONS.PAST.map((r) => (
                                        <option key={r.reason} value={r.reason} className="bg-gray-900">{r.reason}</option>
                                    ))}
                                </optgroup>
                            )}
                        </select>
                    </div>

                    {/* Sub-reason Selection (if available) */}
                    {subReasons && subReasons.length > 0 && (
                        <div className="space-y-2">
                            <Label className="text-xs font-medium text-white/50">
                                Sub-reason (Optional)
                            </Label>
                            <select
                                {...register("subReason")}
                                className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:ring-2 focus:ring-rose-500/50 focus:border-transparent transition-all appearance-none cursor-pointer"
                            >
                                <option value="" className="bg-gray-900">Select specific issue...</option>
                                {subReasons.map((sub) => (
                                    <option key={sub} value={sub} className="bg-gray-900">{sub}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Message */}
                    <div className="space-y-2">
                        <Label htmlFor="message" className="text-xs font-medium text-white/50">
                            Describe Your Issue <span className="text-rose-400">*</span>
                        </Label>
                        <textarea
                            id="message"
                            {...register("message", { required: "Please describe your issue" })}
                            className="w-full min-h-[100px] p-3 rounded-xl bg-white/5 border border-white/10 focus:ring-2 focus:ring-rose-500/50 focus:border-transparent transition-all resize-none text-sm text-white placeholder:text-white/20"
                            placeholder="Please provide as much detail as possible about the issue..."
                        />
                        {errors.message && (
                            <span className="text-[10px] text-rose-400 font-medium">{errors.message.message}</span>
                        )}
                    </div>

                    {/* Evidence Upload */}
                    <div className="space-y-2">
                        <Label className="text-xs font-medium text-white/50">
                            Upload Evidence (Optional - Max 5 files)
                        </Label>
                        <div className="border-2 border-dashed border-white/10 rounded-xl p-4 hover:border-white/20 transition-colors">
                            <input
                                type="file"
                                multiple
                                accept="image/*,.pdf"
                                onChange={handleFileChange}
                                className="hidden"
                                id="evidence-upload"
                                disabled={files.length >= 5}
                            />
                            <label
                                htmlFor="evidence-upload"
                                className={`flex flex-col items-center gap-2 cursor-pointer ${files.length >= 5 ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <Upload className="w-8 h-8 text-white/30" />
                                <span className="text-xs text-white/40">Click to upload images or PDFs</span>
                            </label>
                        </div>

                        {/* File List */}
                        {files.length > 0 && (
                            <div className="space-y-2 mt-3">
                                {files.map((file, index) => (
                                    <div key={index} className="flex items-center gap-2 bg-white/5 p-2 rounded-lg">
                                        {file.type.startsWith('image/') ? (
                                            <ImageIcon className="w-4 h-4 text-blue-400" />
                                        ) : (
                                            <FileText className="w-4 h-4 text-orange-400" />
                                        )}
                                        <span className="text-xs text-white/70 flex-1 truncate">{file.name}</span>
                                        <button
                                            type="button"
                                            onClick={() => removeFile(index)}
                                            className="text-white/40 hover:text-rose-400 transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex gap-3 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="flex-1 py-5 rounded-xl border-white/10 hover:bg-white/5 text-white/70 font-semibold"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting || !selectedReason}
                            className="flex-1 py-5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-lg shadow-rose-500/20 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                "Submit Report"
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default ReportModal;
