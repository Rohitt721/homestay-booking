import { useQuery } from "react-query";
import * as apiClient from "../api-client";
import {
    ChevronRight,
    Loader2
} from "lucide-react";
import { useState } from "react";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { useMutation, useQueryClient } from "react-query";
import useAppContext from "../hooks/useAppContext";
import {
    CheckCircle2,
    XCircle,
    AlertTriangle,
    ExternalLink,
    ShieldAlert
} from "lucide-react";

const MyGuests = () => {
    const [selectedGuestId, setSelectedGuestId] = useState<string | null>(null);

    const { showToast } = useAppContext();
    const queryClient = useQueryClient();

    const { data: guests, isLoading } = useQuery(
        "fetchMyGuests",
        apiClient.fetchMyGuests,
        {
            onError: () => { },
        }
    );

    // Filter guests to ONLY show those who have a pending ID submission in their stay history
    const pendingGuests = guests?.filter((guest) =>
        guest.stayHistory.some((stay: any) => stay.status === "ID_SUBMITTED")
    );

    const selectedGuest = pendingGuests?.find((g) => g._id === selectedGuestId);

    const verifyMutation = useMutation(
        ({ bookingId, action, reason }: { bookingId: string; action: "approve" | "reject"; reason?: string }) => {
            console.log("Calling verifyBookingId with:", { bookingId, action, reason });
            return apiClient.verifyBookingId(bookingId, action, reason);
        },
        {
            onSuccess: (data) => {
                console.log("Verification successful:", data);
                showToast({ title: "Updated", description: "Verification successful", type: "SUCCESS" });
                queryClient.invalidateQueries("fetchMyGuests");
            },
            onError: (error: Error) => {
                console.error("Verification error:", error);
                showToast({ title: "Error", description: error.message, type: "ERROR" });
            }
        }
    );

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">ID Verification Center</h1>
                <p className="text-gray-600 mt-1 uppercase text-xs font-bold tracking-widest flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
                    Pending Review requests
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Pending Guests Sidebar */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-white rounded-2xl shadow-soft border border-gray-100 divide-y divide-gray-100 overflow-hidden">
                        <div className="bg-gray-50/50 p-4 border-b border-gray-100">
                            <h3 className="text-sm font-bold text-gray-700">GUESTS AWAITING REVIEW</h3>
                        </div>
                        {pendingGuests?.length === 0 ? (
                            <div className="p-12 text-center text-gray-400 bg-gray-50/20">
                                <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-20 text-green-500" />
                                <p className="text-sm font-medium italic">All caught up! No pending verifications.</p>
                            </div>
                        ) : (
                            pendingGuests?.map((guest) => (
                                <button
                                    key={guest._id}
                                    onClick={() => setSelectedGuestId(guest._id)}
                                    className={`w-full p-4 text-left hover:bg-gray-50 transition-colors flex items-center justify-between group ${selectedGuestId === guest._id ? "bg-primary-50 hover:bg-primary-50" : ""
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold">
                                                {guest.firstName[0]}{guest.lastName[0]}
                                            </div>
                                            <span className="absolute -top-1 -right-1 flex h-4 w-4">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-4 w-4 bg-red-600 border-2 border-white flex items-center justify-center">
                                                    <ShieldAlert className="w-2.5 h-2.5 text-white" />
                                                </span>
                                            </span>
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900">{guest.firstName} {guest.lastName}</h3>
                                            <p className="text-xs text-gray-500">{guest.email}</p>
                                        </div>
                                    </div>
                                    <ChevronRight className={`h-4 w-4 text-gray-400 transition-transform group-hover:translate-x-1 ${selectedGuestId === guest._id ? "text-primary-600 translate-x-1" : ""
                                        }`} />
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Verification Detail Area */}
                <div className="lg:col-span-2 space-y-6">
                    {selectedGuest ? (
                        <div className="space-y-6">
                            {/* Verification List for selected guest */}
                            {selectedGuest.stayHistory
                                .filter((stay: any) => stay.status === "ID_SUBMITTED")
                                .map((stay: any) => (
                                    <Card key={stay.bookingId} className="border-2 border-primary-100 bg-white shadow-soft overflow-hidden">
                                        <CardHeader className="bg-primary-50/50 border-b border-primary-100 pb-4">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <CardTitle className="text-lg flex items-center gap-2 text-primary-900">
                                                        <ShieldAlert className="h-5 w-5 text-primary-600" />
                                                        Verify Booking ID
                                                    </CardTitle>
                                                    <div className="mt-1 flex items-center gap-2 text-sm text-gray-500 italic">
                                                        <span className="font-bold text-gray-900">Hotel: {stay.hotelName}</span>
                                                        <span>•</span>
                                                        <span>Stay: {new Date(stay.checkIn).toLocaleDateString()} - {new Date(stay.checkOut).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                                <Badge className="bg-blue-600 text-white rounded-md px-3 py-1 uppercase text-[10px] tracking-widest">
                                                    {stay.idProof?.idType || "GOVT ID"}
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-6 space-y-8">
                                            {/* ID Images */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-3">
                                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest text-center">Front Profile Image</p>
                                                    <div className="relative group overflow-hidden rounded-xl border-4 border-gray-100 shadow-inner bg-gray-50">
                                                        <img
                                                            src={stay.idProof?.frontImage}
                                                            className="w-full aspect-video object-contain transition-transform duration-500 group-hover:scale-105"
                                                            alt="Front ID"
                                                        />
                                                        <a href={stay.idProof?.frontImage} target="_blank" rel="noreferrer" className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                            <div className="flex items-center gap-2 text-white font-bold text-sm">
                                                                <ExternalLink className="w-5 h-5" /> View Full Image
                                                            </div>
                                                        </a>
                                                    </div>
                                                </div>

                                                {stay.idProof?.backImage && (
                                                    <div className="space-y-3">
                                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest text-center">Back Profile Image</p>
                                                        <div className="relative group overflow-hidden rounded-xl border-4 border-gray-100 shadow-inner bg-gray-50">
                                                            <img
                                                                src={stay.idProof?.backImage}
                                                                className="w-full aspect-video object-contain transition-transform duration-500 group-hover:scale-105"
                                                                alt="Back ID"
                                                            />
                                                            <a href={stay.idProof?.backImage} target="_blank" rel="noreferrer" className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                                <div className="flex items-center gap-2 text-white font-bold text-sm">
                                                                    <ExternalLink className="w-5 h-5" /> View Full Image
                                                                </div>
                                                            </a>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex gap-4 pt-4 border-t border-gray-100">
                                                <Button
                                                    type="button"
                                                    onClick={() => {
                                                        console.log("Approve clicked for bookingId:", stay.bookingId);
                                                        verifyMutation.mutate({ bookingId: stay.bookingId, action: "approve" });
                                                    }}
                                                    disabled={verifyMutation.isLoading}
                                                    className="bg-green-600 hover:bg-green-700 text-white flex-1 font-bold h-14 rounded-2xl transition-all shadow-lg shadow-green-100 text-lg"
                                                >
                                                    <CheckCircle2 className="w-6 h-6 mr-2" />
                                                    APPROVE ID
                                                </Button>
                                                <Button
                                                    type="button"
                                                    onClick={() => {
                                                        console.log("Reject clicked for bookingId:", stay.bookingId);
                                                        const reason = window.prompt("Enter rejection reason (e.g. Blurred Image, Name Mismatch):");
                                                        if (reason) {
                                                            console.log("Rejecting with reason:", reason);
                                                            verifyMutation.mutate({ bookingId: stay.bookingId, action: "reject", reason });
                                                        }
                                                    }}
                                                    disabled={verifyMutation.isLoading}
                                                    variant="destructive"
                                                    className="flex-1 font-bold h-14 rounded-2xl shadow-lg shadow-red-100 text-lg"
                                                >
                                                    <XCircle className="w-6 h-6 mr-2" />
                                                    REJECT ID
                                                </Button>
                                            </div>

                                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                                                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                                                <p className="text-xs text-amber-800 leading-relaxed font-medium italic">
                                                    Ensure details on ID match the guest profile ({selectedGuest.firstName} {selectedGuest.lastName}).
                                                    Rejecting will initiate a full refund.
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                        </div>
                    ) : (
                        <div className="h-full min-h-[500px] flex flex-col items-center justify-center bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-200 text-gray-400">
                            <div className="bg-white p-6 rounded-full shadow-soft mb-6">
                                <ShieldAlert className="h-16 w-16 opacity-20 text-indigo-600" />
                            </div>
                            <p className="text-xl font-bold text-gray-500">Select a request to start review</p>
                            <p className="text-sm mt-2">Only guests with pending ID submissions are shown here.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MyGuests;
