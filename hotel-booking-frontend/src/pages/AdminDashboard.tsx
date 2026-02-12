
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "react-query";
import * as apiClient from "../api-client";
import {
    Users,
    Building2,
    BarChart,
    ShieldCheck,
    Search,
    CheckCircle,
    XCircle,
    FileText,
    ExternalLink,
    ChevronRight,
    ShieldAlert,
    AlertTriangle,
    CheckCircle2,
    Sparkles,
    LayoutDashboard,
    Hotel,
    CreditCard,
    Calendar,
    Activity,
    Zap,
    Filter,
    Clock,
    MoreVertical,
    Download,
    Flag,
    Eye,
    Image as ImageIcon,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { useState } from "react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import useAppContext from "../hooks/useAppContext";

const SubscriptionsSection = () => {
    const { showToast } = useAppContext();
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState<"ALL" | "ACTIVE" | "EXPIRED">("ALL");
    const [selectedSub, setSelectedSub] = useState<any | null>(null);

    const { data: rawSubscriptions, isLoading, isError, error } = useQuery("allSubscriptions", apiClient.fetchAllSubscriptions);

    const subscriptions = rawSubscriptions?.map((sub: any) => ({
        id: sub._id,
        ownerName: sub.userId ? `${sub.userId.firstName} ${sub.userId.lastName}` : 'Unknown User',
        email: sub.userId?.email || 'N/A',
        plan: sub.plan,
        status: sub.status,
        startDate: sub.startDate,
        endDate: sub.endDate,
        paymentStatus: 'PAID',
        amount: sub.plan === 'MONTHLY' ? '₹4,999' : '₹49,999'
    })) || [];

    const filteredSubs = subscriptions.filter((sub: any) => {
        const matchesSearch = sub.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) || sub.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterStatus === "ALL" || sub.status.toUpperCase() === filterStatus;
        return matchesSearch && matchesFilter;
    });

    const activeCount = subscriptions.filter((s: any) => s.status === 'ACTIVE').length;
    const expiredCount = subscriptions.filter((s: any) => s.status === 'EXPIRED').length;

    // Calculate total revenue based on active plans (Mock calculation for now as we don't store payment history yet)
    const totalRevenue = subscriptions.reduce((acc: number, sub: any) => {
        return acc + (sub.plan === 'MONTHLY' ? 4999 : 49999);
    }, 0);

    const handleAction = (id: string, action: 'ACTIVATE' | 'DEACTIVATE' | 'EXTEND') => {
        // In a real app, this would call a mutation
        const actionText = action === 'EXTEND' ? 'extended by 30 days' : action === 'ACTIVATE' ? 'activated' : 'deactivated';
        showToast({ title: "Action Simulated", description: `Subscription would be ${actionText} (Backend integration pending)`, type: "SUCCESS" });
    };

    if (isLoading) {
        return <div className="p-20 text-center text-gray-400 animate-pulse">Loading subscriptions...</div>;
    }

    if (isError) {
        return (
            <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-4 text-red-400">
                <AlertTriangle className="w-8 h-8 shrink-0" />
                <div>
                    <h3 className="font-bold text-lg">Failed to load subscriptions</h3>
                    <p className="text-sm opacity-80">{(error as Error)?.message || "An unexpected error occurred accessing the database."}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-emerald-500/20 rounded-xl">
                                <Activity className="w-6 h-6 text-emerald-400" />
                            </div>
                            <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Live Now</Badge>
                        </div>
                        <h3 className="text-3xl font-black text-white mb-1">{activeCount}</h3>
                        <p className="text-sm text-gray-400 font-medium">Active Subscriptions</p>
                    </CardContent>
                </Card>

                <Card className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-red-500/20 rounded-xl">
                                <Clock className="w-6 h-6 text-red-400" />
                            </div>
                            <Badge className="bg-red-500/20 text-red-300 border border-red-500/30">Action Needed</Badge>
                        </div>
                        <h3 className="text-3xl font-black text-white mb-1">{expiredCount}</h3>
                        <p className="text-sm text-gray-400 font-medium">Expired / Inactive</p>
                    </CardContent>
                </Card>

                <Card className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-blue-500/20 rounded-xl">
                                <CreditCard className="w-6 h-6 text-blue-400" />
                            </div>
                            <Badge className="bg-blue-500/20 text-blue-300 border border-blue-500/30">Total Value</Badge>
                        </div>
                        <h3 className="text-3xl font-black text-white mb-1">₹{(totalRevenue / 1000).toFixed(1)}k</h3>
                        <p className="text-sm text-gray-400 font-medium">Est. Revenue Value</p>
                    </CardContent>
                </Card>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/10">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search owners, emails..."
                        className="w-full pl-10 pr-4 py-3 bg-black/20 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white placeholder-gray-500 text-sm font-medium"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
                    {(['ALL', 'ACTIVE', 'EXPIRED'] as const).map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filterStatus === status
                                ? 'bg-white text-black shadow-lg shadow-white/10'
                                : 'bg-black/20 text-gray-400 hover:bg-white/10 hover:text-white'
                                }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            {/* List */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-white/5">
                        <thead className="bg-white/5">
                            <tr>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Subscriber</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Current Plan</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Validity</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredSubs.map((sub) => (
                                <tr key={sub.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div>
                                            <div className="text-sm font-bold text-white">{sub.ownerName}</div>
                                            <div className="text-xs text-gray-500 font-mono">{sub.email}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <Badge variant="outline" className="border-white/10 text-gray-300 bg-white/5">
                                            {sub.plan}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide border ${sub.status === 'ACTIVE'
                                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                            : 'bg-red-500/10 text-red-400 border-red-500/20'
                                            }`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${sub.status === 'ACTIVE' ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`}></div>
                                            {sub.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-xs text-gray-300">
                                            <span className="text-gray-500">Ends:</span> {new Date(sub.endDate).toLocaleDateString()}
                                        </div>
                                        <div className="text-[10px] text-gray-600 mt-0.5 font-mono">
                                            Started: {new Date(sub.startDate).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10">
                                                    <MoreVertical className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-48 bg-gray-900 border border-white/10 text-white backdrop-blur-xl">
                                                <DropdownMenuItem className="text-xs font-medium cursor-pointer focus:bg-white/10" onClick={() => setSelectedSub(sub)}>
                                                    <FileText className="w-3.5 h-3.5 mr-2 text-blue-400" /> View Details
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-xs font-medium cursor-pointer focus:bg-white/10" onClick={() => handleAction(sub.id, 'EXTEND')}>
                                                    <Calendar className="w-3.5 h-3.5 mr-2 text-emerald-400" /> Extend (+30 Days)
                                                </DropdownMenuItem>
                                                {sub.status === 'ACTIVE' ? (
                                                    <DropdownMenuItem className="text-xs font-medium cursor-pointer focus:bg-white/10 text-red-400 focus:text-red-300" onClick={() => handleAction(sub.id, 'DEACTIVATE')}>
                                                        <XCircle className="w-3.5 h-3.5 mr-2" /> Deactivate Plan
                                                    </DropdownMenuItem>
                                                ) : (
                                                    <DropdownMenuItem className="text-xs font-medium cursor-pointer focus:bg-white/10 text-emerald-400 focus:text-emerald-300" onClick={() => handleAction(sub.id, 'ACTIVATE')}>
                                                        <Zap className="w-3.5 h-3.5 mr-2" /> Activate Plan
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Details Modal (Simplified as an overlay for now) */}
            {selectedSub && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-[#0f172a] border border-white/10 rounded-3xl w-full max-w-lg shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-blue-600/20 to-purple-600/20 pointer-events-none"></div>
                        <div className="p-8 relative">
                            <button
                                onClick={() => setSelectedSub(null)}
                                className="absolute top-4 right-4 p-2 rounded-full bg-black/20 hover:bg-white/10 text-gray-400 hover:text-white transition-colors border border-white/5"
                            >
                                <XCircle className="w-5 h-5" />
                            </button>

                            <div className="flex items-center gap-4 mb-6">
                                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl font-black text-white shadow-xl">
                                    {selectedSub.ownerName?.[0] || "?"}
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-white">{selectedSub.ownerName || "Unknown Owner"}</h3>
                                    <p className="text-gray-400 font-medium">{selectedSub.email}</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Current Plan</p>
                                        <p className="text-lg font-bold text-white">{selectedSub.plan}</p>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Amount Paid</p>
                                        <p className="text-lg font-bold text-emerald-400">{selectedSub.amount}</p>
                                    </div>
                                </div>

                                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-400">Subscription Status</span>
                                        <Badge className={`${selectedSub.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
                                            {selectedSub.status}
                                        </Badge>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-400">Start Date</span>
                                        <span className="text-sm font-bold text-white">{new Date(selectedSub.startDate).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-400">Expiration Date</span>
                                        <span className="text-sm font-bold text-white">{new Date(selectedSub.endDate).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-2 border-t border-white/10">
                                        <span className="text-sm text-gray-400">Payment Status</span>
                                        <span className="text-sm font-black text-emerald-400 uppercase flex items-center gap-1">
                                            <CheckCircle2 className="w-3 h-3" /> {selectedSub.paymentStatus}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <Button
                                        className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold h-12"
                                        onClick={() => handleAction(selectedSub.id, 'EXTEND')}
                                    >
                                        Extend 30 Days
                                    </Button>
                                    {selectedSub.status === 'ACTIVE' ? (
                                        <Button
                                            className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/50 font-bold h-12"
                                            onClick={() => handleAction(selectedSub.id, 'DEACTIVATE')}
                                        >
                                            Deactivate
                                        </Button>
                                    ) : (
                                        <Button
                                            className="flex-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/50 font-bold h-12"
                                            onClick={() => handleAction(selectedSub.id, 'ACTIVATE')}
                                        >
                                            Activate
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const VerificationsSection = () => {
    const { showToast } = useAppContext();
    const queryClient = useQueryClient();
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

    const { data: verifications, refetch, isError, error } = useQuery("pendingVerifications", apiClient.fetchPendingVerifications);

    const { mutate: updateStatus, isLoading } = useMutation(
        ({ userId, status, reason }: { userId: string, status: "VERIFIED" | "REJECTED", reason?: string }) =>
            apiClient.updateVerificationStatus(userId, status, reason),
        {
            onSuccess: () => {
                showToast({ title: "Status Updated", description: "Verification record updated successfully", type: "SUCCESS" });
                queryClient.invalidateQueries("pendingVerifications");
                setSelectedUserId(null);
            },
            onError: (error: any) => {
                showToast({ title: "Update Failed", description: error.message, type: "ERROR" });
            }
        }
    );

    const selectedUser = verifications?.find((u: any) => u._id === selectedUserId);

    if (isError) {
        return (
            <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-4 text-red-400">
                <ShieldAlert className="w-8 h-8 shrink-0" />
                <div>
                    <h3 className="font-bold text-lg">Failed to load verification requests</h3>
                    <p className="text-sm opacity-80">{(error as Error)?.message || "Internal server error. Please try again later."}</p>
                </div>
            </div>
        );
    }

    if (!verifications || verifications.length === 0) {
        return (
            <div className="p-20 text-center bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10">
                <div className="bg-gradient-to-br from-emerald-500/20 to-green-500/20 p-6 rounded-full backdrop-blur-sm inline-block mb-4 border border-emerald-500/30">
                    <CheckCircle2 className="h-16 w-16 text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-white">All caught up!</h3>
                <p className="text-gray-400 mt-2">No pending identity verifications at this time.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[700px]">
            {/* Sidebar */}
            <div className="lg:col-span-1 border border-white/10 rounded-3xl bg-white/5 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col">
                <div className="p-5 border-b border-white/10 bg-white/5 flex items-center justify-between">
                    <h3 className="text-sm font-black text-gray-300 uppercase tracking-widest">Pending Verification</h3>
                    <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 font-black border border-blue-500/30">{verifications.length}</Badge>
                </div>
                <div className="flex-1 overflow-y-auto divide-y divide-white/5">
                    {verifications.map((user: any) => (
                        <button
                            key={user._id}
                            onClick={() => setSelectedUserId(user._id)}
                            className={`w-full p-5 text-left transition-all hover:bg-white/10 flex items-center justify-between group ${selectedUserId === user._id ? "bg-blue-500/20 ring-2 ring-blue-500/50 ring-inset backdrop-blur-sm" : ""}`}
                        >
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-black shadow-lg shadow-blue-500/50">
                                    {user.firstName?.[0] || "?"}{user.lastName?.[0] || "?"}
                                </div>
                                <div className="min-w-0">
                                    <h4 className="font-bold text-white truncate">{user.firstName} {user.lastName}</h4>
                                    <p className="text-xs text-gray-400 truncate">{user.email}</p>
                                </div>
                            </div>
                            <ChevronRight className={`h-5 w-5 text-gray-500 transition-all ${selectedUserId === user._id ? "translate-x-1 text-blue-400" : "group-hover:translate-x-1"}`} />
                        </button>
                    ))}
                </div>
            </div>

            {/* Detail View */}
            <div className="lg:col-span-2 h-full">
                {selectedUser ? (
                    <Card className="h-full border border-blue-500/30 bg-white/5 backdrop-blur-xl shadow-2xl flex flex-col overflow-hidden rounded-3xl">
                        <CardHeader className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-b border-white/10 p-6 backdrop-blur-sm">
                            <div className="flex justify-between items-start">
                                <div>
                                    <Badge className="mb-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-500/50">VERIFICATION REQUEST</Badge>
                                    <CardTitle className="text-2xl font-black text-white">{selectedUser.firstName} {selectedUser.lastName}</CardTitle>
                                    <p className="text-sm text-gray-400 mt-1 font-medium">{selectedUser.email} • ID Verification</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Submitted On</p>
                                    <p className="text-sm font-bold text-white">{new Date(selectedUser.verification?.documents?.[0]?.uploadedAt || Date.now()).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto p-8 space-y-10">
                            {/* Document Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {selectedUser.verification?.documents?.map((doc: any, index: number) => (
                                    <div key={index} className="space-y-4">
                                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                            <ShieldAlert className="w-4 h-4 text-blue-400" />
                                            {index === 0 ? "1. ID Front" : "2. ID Back"}
                                        </p>
                                        <div className="relative group aspect-video rounded-2xl border-2 border-white/10 overflow-hidden bg-black/20 backdrop-blur-sm shadow-xl">
                                            <img
                                                src={doc.url}
                                                className="w-full h-full object-contain transition-all duration-700 group-hover:scale-110"
                                                alt="Verification Document"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all flex flex-col justify-end p-6">
                                                <p className="text-white text-xs font-bold mb-2 uppercase tracking-widest">{doc.name || "Verification Image"}</p>
                                                <a
                                                    href={doc.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="w-full py-3 bg-white text-black rounded-xl font-black text-center text-sm shadow-xl flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors"
                                                >
                                                    <ExternalLink className="w-4 h-4" /> VIEW FULL SCREEN
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 flex items-start gap-4 backdrop-blur-sm">
                                <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0 mt-1" />
                                <div>
                                    <h4 className="text-sm font-black text-amber-300 uppercase tracking-wider mb-1">Reviewing Guidelines</h4>
                                    <p className="text-xs text-amber-200/80 leading-relaxed font-medium">
                                        Cross-verify the name on the ID with the user's profile name (<span className="font-black underline text-amber-100">{selectedUser.firstName} {selectedUser.lastName}</span>).
                                        Ensure the documents are clear, valid, and match the user's identity.
                                    </p>
                                </div>
                            </div>

                            {/* Decision Area */}
                            <div className="grid grid-cols-2 gap-6 pt-4">
                                <Button
                                    variant="outline"
                                    className="h-16 rounded-2xl border-2 border-red-500/50 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:border-red-500 font-black text-lg transition-all active:scale-[0.98] backdrop-blur-sm"
                                    onClick={() => {
                                        const reason = prompt("Enter rejection reason (e.g. Documents not clear, Name mismatch):");
                                        if (reason) updateStatus({ userId: selectedUser._id, status: "REJECTED", reason });
                                    }}
                                    disabled={isLoading}
                                >
                                    <XCircle className="w-6 h-6 mr-3" />
                                    REJECT REQUEST
                                </Button>
                                <Button
                                    className="h-16 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-black text-lg shadow-xl shadow-green-500/30 transition-all active:scale-[0.98]"
                                    onClick={() => updateStatus({ userId: selectedUser._id, status: "VERIFIED" })}
                                    disabled={isLoading}
                                >
                                    <CheckCircle className="w-6 h-6 mr-3" />
                                    APPROVE ACCOUNT
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center bg-white/5 backdrop-blur-xl rounded-[3rem] border border-white/10 text-gray-400">
                        <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 p-8 rounded-full backdrop-blur-sm mb-6 border border-blue-500/30">
                            <ShieldCheck className="h-20 w-20 text-blue-400" />
                        </div>
                        <h3 className="text-2xl font-black text-gray-300 uppercase tracking-widest">Select an Owner to Review</h3>
                        <p className="text-sm mt-2 font-medium italic text-gray-500">Pending verification requests will appear here</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// Reports Section Component
const ReportsSection = () => {
    const { showToast } = useAppContext();
    const queryClient = useQueryClient();
    const [filterStatus, setFilterStatus] = useState<"ALL" | "Open" | "In Review" | "Resolved">("ALL");
    const [selectedReport, setSelectedReport] = useState<any | null>(null);

    const { data: reports, isLoading, isError, error } = useQuery("allReports", apiClient.fetchAllReports);

    const { mutate: updateStatus, isLoading: isUpdating } = useMutation(
        ({ reportId, status }: { reportId: string, status: "Open" | "In Review" | "Resolved" }) =>
            apiClient.updateReportStatus(reportId, status),
        {
            onSuccess: () => {
                showToast({ title: "Status Updated", description: "Report status updated successfully", type: "SUCCESS" });
                queryClient.invalidateQueries("allReports");
            },
            onError: (error: any) => {
                showToast({ title: "Update Failed", description: error.message, type: "ERROR" });
            }
        }
    );

    const filteredReports = reports?.filter((report: any) =>
        filterStatus === "ALL" || report.status === filterStatus
    ) || [];

    const openCount = reports?.filter((r: any) => r.status === "Open").length || 0;
    const inReviewCount = reports?.filter((r: any) => r.status === "In Review").length || 0;
    const resolvedCount = reports?.filter((r: any) => r.status === "Resolved").length || 0;

    const getStatusColor = (status: string) => {
        switch (status) {
            case "Open": return "bg-rose-500/20 text-rose-300 border-rose-500/30";
            case "In Review": return "bg-amber-500/20 text-amber-300 border-amber-500/30";
            case "Resolved": return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
            default: return "bg-gray-500/20 text-gray-300 border-gray-500/30";
        }
    };

    if (isLoading) {
        return <div className="p-20 text-center text-gray-400 animate-pulse">Loading reports...</div>;
    }

    if (isError) {
        return (
            <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-4 text-red-400">
                <AlertTriangle className="w-8 h-8 shrink-0" />
                <div>
                    <h3 className="font-bold text-lg">Failed to load reports</h3>
                    <p className="text-sm opacity-80">{(error as Error)?.message || "Could not fetch report data."}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-rose-500/20 rounded-xl">
                                <Flag className="w-6 h-6 text-rose-400" />
                            </div>
                            <Badge className="bg-rose-500/20 text-rose-300 border border-rose-500/30">Action Needed</Badge>
                        </div>
                        <h3 className="text-3xl font-black text-white mb-1">{openCount}</h3>
                        <p className="text-sm text-gray-400 font-medium">Open Reports</p>
                    </CardContent>
                </Card>

                <Card className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-amber-500/20 rounded-xl">
                                <Eye className="w-6 h-6 text-amber-400" />
                            </div>
                            <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/30">In Progress</Badge>
                        </div>
                        <h3 className="text-3xl font-black text-white mb-1">{inReviewCount}</h3>
                        <p className="text-sm text-gray-400 font-medium">Under Review</p>
                    </CardContent>
                </Card>

                <Card className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-emerald-500/20 rounded-xl">
                                <CheckCircle className="w-6 h-6 text-emerald-400" />
                            </div>
                            <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Complete</Badge>
                        </div>
                        <h3 className="text-3xl font-black text-white mb-1">{resolvedCount}</h3>
                        <p className="text-sm text-gray-400 font-medium">Resolved</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filter Controls */}
            <div className="flex gap-2 bg-white/5 p-2 rounded-2xl border border-white/10 w-fit">
                {(['ALL', 'Open', 'In Review', 'Resolved'] as const).map((status) => (
                    <button
                        key={status}
                        onClick={() => setFilterStatus(status)}
                        className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filterStatus === status
                            ? 'bg-white text-black shadow-lg shadow-white/10'
                            : 'bg-black/20 text-gray-400 hover:bg-white/10 hover:text-white'
                            }`}
                    >
                        {status}
                    </button>
                ))}
            </div>

            {/* Reports Table */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-white/5">
                        <thead className="bg-white/5">
                            <tr>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Report</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">User</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Reason</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredReports.map((report: any) => (
                                <tr key={report._id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div>
                                            <div className="text-sm font-bold text-white">{report.hotelId?.name || 'Unknown Hotel'}</div>
                                            <div className="text-xs text-gray-500 font-mono">#{report.bookingId?._id?.slice(-8).toUpperCase() || 'N/A'}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div>
                                            <div className="text-sm font-medium text-white">{report.userId?.firstName} {report.userId?.lastName}</div>
                                            <div className="text-xs text-gray-500">{report.userId?.email}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="max-w-xs">
                                            <div className="text-sm font-medium text-white truncate">{report.reason}</div>
                                            {report.subReason && <div className="text-xs text-gray-500 truncate">{report.subReason}</div>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide border ${getStatusColor(report.status)}`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${report.status === 'Open' ? 'bg-rose-400 animate-pulse' : report.status === 'In Review' ? 'bg-amber-400' : 'bg-emerald-400'}`}></div>
                                            {report.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                        {new Date(report.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10">
                                                    <MoreVertical className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-48 bg-gray-900 border border-white/10 text-white backdrop-blur-xl">
                                                <DropdownMenuItem className="text-xs font-medium cursor-pointer focus:bg-white/10" onClick={() => setSelectedReport(report)}>
                                                    <Eye className="w-3.5 h-3.5 mr-2 text-blue-400" /> View Details
                                                </DropdownMenuItem>
                                                {report.status !== "In Review" && (
                                                    <DropdownMenuItem className="text-xs font-medium cursor-pointer focus:bg-white/10 text-amber-400" onClick={() => updateStatus({ reportId: report._id, status: "In Review" })}>
                                                        <Eye className="w-3.5 h-3.5 mr-2" /> Mark In Review
                                                    </DropdownMenuItem>
                                                )}
                                                {report.status !== "Resolved" && (
                                                    <DropdownMenuItem className="text-xs font-medium cursor-pointer focus:bg-white/10 text-emerald-400" onClick={() => updateStatus({ reportId: report._id, status: "Resolved" })}>
                                                        <CheckCircle className="w-3.5 h-3.5 mr-2" /> Mark Resolved
                                                    </DropdownMenuItem>
                                                )}
                                                {report.status !== "Open" && (
                                                    <DropdownMenuItem className="text-xs font-medium cursor-pointer focus:bg-white/10 text-rose-400" onClick={() => updateStatus({ reportId: report._id, status: "Open" })}>
                                                        <Flag className="w-3.5 h-3.5 mr-2" /> Reopen
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredReports.length === 0 && (
                    <div className="p-20 text-center">
                        <Flag className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-white">No reports found</h3>
                        <p className="text-gray-400 mt-2">No reports match the current filter.</p>
                    </div>
                )}
            </div>

            {/* Report Detail Modal */}
            {selectedReport && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-[#0f172a] border border-white/10 rounded-3xl w-full max-w-2xl shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto">
                        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-rose-600/20 to-orange-600/20 pointer-events-none"></div>
                        <div className="p-8 relative">
                            <button
                                onClick={() => setSelectedReport(null)}
                                className="absolute top-4 right-4 p-2 rounded-full bg-black/20 hover:bg-white/10 text-gray-400 hover:text-white transition-colors border border-white/5"
                            >
                                <XCircle className="w-5 h-5" />
                            </button>

                            <div className="flex items-center gap-4 mb-6">
                                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-rose-500 to-orange-600 flex items-center justify-center text-2xl font-black text-white shadow-xl">
                                    <Flag className="w-8 h-8" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-white">Report Details</h3>
                                    <p className="text-gray-400 font-medium">Booking #{selectedReport.bookingId?._id?.slice(-8).toUpperCase()}</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Reporter</p>
                                        <p className="text-lg font-bold text-white">{selectedReport.userId?.firstName} {selectedReport.userId?.lastName}</p>
                                        <p className="text-xs text-gray-400">{selectedReport.userId?.email}</p>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Property Owner</p>
                                        <p className="text-lg font-bold text-white">{selectedReport.ownerId?.firstName} {selectedReport.ownerId?.lastName}</p>
                                        <p className="text-xs text-gray-400">{selectedReport.ownerId?.email}</p>
                                    </div>
                                </div>

                                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-2">Reason</p>
                                    <p className="text-white font-bold">{selectedReport.reason}</p>
                                    {selectedReport.subReason && <p className="text-sm text-gray-400 mt-1">{selectedReport.subReason}</p>}
                                </div>

                                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-2">Message</p>
                                    <p className="text-white text-sm leading-relaxed">{selectedReport.message}</p>
                                </div>

                                {selectedReport.evidenceUrls && selectedReport.evidenceUrls.length > 0 && (
                                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-3">Evidence ({selectedReport.evidenceUrls.length} files)</p>
                                        <div className="grid grid-cols-3 gap-3">
                                            {selectedReport.evidenceUrls.map((url: string, idx: number) => (
                                                <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="aspect-square rounded-xl bg-black/30 border border-white/10 overflow-hidden hover:border-blue-500/50 transition-all">
                                                    <img src={url} alt={`Evidence ${idx + 1}`} className="w-full h-full object-cover" />
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-3">
                                    {selectedReport.status !== "In Review" && (
                                        <Button
                                            className="flex-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 font-bold h-12"
                                            onClick={() => { updateStatus({ reportId: selectedReport._id, status: "In Review" }); setSelectedReport(null); }}
                                            disabled={isUpdating}
                                        >
                                            Mark In Review
                                        </Button>
                                    )}
                                    {selectedReport.status !== "Resolved" && (
                                        <Button
                                            className="flex-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/50 font-bold h-12"
                                            onClick={() => { updateStatus({ reportId: selectedReport._id, status: "Resolved" }); setSelectedReport(null); }}
                                            disabled={isUpdating}
                                        >
                                            Mark Resolved
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


const AdminDashboard = () => {
    const { data: stats } = useQuery("adminStats", apiClient.fetchAdminStats);
    const { data: users, isError: isUsersError, error: usersError } = useQuery("allUsers", apiClient.fetchAllUsers);
    const { data: hotels, isError: isHotelsError, error: hotelsError } = useQuery("allHotels", apiClient.fetchAllHotels);
    const { data: verifications } = useQuery("pendingVerifications", apiClient.fetchPendingVerifications);

    const [searchTerm, setSearchTerm] = useState("");
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = (searchParams.get("tab") as "overview" | "verifications" | "users" | "hotels" | "subscriptions" | "reports") || "overview";

    const setActiveTab = (tab: "overview" | "verifications" | "users" | "hotels" | "subscriptions" | "reports") => {
        setSearchParams({ tab });
    };

    const filteredUsers = users?.filter((u: any) =>
        (u.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.firstName || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredHotels = hotels?.filter((h: any) =>
        (h.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (h.city || "").toLowerCase().includes(searchTerm.toLowerCase())
    );



    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black">
            {/* Animated Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="relative z-10 space-y-10 pb-20 px-8 pt-8">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <Sparkles className="w-8 h-8 text-blue-400" />
                            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 tracking-tight">Admin Intelligence</h1>
                        </div>
                        <p className="text-gray-400 font-medium">System overview and verification management center.</p>
                    </div>
                    <div className="bg-white/5 backdrop-blur-xl p-2 rounded-2xl border border-white/10 flex items-center gap-4">
                        <div className="px-4 py-2 bg-green-500/20 text-green-300 rounded-xl flex items-center gap-2 border border-green-500/30">
                            <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-500/50"></div>
                            <span className="text-xs font-black uppercase tracking-widest">System Online</span>
                        </div>
                    </div>
                </header>



                {/* Tab Content */}
                {activeTab === "overview" && (
                    <div className="space-y-10">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <Card className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden group hover:shadow-blue-500/20 hover:border-blue-500/30 transition-all">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-black text-gray-400 uppercase tracking-widest italic leading-none">Total Platform Users</CardTitle>
                                    <Users className="h-5 w-5 text-blue-400" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-4xl font-black tracking-tight text-white">{stats?.totalUsers || 0}</div>
                                    <p className="text-[10px] text-blue-400 font-black mt-1 uppercase tracking-widest italic group-hover:translate-x-1 transition-transform inline-flex items-center">
                                        +12% from last month <ChevronRight className="w-3 h-3 ml-1" />
                                    </p>
                                </CardContent>
                                <div className="h-1.5 bg-blue-500/10 w-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 w-[65%] shadow-lg shadow-blue-500/50"></div>
                                </div>
                            </Card>

                            <Card className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden group hover:shadow-emerald-500/20 hover:border-emerald-500/30 transition-all">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-black text-gray-400 uppercase tracking-widest italic leading-none">Registered Hotels</CardTitle>
                                    <Building2 className="h-5 w-5 text-emerald-400" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-4xl font-black tracking-tight text-white">{stats?.totalHotels || 0}</div>
                                    <p className="text-[10px] text-emerald-400 font-black mt-1 uppercase tracking-widest italic group-hover:translate-x-1 transition-transform inline-flex items-center">
                                        Premium Properties Active <ChevronRight className="w-3 h-3 ml-1" />
                                    </p>
                                </CardContent>
                                <div className="h-1.5 bg-emerald-500/10 w-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-emerald-500 to-green-500 w-[82%] shadow-lg shadow-emerald-500/50"></div>
                                </div>
                            </Card>

                            <Card className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden group hover:shadow-purple-500/20 hover:border-purple-500/30 transition-all">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-black text-gray-400 uppercase tracking-widest italic leading-none">Security Status</CardTitle>
                                    <ShieldCheck className="h-5 w-5 text-purple-400" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 uppercase">Secured</div>
                                    <p className="text-[10px] text-purple-400 font-black mt-1 uppercase tracking-widest italic">platform protocols active</p>
                                </CardContent>
                                <div className="h-1.5 bg-purple-500/10 w-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 w-full shadow-lg shadow-purple-500/50"></div>
                                </div>
                            </Card>
                        </div>

                        {/* Quick Actions */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl hover:shadow-blue-500/20 transition-all cursor-pointer" onClick={() => setActiveTab("verifications")}>
                                <CardContent className="p-8">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-4 rounded-2xl shadow-lg shadow-blue-500/50">
                                            <ShieldAlert className="w-8 h-8 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-xl font-black text-white mb-1">Pending Verifications</h3>
                                            <p className="text-sm text-gray-400">Review owner verification requests</p>
                                        </div>
                                        <ChevronRight className="w-6 h-6 text-gray-500" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl hover:shadow-emerald-500/20 transition-all cursor-pointer" onClick={() => setActiveTab("users")}>
                                <CardContent className="p-8">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-gradient-to-br from-emerald-500 to-green-600 p-4 rounded-2xl shadow-lg shadow-emerald-500/50">
                                            <Users className="w-8 h-8 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-xl font-black text-white mb-1">Manage Users</h3>
                                            <p className="text-sm text-gray-400">View and manage all platform users</p>
                                        </div>
                                        <ChevronRight className="w-6 h-6 text-gray-500" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl hover:shadow-blue-500/20 transition-all cursor-pointer" onClick={() => setActiveTab("subscriptions")}>
                                <CardContent className="p-8">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-gradient-to-br from-blue-500 to-cyan-600 p-4 rounded-2xl shadow-lg shadow-blue-500/50">
                                            <CreditCard className="w-8 h-8 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-xl font-black text-white mb-1">Subscriptions</h3>
                                            <p className="text-sm text-gray-400">Manage plans & revenue</p>
                                        </div>
                                        <ChevronRight className="w-6 h-6 text-gray-500" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl hover:shadow-rose-500/20 transition-all cursor-pointer" onClick={() => setActiveTab("reports")}>
                                <CardContent className="p-8">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-gradient-to-br from-rose-500 to-orange-600 p-4 rounded-2xl shadow-lg shadow-rose-500/50">
                                            <Flag className="w-8 h-8 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-xl font-black text-white mb-1">Booking Reports</h3>
                                            <p className="text-sm text-gray-400">Review user issues</p>
                                        </div>
                                        <ChevronRight className="w-6 h-6 text-gray-500" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}

                {activeTab === "verifications" && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-xl text-white shadow-lg shadow-blue-500/50">
                                <ShieldAlert className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-white tracking-tight">Owner Verification Center</h2>
                                <p className="text-sm text-gray-400 font-medium italic">High priority requests requiring biometric and business audit.</p>
                            </div>
                        </div>
                        <VerificationsSection />
                    </div>
                )}

                {activeTab === "subscriptions" && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="bg-gradient-to-br from-blue-500 to-cyan-600 p-2 rounded-xl text-white shadow-lg shadow-blue-500/50">
                                <CreditCard className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-white tracking-tight">Subscription Management</h2>
                                <p className="text-sm text-gray-400 font-medium italic">Monitor revenue, plans, and subscriber status.</p>
                            </div>
                        </div>
                        <SubscriptionsSection />
                    </div>
                )}

                {activeTab === "users" && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="bg-gradient-to-br from-gray-700 to-gray-900 p-2 rounded-xl text-white border border-white/10 shadow-lg">
                                    <Users className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-white tracking-tight">Global User Directory</h2>
                                    <p className="text-sm text-gray-400 font-medium italic">Manage all registered accounts across the platform.</p>
                                </div>
                            </div>
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Search names or emails..."
                                    className="pl-12 pr-6 py-4 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 w-[300px] transition-all bg-white/5 backdrop-blur-xl text-white placeholder-gray-500 font-medium"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        {isUsersError && (
                            <div className="p-6 mb-6 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-4 text-red-400">
                                <AlertTriangle className="w-8 h-8 shrink-0" />
                                <div>
                                    <h3 className="font-bold text-lg">Failed to load users</h3>
                                    <p className="text-sm opacity-80">{(usersError as Error)?.message || "Database connection failure."}</p>
                                </div>
                            </div>
                        )}

                        <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-white/5">
                                    <thead className="bg-white/5">
                                        <tr>
                                            <th className="px-8 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] italic">User Identity</th>
                                            <th className="px-8 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] italic">Role / Access</th>
                                            <th className="px-8 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] italic">Member Since</th>
                                            <th className="px-8 py-6 text-right text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] italic">Audit Path</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {filteredUsers?.map((user: any) => (
                                            <tr key={user._id} className="hover:bg-white/5 transition-colors group">
                                                <td className="px-8 py-6 whitespace-nowrap">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 bg-gradient-to-br from-gray-700 to-gray-800 rounded-full flex items-center justify-center text-gray-300 font-black text-sm group-hover:from-blue-500 group-hover:to-purple-600 group-hover:text-white transition-all shadow-inner border border-white/10">
                                                            {user.firstName?.[0] || "?"}{user.lastName?.[0] || "?"}
                                                        </div>
                                                        <div>
                                                            <div className="text-base font-black text-white tracking-tight">
                                                                {user.firstName} {user.lastName}
                                                            </div>
                                                            <div className="text-xs font-bold text-gray-400 italic font-mono">{user.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 whitespace-nowrap">
                                                    <Badge className={`rounded-xl px-4 py-1.5 font-black uppercase text-[9px] tracking-widest backdrop-blur-sm
                                                        ${user.role === 'admin' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' :
                                                            user.role === 'hotel_owner' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                                                                'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'}`}>
                                                        {user.role}
                                                    </Badge>
                                                </td>
                                                <td className="px-8 py-6 whitespace-nowrap text-sm font-bold text-gray-400">
                                                    {new Date(user.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className="px-8 py-6 whitespace-nowrap text-right">
                                                    <Button variant="ghost" size="sm" className="font-black text-[10px] tracking-widest uppercase hover:text-blue-400 hover:bg-blue-500/10 text-gray-400">
                                                        VIEW ACTIVITY <ChevronRight className="w-3 h-3 ml-2" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "hotels" && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="bg-gradient-to-br from-emerald-500 to-green-600 p-2 rounded-xl text-white shadow-lg shadow-emerald-500/50">
                                    <Hotel className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-white tracking-tight">Hotels Management</h2>
                                    <p className="text-sm text-gray-400 font-medium italic">View and manage all registered properties.</p>
                                </div>
                            </div>
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Search hotels or cities..."
                                    className="pl-12 pr-6 py-4 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 w-[300px] transition-all bg-white/5 backdrop-blur-xl text-white placeholder-gray-500 font-medium"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        {isHotelsError && (
                            <div className="p-6 mb-6 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-4 text-red-400">
                                <AlertTriangle className="w-8 h-8 shrink-0" />
                                <div>
                                    <h3 className="font-bold text-lg">Failed to load hotels</h3>
                                    <p className="text-sm opacity-80">{(hotelsError as Error)?.message || "Could not retrieve hotel data."}</p>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredHotels?.map((hotel: any) => (
                                <Card key={hotel._id} className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl hover:shadow-emerald-500/20 hover:border-emerald-500/30 transition-all overflow-hidden group">
                                    <div className="aspect-video relative overflow-hidden bg-black/20">
                                        {hotel.imageUrls?.[0] ? (
                                            <img src={hotel.imageUrls[0]} alt={hotel.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Hotel className="w-16 h-16 text-gray-600" />
                                            </div>
                                        )}
                                        <div className="absolute top-3 right-3">
                                            <Badge className="bg-emerald-500/90 text-white font-black backdrop-blur-sm">
                                                {hotel.starRating} ★
                                            </Badge>
                                        </div>
                                    </div>
                                    <CardContent className="p-6">
                                        <h3 className="text-lg font-black text-white mb-1 truncate">{hotel.name}</h3>
                                        <p className="text-sm text-gray-400 mb-3">{hotel.city}, {hotel.country}</p>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-gray-500 font-bold">{hotel.type}</span>
                                            <Button variant="ghost" size="sm" className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 text-xs font-black">
                                                VIEW DETAILS
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {(!filteredHotels || filteredHotels.length === 0) && (
                            <div className="p-20 text-center bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10">
                                <Hotel className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-white">No hotels found</h3>
                                <p className="text-gray-400 mt-2">Try adjusting your search criteria.</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "reports" && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="bg-gradient-to-br from-rose-500 to-orange-600 p-2 rounded-xl text-white shadow-lg shadow-rose-500/50">
                                <Flag className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-white tracking-tight">Booking Reports</h2>
                                <p className="text-sm text-gray-400 font-medium italic">Review and resolve user-submitted booking issues.</p>
                            </div>
                        </div>
                        <ReportsSection />
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
