
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
    CheckCircle2
} from "lucide-react";
import { useState } from "react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import useAppContext from "../hooks/useAppContext";

const VerificationsSection = () => {
    const { showToast } = useAppContext();
    const queryClient = useQueryClient();
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

    const { data: verifications, refetch } = useQuery("pendingVerifications", apiClient.fetchPendingVerifications);

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

    if (!verifications || verifications.length === 0) {
        return (
            <div className="p-20 text-center bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-100">
                <div className="bg-white p-6 rounded-full shadow-soft inline-block mb-4">
                    <CheckCircle2 className="h-16 w-16 text-green-500 opacity-20" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">All caught up!</h3>
                <p className="text-gray-500 mt-2">No pending owner verifications at this time.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[700px]">
            {/* Sidebar */}
            <div className="lg:col-span-1 border rounded-3xl bg-white shadow-soft overflow-hidden flex flex-col">
                <div className="p-5 border-b bg-gray-50/50 flex items-center justify-between">
                    <h3 className="text-sm font-black text-gray-700 uppercase tracking-widest">Pending Owners</h3>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 font-black">{verifications.length}</Badge>
                </div>
                <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
                    {verifications.map((user: any) => (
                        <button
                            key={user._id}
                            onClick={() => setSelectedUserId(user._id)}
                            className={`w-full p-5 text-left transition-all hover:bg-gray-50 flex items-center justify-between group ${selectedUserId === user._id ? "bg-blue-50/50 ring-2 ring-blue-500 ring-inset" : ""}`}
                        >
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-black shadow-lg">
                                    {user.firstName[0]}{user.lastName[0]}
                                </div>
                                <div className="min-w-0">
                                    <h4 className="font-bold text-gray-900 truncate">{user.firstName} {user.lastName}</h4>
                                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                </div>
                            </div>
                            <ChevronRight className={`h-5 w-5 text-gray-300 transition-all ${selectedUserId === user._id ? "translate-x-1 text-blue-600" : "group-hover:translate-x-1"}`} />
                        </button>
                    ))}
                </div>
            </div>

            {/* Detail View */}
            <div className="lg:col-span-2 h-full">
                {selectedUser ? (
                    <Card className="h-full border-2 border-blue-100 shadow-2xl flex flex-col overflow-hidden rounded-3xl">
                        <CardHeader className="bg-blue-50/50 border-b p-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <Badge className="mb-2 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-[10px]">VERIFICATION REQUEST</Badge>
                                    <CardTitle className="text-2xl font-black text-gray-900">{selectedUser.firstName} {selectedUser.lastName}</CardTitle>
                                    <p className="text-sm text-gray-500 mt-1 font-medium">{selectedUser.email} • ID Verification</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Submitted On</p>
                                    <p className="text-sm font-bold text-gray-900">{new Date(selectedUser.verification?.documents?.[0]?.uploadedAt || Date.now()).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto p-8 space-y-10">
                            {/* Document Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {selectedUser.verification?.documents?.map((doc: any, index: number) => (
                                    <div key={index} className="space-y-4">
                                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                            <ShieldAlert className="w-4 h-4 text-blue-500" />
                                            {index === 0 ? "1. Personal Identity ID" : "2. Business Ownership Proof"}
                                        </p>
                                        <div className="relative group aspect-video rounded-2xl border-4 border-gray-100 overflow-hidden bg-gray-50 shadow-inner">
                                            <img
                                                src={doc.url}
                                                className="w-full h-full object-contain transition-all duration-700 group-hover:scale-110"
                                                alt="Verification Document"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all flex flex-col justify-end p-6">
                                                <p className="text-white text-xs font-bold mb-2 uppercase tracking-widest">{doc.name || "Verification Image"}</p>
                                                <a
                                                    href={doc.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="w-full py-3 bg-white text-black rounded-xl font-black text-center text-sm shadow-xl flex items-center justify-center gap-2"
                                                >
                                                    <ExternalLink className="w-4 h-4" /> VIEW FULL SCREEN
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex items-start gap-4 shadow-sm">
                                <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-1" />
                                <div>
                                    <h4 className="text-sm font-black text-amber-900 uppercase tracking-wider mb-1">Reviewing Guidelines</h4>
                                    <p className="text-xs text-amber-800 leading-relaxed font-medium">
                                        Cross-verify the name on the ID with the user's profile name (<span className="font-black underline">{selectedUser.firstName} {selectedUser.lastName}</span>).
                                        Ensure the Business Proof shows a valid GST/Registration matching the user's business context.
                                    </p>
                                </div>
                            </div>

                            {/* Decision Area */}
                            <div className="grid grid-cols-2 gap-6 pt-4">
                                <Button
                                    variant="outline"
                                    className="h-16 rounded-2xl border-2 border-red-500 text-red-600 hover:bg-red-50 font-black text-lg transition-all active:scale-[0.98]"
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
                                    className="h-16 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-black text-lg shadow-xl shadow-green-100 transition-all active:scale-[0.98]"
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
                    <div className="h-full flex flex-col items-center justify-center bg-gray-50/50 rounded-[3rem] border-2 border-dashed border-gray-200 text-gray-400">
                        <div className="bg-white p-8 rounded-full shadow-soft mb-6 border border-gray-100">
                            <ShieldCheck className="h-20 w-20 opacity-20 text-blue-600" />
                        </div>
                        <h3 className="text-2xl font-black text-gray-500 uppercase tracking-widest">Select an Owner to Review</h3>
                        <p className="text-sm mt-2 font-medium italic">Pending verification requests will appear here</p>
                    </div>
                )}
            </div>
        </div>
    );
};


const AdminDashboard = () => {
    const { data: stats } = useQuery("adminStats", apiClient.fetchAdminStats);
    const { data: users } = useQuery("allUsers", apiClient.fetchAllUsers);

    const [searchTerm, setSearchTerm] = useState("");

    const filteredUsers = users?.filter((u: any) =>
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.firstName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-10 pb-20">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Admin Intelligence</h1>
                    <p className="text-gray-500 font-medium">System overview and verification management center.</p>
                </div>
                <div className="bg-white p-2 rounded-2xl shadow-soft border border-gray-100 flex items-center gap-4">
                    <div className="px-4 py-2 bg-green-50 text-green-700 rounded-xl flex items-center gap-2">
                        <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-xs font-black uppercase tracking-widest">System Online</span>
                    </div>
                </div>
            </header>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card className="bg-white border-none shadow-soft overflow-hidden group hover:shadow-medium transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-black text-gray-400 uppercase tracking-widest italic leading-none">Total Platform Users</CardTitle>
                        <Users className="h-5 w-5 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-black tracking-tight">{stats?.totalUsers || 0}</div>
                        <p className="text-[10px] text-blue-500 font-black mt-1 uppercase tracking-widest italic group-hover:translate-x-1 transition-transform inline-flex items-center">
                            +12% from last month <ChevronRight className="w-3 h-3 ml-1" />
                        </p>
                    </CardContent>
                    <div className="h-1.5 bg-blue-500/10 w-full overflow-hidden">
                        <div className="h-full bg-blue-500 w-[65%]"></div>
                    </div>
                </Card>

                <Card className="bg-white border-none shadow-soft overflow-hidden group hover:shadow-medium transition-shadow text-[#0b5c1f]">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-black text-emerald-400 uppercase tracking-widest italic leading-none text-[#027520]">Registered Hotels</CardTitle>
                        <Building2 className="h-5 w-5 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-black tracking-tight text-[#014112]">{stats?.totalHotels || 0}</div>
                        <p className="text-[10px] text-emerald-600 font-black mt-1 uppercase tracking-widest italic group-hover:translate-x-1 transition-transform inline-flex items-center">
                            Premium Properties Active <ChevronRight className="w-3 h-3 ml-1" />
                        </p>
                    </CardContent>
                    <div className="h-1.5 bg-emerald-500/10 w-full overflow-hidden">
                        <div className="h-full bg-emerald-500 w-[82%]"></div>
                    </div>
                </Card>

                <Card className="bg-white border-none shadow-soft overflow-hidden group hover:shadow-medium transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-black text-purple-400 uppercase tracking-widest italic leading-none">Security Status</CardTitle>
                        <ShieldCheck className="h-5 w-5 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black tracking-tight text-purple-900 uppercase">Secured</div>
                        <p className="text-[10px] text-purple-500 font-black mt-1 uppercase tracking-widest italic">platform protocols active</p>
                    </CardContent>
                    <div className="h-1.5 bg-purple-500/10 w-full overflow-hidden">
                        <div className="h-full bg-purple-500 w-full"></div>
                    </div>
                </Card>
            </div>

            {/* Verifications Section */}
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <div className="bg-blue-600 p-2 rounded-xl text-white">
                        <ShieldAlert className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Owner Verification Center</h2>
                        <p className="text-sm text-gray-500 font-medium italic">High priority requests requiring biometric and business audit.</p>
                    </div>
                </div>
                <VerificationsSection />
            </div>

            {/* Users Section */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="bg-gray-900 p-2 rounded-xl text-white">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Global User Directory</h2>
                            <p className="text-sm text-gray-500 font-medium italic">Manage all registered accounts across the platform.</p>
                        </div>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search names or emails..."
                            className="pl-12 pr-6 py-4 border-2 border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 w-[300px] transition-all bg-white shadow-soft font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="bg-white rounded-3xl shadow-soft border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead className="bg-gray-50/50">
                                <tr>
                                    <th className="px-8 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] italic">User Identity</th>
                                    <th className="px-8 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] italic">Role / Access</th>
                                    <th className="px-8 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] italic">Member Since</th>
                                    <th className="px-8 py-6 text-right text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] italic">Audit Path</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-50">
                                {filteredUsers?.map((user: any) => (
                                    <tr key={user._id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-8 py-6 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-black text-sm group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner">
                                                    {user.firstName[0]}{user.lastName[0]}
                                                </div>
                                                <div>
                                                    <div className="text-base font-black text-gray-900 tracking-tight">
                                                        {user.firstName} {user.lastName}
                                                    </div>
                                                    <div className="text-xs font-bold text-gray-400 italic font-mono">{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 whitespace-nowrap">
                                            <Badge className={`rounded-xl px-4 py-1.5 font-black uppercase text-[9px] tracking-widest shadow-sm
                                                ${user.role === 'admin' ? 'bg-indigo-500 text-white' :
                                                    user.role === 'hotel_owner' ? 'bg-amber-400 text-amber-900 border border-amber-500/20' :
                                                        'bg-emerald-500 text-white'}`}>
                                                {user.role}
                                            </Badge>
                                        </td>
                                        <td className="px-8 py-6 whitespace-nowrap text-sm font-bold text-gray-500">
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-8 py-6 whitespace-nowrap text-right">
                                            <Button variant="ghost" size="sm" className="font-black text-[10px] tracking-widest uppercase hover:text-blue-600 hover:bg-blue-50">
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
        </div>
    );
};

export default AdminDashboard;
