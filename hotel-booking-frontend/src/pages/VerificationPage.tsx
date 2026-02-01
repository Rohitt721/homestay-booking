
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { useNavigate } from "react-router-dom";
import * as apiClient from "../api-client";
import useAppContext from "../hooks/useAppContext";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import {
    Upload,
    CheckCircle2,
    XCircle,
    AlertCircle,
    X,
    ShieldCheck,
    FileUp,
    UserCheck,
    Lock,
    CreditCard
} from "lucide-react";
import LoadingSpinner from "../components/LoadingSpinner";
import { Label } from "../components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "../components/ui/select";

type VerificationFormData = {
    idType: string;
    personalIdFront: FileList;
    businessProof: FileList;
};

const VerificationPage = () => {
    const navigate = useNavigate();
    const { showToast } = useAppContext();
    const queryClient = useQueryClient();

    const [personalPreview, setPersonalPreview] = useState<string | null>(null);
    const [businessPreview, setBusinessPreview] = useState<string | null>(null);

    const { data: statusData, isLoading } = useQuery(
        "verificationStatus",
        apiClient.fetchVerificationStatus
    );

    const { mutate, isLoading: isUploading } = useMutation(
        apiClient.uploadVerificationDocuments,
        {
            onSuccess: () => {
                showToast({
                    title: "Status: SUBMITTED",
                    description: "Your documents have been submitted for admin review.",
                    type: "SUCCESS"
                });
                queryClient.invalidateQueries("verificationStatus");
            },
            onError: (error: any) => {
                const message = error.response?.data?.message || error.message || "Failed to upload documents";
                console.error("VERIFICATION UPLOAD ERROR:", message, error);
                showToast({
                    title: "Upload Failed",
                    description: message,
                    type: "ERROR"
                });
            }
        }
    );

    const { register, handleSubmit, setValue, formState: { errors } } = useForm<VerificationFormData>({
        defaultValues: {
            idType: "Aadhaar"
        }
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: "personal" | "business") => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                showToast({ title: "File too large", description: "Max size is 5MB", type: "ERROR" });
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                if (field === "personal") setPersonalPreview(reader.result as string);
                else setBusinessPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const onSubmit = handleSubmit((data) => {
        console.log("Submitting verification form", data);
        const formData = new FormData();

        // Append all files to "documents" array as expected by backend
        if (data.personalIdFront?.[0]) {
            console.log("Appending personalIdFront:", data.personalIdFront[0].name);
            formData.append("personalIdFront", data.personalIdFront[0]);
        }
        if (data.businessProof?.[0]) {
            console.log("Appending businessProof:", data.businessProof[0].name);
            formData.append("businessProof", data.businessProof[0]);
        }

        mutate(formData);
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <LoadingSpinner />
            </div>
        );
    }

    const status = statusData?.status || "PENDING";

    return (
        <div className="container mx-auto py-10 px-4 max-w-2xl">
            <Card className="shadow-2xl border-t-8 border-t-primary-600 overflow-hidden">
                <CardHeader className="text-center pb-8 bg-gray-50/50 border-b relative">
                    <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 text-blue-600 shadow-inner">
                        <UserCheck className="w-8 h-8" />
                    </div>
                    <CardTitle className="text-3xl font-black text-gray-900 tracking-tight">Owner Verification</CardTitle>
                    <CardDescription className="text-md mt-2 font-medium">
                        Verification Status:
                        <span className={`ml-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-sm
                ${status === "VERIFIED" ? "bg-green-500 text-white" :
                                status === "REJECTED" ? "bg-red-500 text-white" :
                                    status === "SUBMITTED" ? "bg-amber-500 text-white" :
                                        "bg-gray-500 text-white"}`}>
                            {status}
                        </span>
                    </CardDescription>
                </CardHeader>

                <CardContent className="pt-8 space-y-8">
                    {status === "VERIFIED" && (
                        <div className="text-center py-10">
                            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-green-50">
                                <CheckCircle2 className="w-12 h-12 text-green-500" />
                            </div>
                            <h3 className="text-3xl font-bold text-gray-900 mb-2">Account Verified</h3>
                            <p className="text-gray-600 mb-8 max-w-sm mx-auto">Your identity documents have been approved. You can now subscribe to premium plans and manage your hotels.</p>
                            <Button onClick={() => navigate("/subscription")} className="w-full sm:w-auto px-10 py-6 text-lg font-bold bg-green-600 hover:bg-green-700 shadow-lg">
                                Go to Subscriptions
                            </Button>
                        </div>
                    )}

                    {status === "REJECTED" && (
                        <Alert variant="destructive" className="mb-6 bg-red-50 border-red-200">
                            <XCircle className="h-6 w-6 text-red-600" />
                            <AlertTitle className="text-lg font-bold text-red-800">Application Rejected</AlertTitle>
                            <AlertDescription className="mt-2 text-red-700 font-medium">
                                <p className="mb-2">Reason: {statusData?.rejectionReason || "Documents were invalid or unclear."}</p>
                                <p>Please review the requirements below and re-submit your documents.</p>
                            </AlertDescription>
                        </Alert>
                    )}

                    {(status === "PENDING" || status === "REJECTED") && (
                        <form onSubmit={onSubmit} className="space-y-8">
                            {/* ID Type Selection */}
                            <div className="space-y-3">
                                <Label className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center">
                                    <CreditCard className="w-4 h-4 mr-2 text-primary-600" />
                                    Choose Identity Type
                                </Label>
                                <Select
                                    onValueChange={(value: any) => setValue("idType", value)}
                                    defaultValue="Aadhaar"
                                >
                                    <SelectTrigger className="w-full py-6 text-md font-medium border-2 hover:border-primary-300 transition-colors">
                                        <SelectValue placeholder="Select ID Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Aadhaar">Aadhaar Card (Recommended)</SelectItem>
                                        <SelectItem value="Passport">Passport</SelectItem>
                                        <SelectItem value="Driving License">Driving License</SelectItem>
                                        <SelectItem value="PAN Card">PAN Card & Business Registration</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Dual Upload Section */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Personal ID */}
                                <div className="space-y-3">
                                    <Label className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                                        1. Personal ID (Front)
                                    </Label>
                                    <div className={`relative border-2 border-dashed rounded-2xl p-4 transition-all h-[200px] flex items-center justify-center
                                        ${personalPreview ? 'border-primary-500 bg-primary-50/20' : 'border-gray-200 hover:border-blue-400 bg-gray-50/50'}`}>
                                        {personalPreview ? (
                                            <div className="relative w-full h-full">
                                                <img src={personalPreview} className="w-full h-full object-cover rounded-xl shadow-md" alt="ID Preview" />
                                                <button
                                                    type="button"
                                                    onClick={() => setPersonalPreview(null)}
                                                    className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1.5 shadow-xl hover:bg-red-600 transition-colors"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
                                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-3">
                                                    <FileUp className="w-6 h-6 text-primary-500" />
                                                </div>
                                                <span className="text-sm font-bold text-gray-600">Upload ID Front</span>
                                                <span className="text-xs text-gray-400 mt-1">PNG, JPG or PDF</span>
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    accept="image/*,application/pdf"
                                                    {...register("personalIdFront", {
                                                        required: "Front id is required",
                                                        onChange: (e) => handleFileChange(e, "personal")
                                                    })}
                                                />
                                            </label>
                                        )}
                                    </div>
                                    {errors.personalIdFront && <p className="text-xs text-red-500 font-bold ml-1">{errors.personalIdFront.message}</p>}
                                </div>

                                {/* Business Proof */}
                                <div className="space-y-3">
                                    <Label className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                                        2. Business Proof
                                    </Label>
                                    <div className={`relative border-2 border-dashed rounded-2xl p-4 transition-all h-[200px] flex items-center justify-center
                                        ${businessPreview ? 'border-primary-500 bg-primary-50/20' : 'border-gray-200 hover:border-blue-400 bg-gray-50/50'}`}>
                                        {businessPreview ? (
                                            <div className="relative w-full h-full">
                                                <img src={businessPreview} className="w-full h-full object-cover rounded-xl shadow-md" alt="Business Preview" />
                                                <button
                                                    type="button"
                                                    onClick={() => setBusinessPreview(null)}
                                                    className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1.5 shadow-xl hover:bg-red-600 transition-colors"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
                                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-3">
                                                    <Upload className="w-6 h-6 text-primary-500" />
                                                </div>
                                                <span className="text-sm font-bold text-gray-600">Upload Business Proof</span>
                                                <span className="text-xs text-gray-400 mt-1">Registration/Tax Doc</span>
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    accept="image/*,application/pdf"
                                                    {...register("businessProof", {
                                                        required: "Business proof is required",
                                                        onChange: (e) => handleFileChange(e, "business")
                                                    })}
                                                />
                                            </label>
                                        )}
                                    </div>
                                    {errors.businessProof && <p className="text-xs text-red-500 font-bold ml-1">{errors.businessProof.message}</p>}
                                </div>
                            </div>

                            {/* Privacy Notice */}
                            <div className="bg-amber-50 rounded-2xl p-5 flex gap-4 border border-amber-100 shadow-sm transition-all hover:bg-amber-100/50">
                                <ShieldCheck className="w-8 h-8 text-amber-600 shrink-0" />
                                <div className="space-y-1">
                                    <h4 className="text-sm font-bold text-amber-900">Privacy & Security Disclaimer</h4>
                                    <p className="text-xs text-amber-800 leading-relaxed font-medium">
                                        Your documents are encrypted and stored securely. They will only be used for platform verification and legally required audit purposes. We do not share your private data with third parties.
                                    </p>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={isUploading}
                                className="w-full text-xl py-8 bg-blue-600 hover:bg-blue-700 shadow-2xl transition-all active:scale-[0.98] font-black rounded-2xl"
                            >
                                {isUploading ? (
                                    <div className="flex items-center gap-3">
                                        <LoadingSpinner size="sm" />
                                        <span>PROCESSING UPLOAD...</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <Lock className="w-5 h-5 mr-2" />
                                        SUBMIT FOR VERIFICATION
                                    </div>
                                )}
                            </Button>
                        </form>
                    )}

                    {status === "SUBMITTED" && (
                        <div className="text-center py-16">
                            <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-8 relative">
                                <AlertCircle className="w-12 h-12 text-amber-600 animate-pulse" />
                                <div className="absolute inset-0 bg-amber-400 rounded-full animate-ping opacity-20"></div>
                            </div>
                            <h3 className="text-3xl font-extrabold text-gray-900 mb-4 tracking-tight">Review in Progress</h3>
                            <p className="text-gray-600 max-w-sm mx-auto text-lg leading-relaxed">
                                Our admin team is currently reviewing your documents. You will receive an email and notification once your account status is updated.
                            </p>
                            <div className="mt-10 p-4 bg-gray-50 rounded-xl inline-block border border-gray-100">
                                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Typical response time: 24-48 Hours</p>
                            </div>
                        </div>
                    )}
                </CardContent>

                <CardFooter className="bg-gray-50 border-t py-6 flex justify-center text-gray-400 text-xs font-bold tracking-widest uppercase">
                    <ShieldCheck className="w-4 h-4 mr-2" />
                    Trusted & Secured Verification System
                </CardFooter>
            </Card>
        </div>
    );
};

export default VerificationPage;
