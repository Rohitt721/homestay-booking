import { useQuery } from "react-query";
import * as apiClient from "../api-client";
import {
    ChevronRight,
    Loader2,
    Users,
    ShieldCheck,
    MessageSquare,
    Search,
    Calendar,
    ArrowRight,
    User,
    Mail,
    Phone,
    MapPin,
    Clock,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    ExternalLink,
    ShieldAlert,
    Building2,
    History
} from "lucide-react";
import { useState, useMemo } from "react";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { useMutation, useQueryClient } from "react-query";
import useAppContext from "../hooks/useAppContext";
import ChatModal from "../components/ChatModal";

const MyGuests = () => {
    const [activeSection, setActiveSection] = useState<"list" | "verification" | "conversations">("list");

    // Chat Modal State
    const [isChatModalOpen, setIsChatModalOpen] = useState(false);
    const [chatBookingData, setChatBookingData] = useState<{ id: string, hotelName: string, receiverName: string } | null>(null);

    const { showToast } = useAppContext();
    const queryClient = useQueryClient();

    const { data: guests, isLoading: isGuestsLoading } = useQuery(
        "fetchMyGuests",
        apiClient.fetchMyGuests
    );

    const { data: chats, isLoading: isChatsLoading } = useQuery(
        "fetchOwnerChats",
        apiClient.fetchOwnerChats,
        {
            enabled: activeSection === "conversations"
        }
    );

    // Filter Logic for Sections
    const filteredData = useMemo(() => {
        if (!guests) return { recent: [], present: [], upcoming: [], verification: [] };

        const today = new Date();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(today.getDate() - 7);
        const sevenDaysAhead = new Date();
        sevenDaysAhead.setDate(today.getDate() + 7);

        const recent: any[] = [];
        const present: any[] = [];
        const upcoming: any[] = [];
        const verification: any[] = [];

        guests.forEach(guest => {
            guest.stayHistory.forEach((stay: any) => {
                const checkIn = new Date(stay.checkIn);
                const checkOut = new Date(stay.checkOut);

                // ID Verification filter
                if (stay.status === "ID_SUBMITTED") {
                    verification.push({ ...guest, currentStay: stay });
                }

                // Time-based filtering for Guest List
                if (today >= checkIn && today <= checkOut) {
                    present.push({ ...guest, currentStay: stay });
                } else if (checkOut >= sevenDaysAgo && checkOut < today) {
                    recent.push({ ...guest, currentStay: stay });
                } else if (checkIn > today && checkIn <= sevenDaysAhead) {
                    upcoming.push({ ...guest, currentStay: stay });
                }
            });
        });

        return { recent, present, upcoming, verification };
    }, [guests]);

    const verifyMutation = useMutation(
        ({ bookingId, action, reason }: { bookingId: string; action: "approve" | "reject"; reason?: string }) => {
            return apiClient.verifyBookingId(bookingId, action, reason);
        },
        {
            onSuccess: () => {
                showToast({ title: "Success", description: "Verification status updated", type: "SUCCESS" });
                queryClient.invalidateQueries("fetchMyGuests");
            },
            onError: (error: Error) => {
                showToast({ title: "Error", description: error.message, type: "ERROR" });
            }
        }
    );

    if (isGuestsLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
                <div className="relative">
                    <div className="h-20 w-20 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                    <Building2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-indigo-600" />
                </div>
                <div className="text-center">
                    <h2 className="text-xl font-bold text-gray-900">Synchronizing Guests</h2>
                    <p className="text-gray-500 mt-1">Collecting records from your properties...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-[1400px] mx-auto pb-20">
            <div className="flex flex-col lg:flex-row gap-12">
                {/* Left Sidebar Navigation */}
                <div className="lg:w-80 shrink-0">
                    <div className="sticky top-24 space-y-8">
                        <div>
                            <h1 className="text-4xl font-black text-gray-900 tracking-tighter mb-2">Guests</h1>
                            <p className="text-gray-500 font-medium">Manage stays & security</p>
                        </div>

                        <nav className="flex flex-col gap-2">
                            {[
                                { id: "list", label: "Directory", icon: Users },
                                { id: "verification", label: "ID Verification", icon: ShieldCheck, badge: filteredData.verification.length },
                                { id: "conversations", label: "Conversations", icon: MessageSquare, badge: chats?.length }
                            ].map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveSection(item.id as any)}
                                    className={`group flex items-center justify-between px-5 py-4 rounded-2xl transition-all duration-300 font-bold ${activeSection === item.id
                                        ? "bg-indigo-600 text-white shadow-xl shadow-indigo-100"
                                        : "text-gray-500 hover:bg-gray-50 hover:text-indigo-600"
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <item.icon className={`w-5 h-5 transition-transform duration-300 ${activeSection === item.id ? "" : "group-hover:scale-110"}`} />
                                        <span className="text-[15px]">{item.label}</span>
                                    </div>
                                    {item.badge !== undefined && item.badge > 0 && (
                                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black tracking-tight ${activeSection === item.id ? "bg-white text-indigo-600" : "bg-indigo-100 text-indigo-600"
                                            }`}>
                                            {item.badge}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </nav>

                        <div className="p-8 rounded-[2.5rem] bg-gray-50 border border-gray-100 space-y-6">
                            <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Live Status</h4>
                            <div className="space-y-5">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-bold text-gray-600">On-site</span>
                                    <span className="h-8 w-8 rounded-xl bg-white flex items-center justify-center font-black text-indigo-600 shadow-sm">{filteredData.present.length}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-bold text-gray-600">Pending</span>
                                    <span className="h-8 w-8 rounded-xl bg-white flex items-center justify-center font-black text-orange-600 shadow-sm">{filteredData.verification.length}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1">
                    <div className="animate-in fade-in slide-in-from-right-8 duration-700">
                        {/* 1. GUEST LIST SECTION */}
                        {activeSection === "list" && (
                            <div className="space-y-16">
                                {[
                                    { title: "On-site Guests", data: filteredData.present, icon: Building2, color: "bg-emerald-50 text-emerald-600" },
                                    { title: "Incoming Residents", data: filteredData.upcoming, icon: Calendar, color: "bg-blue-50 text-blue-600" },
                                    { title: "Past History", data: filteredData.recent, icon: History, color: "bg-gray-100 text-gray-600" }
                                ].map((group, idx) => (
                                    <section key={idx} className="space-y-6">
                                        <div className="flex items-center gap-4">
                                            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${group.color}`}>
                                                <group.icon className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black text-gray-900">{group.title}</h3>
                                                <p className="text-sm text-gray-500 font-medium">Total {group.data.length} records</p>
                                            </div>
                                        </div>

                                        {group.data.length === 0 ? (
                                            <div className="bg-gray-50/50 rounded-[2.5rem] py-16 text-center border-2 border-dashed border-gray-100">
                                                <p className="text-gray-400 font-bold italic">No guests currently in this category</p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                                {group.data.map((item, i) => (
                                                    <Card key={i} className="rounded-[2.2rem] border-none bg-white hover:shadow-[0_20px_50px_rgba(0,0,0,0.04)] transition-all duration-500 overflow-hidden group">
                                                        <CardContent className="p-8 flex items-center justify-between">
                                                            <div className="flex items-center gap-6">
                                                                <div className="h-16 w-16 bg-gray-50 rounded-[1.4rem] flex items-center justify-center text-gray-900 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
                                                                    <User className="h-7 w-7" />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <h4 className="text-lg font-black text-gray-900 tracking-tight">{item.firstName} {item.lastName}</h4>
                                                                    <div className="flex flex-col gap-1">
                                                                        <div className="flex items-center gap-2 text-sm font-bold text-indigo-600">
                                                                            <Building2 className="h-3.5 w-3.5" />
                                                                            {item.currentStay.hotelName}
                                                                        </div>
                                                                        <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                                                                            <Calendar className="h-3.5 w-3.5" />
                                                                            {new Date(item.currentStay.checkIn).toLocaleDateString()} - {new Date(item.currentStay.checkOut).toLocaleDateString()}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <Button
                                                                onClick={() => {
                                                                    setChatBookingData({
                                                                        id: item.currentStay.bookingId,
                                                                        hotelName: item.currentStay.hotelName,
                                                                        receiverName: `${item.firstName} ${item.lastName}`
                                                                    });
                                                                    setIsChatModalOpen(true);
                                                                }}
                                                                className="h-14 w-14 rounded-2xl bg-gray-50 text-gray-900 hover:bg-indigo-600 hover:text-white transition-all duration-300 shadow-none border-none"
                                                                variant="outline"
                                                                size="icon"
                                                            >
                                                                <MessageSquare className="w-6 h-6" />
                                                            </Button>
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            </div>
                                        )}
                                    </section>
                                ))}
                            </div>
                        )}

                        {/* 2. ID VERIFICATION SECTION */}
                        {activeSection === "verification" && (
                            <div className="max-w-4xl space-y-10">
                                {filteredData.verification.length === 0 ? (
                                    <div className="bg-gray-50 rounded-[3rem] py-32 text-center border-2 border-dashed border-gray-100">
                                        <div className="h-24 w-24 bg-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm">
                                            <ShieldCheck className="w-12 h-12 text-emerald-400" />
                                        </div>
                                        <h3 className="text-2xl font-black text-gray-900">Security Cleared</h3>
                                        <p className="text-gray-500 font-medium mt-2">All guest identities have been successfully verified.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-12">
                                        {filteredData.verification.map((item, i) => (
                                            <div key={i} className="bg-white rounded-[3rem] p-10 shadow-xl shadow-gray-100 border border-gray-50 space-y-10">
                                                <div className="flex flex-col md:flex-row justify-between gap-8">
                                                    <div className="flex items-center gap-6">
                                                        <div className="h-20 w-20 bg-orange-50 rounded-3xl flex items-center justify-center">
                                                            <ShieldAlert className="w-10 h-10 text-orange-600" />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <h3 className="text-2xl font-black text-gray-900">Review Identity</h3>
                                                            <p className="text-gray-500 font-bold">{item.firstName} {item.lastName} • <span className="text-indigo-600">{item.currentStay.hotelName}</span></p>
                                                        </div>
                                                    </div>
                                                    <Badge className="bg-orange-600 text-white rounded-2xl h-10 px-6 font-black uppercase text-xs tracking-widest self-start md:self-center">Awaiting Review</Badge>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                                    <div className="space-y-4">
                                                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Document Front</label>
                                                        <div className="relative group rounded-[2rem] overflow-hidden bg-gray-100 aspect-[4/3] border-4 border-gray-50 shadow-inner">
                                                            <img src={item.currentStay.idProof?.frontImage} className="w-full h-full object-cover" alt="Front" />
                                                            <a href={item.currentStay.idProof?.frontImage} target="_blank" rel="noreferrer" className="absolute inset-0 bg-gray-900/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                                                                <ExternalLink className="text-white w-10 h-10" />
                                                            </a>
                                                        </div>
                                                    </div>
                                                    {item.currentStay.idProof?.backImage && (
                                                        <div className="space-y-4">
                                                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Document Back</label>
                                                            <div className="relative group rounded-[2rem] overflow-hidden bg-gray-100 aspect-[4/3] border-4 border-gray-50 shadow-inner">
                                                                <img src={item.currentStay.idProof?.backImage} className="w-full h-full object-cover" alt="Back" />
                                                                <a href={item.currentStay.idProof?.backImage} target="_blank" rel="noreferrer" className="absolute inset-0 bg-gray-900/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                                                                    <ExternalLink className="text-white w-10 h-10" />
                                                                </a>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                                    <Button
                                                        onClick={() => verifyMutation.mutate({ bookingId: item.currentStay.bookingId, action: "approve" })}
                                                        className="flex-1 bg-gray-900 hover:bg-black text-white h-16 rounded-2xl font-black text-lg transition-transform hover:scale-[1.02]"
                                                    >
                                                        <CheckCircle2 className="w-6 h-6 mr-3 text-emerald-400" />
                                                        Approve Documents
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        onClick={() => {
                                                            const reason = window.prompt("Rejection reason:");
                                                            if (reason) verifyMutation.mutate({ bookingId: item.currentStay.bookingId, action: "reject", reason });
                                                        }}
                                                        className="flex-1 h-16 rounded-2xl font-bold text-gray-400 hover:text-red-600 hover:bg-red-50 border-none trasition-colors"
                                                    >
                                                        Refuse Access
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 3. CONVERSATIONS SECTION */}
                        {activeSection === "conversations" && (
                            <div className="space-y-6">
                                {isChatsLoading ? (
                                    <div className="py-24 flex justify-center"><Loader2 className="w-12 h-12 animate-spin text-indigo-600" /></div>
                                ) : chats?.length === 0 ? (
                                    <div className="bg-gray-50 rounded-[3rem] py-32 text-center border-2 border-dashed border-gray-100">
                                        <div className="h-24 w-24 bg-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm">
                                            <MessageSquare className="w-12 h-12 text-indigo-200" />
                                        </div>
                                        <h3 className="text-2xl font-black text-gray-900">Quiet Inbox</h3>
                                        <p className="text-gray-500 font-medium mt-2">Your conversations with guests will appear here.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-6">
                                        {chats?.map((chat: any) => (
                                            <div
                                                key={chat._id}
                                                className="group bg-white rounded-[2.5rem] p-8 flex items-center justify-between hover:shadow-2xl hover:shadow-indigo-50/50 transition-all duration-500 cursor-pointer border border-transparent hover:border-indigo-100"
                                                onClick={() => {
                                                    setChatBookingData({
                                                        id: chat._id,
                                                        hotelName: chat.hotelId.name,
                                                        receiverName: `${chat.userId.firstName} ${chat.userId.lastName}`
                                                    });
                                                    setIsChatModalOpen(true);
                                                }}
                                            >
                                                <div className="flex items-center gap-8">
                                                    <div className="h-20 w-20 bg-indigo-600 text-white rounded-3xl flex items-center justify-center font-black text-3xl shadow-xl shadow-indigo-100 group-hover:scale-105 transition-transform duration-500">
                                                        {chat.userId.firstName[0]}
                                                    </div>
                                                    <div className="space-y-1">
                                                        <h4 className="text-2xl font-black text-gray-900 tracking-tight group-hover:text-indigo-600 transition-colors">
                                                            {chat.userId.firstName} {chat.userId.lastName}
                                                        </h4>
                                                        <div className="flex items-center gap-4 text-sm font-bold text-gray-400">
                                                            <div className="flex items-center gap-1.5"><Building2 className="w-4 h-4" /> {chat.hotelId.name}</div>
                                                            <div className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> #{chat._id.slice(-8).toUpperCase()}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="h-16 w-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-900 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shadow-none">
                                                    <ArrowRight className="w-7 h-7" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <ChatModal
                isOpen={isChatModalOpen}
                onClose={() => {
                    setIsChatModalOpen(false);
                    setChatBookingData(null);
                }}
                bookingId={chatBookingData?.id || ""}
                hotelName={chatBookingData?.hotelName || ""}
                receiverName={chatBookingData?.receiverName || ""}
                userRole="hotel_owner"
            />
        </div>
    );
};

export default MyGuests;
