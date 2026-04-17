
import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { useNavigate } from "react-router-dom";
import * as apiClient from "../api-client";
import useAppContext from "../hooks/useAppContext";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import {
    CheckCircle2,
    XCircle,
    AlertCircle,
    ShieldCheck,
    UserCheck,
    Lock,
    Camera,
    CreditCard,
    ArrowRight,
    ArrowLeft,
    Fingerprint,
    ScanFace,
    FileCheck,
    Sparkles,
    Eye,
    RefreshCcw,
    RotateCcw,
    Upload,
    ImagePlus,
} from "lucide-react";
import LoadingSpinner from "../components/LoadingSpinner";
import LiveCameraCapture from "../components/LiveCameraCapture";

const STEPS = [
    { id: 1, title: "Aadhaar Number", icon: Fingerprint, description: "Enter your 12-digit Aadhaar number" },
    { id: 2, title: "Live Selfie", icon: ScanFace, description: "Capture selfie holding Aadhaar card" },
    { id: 3, title: "Capture Card", icon: CreditCard, description: "Capture clear photo of Aadhaar card" },
    { id: 4, title: "Review & Submit", icon: FileCheck, description: "Review and submit for verification" },
];

// Verhoeff algorithm for client-side validation
const verhoeffMultiplication = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
    [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
    [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
    [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
    [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
    [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
    [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
    [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
    [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];
const verhoeffPermutation = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
    [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
    [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
    [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
    [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
    [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
    [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];

function validateVerhoeffClient(num: string): boolean {
    const cleaned = num.replace(/[\s-]/g, "");
    if (!/^\d{12}$/.test(cleaned)) return false;
    if (cleaned[0] === "0" || cleaned[0] === "1") return false;

    let checksum = 0;
    const reversed = cleaned.split("").reverse().map(Number);
    for (let i = 0; i < reversed.length; i++) {
        checksum = verhoeffMultiplication[checksum][verhoeffPermutation[i % 8][reversed[i]]];
    }
    return checksum === 0;
}

function dataURLtoBlob(dataURL: string): Blob {
    const parts = dataURL.split(",");
    const mime = parts[0].match(/:(.*?);/)?.[1] || "image/jpeg";
    const byteString = atob(parts[1]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mime });
}

const IdentityVerification = () => {
    const navigate = useNavigate();
    const { showToast } = useAppContext();
    const queryClient = useQueryClient();

    const [currentStep, setCurrentStep] = useState(1);
    const [aadhaarNumber, setAadhaarNumber] = useState("");
    const [aadhaarValid, setAadhaarValid] = useState<boolean | null>(null);
    const [selfieImage, setSelfieImage] = useState<string | null>(null);
    const [aadhaarFrontImage, setAadhaarFrontImage] = useState<string | null>(null);
    const [aadhaarBackImage, setAadhaarBackImage] = useState<string | null>(null);
    const [showCamera, setShowCamera] = useState(false);
    const [cameraMode, setCameraMode] = useState<"selfie_with_aadhaar" | "aadhaar_only">("selfie_with_aadhaar");
    const [cameraCaptureTarget, setCameraCaptureTarget] = useState<"front" | "back">("front");
    const [verificationResult, setVerificationResult] = useState<any>(null);

    const { data: statusData, isLoading } = useQuery(
        "verificationStatus",
        apiClient.fetchVerificationStatus
    );

    const { mutate, isLoading: isUploading } = useMutation(
        apiClient.uploadVerificationDocuments,
        {
            onSuccess: (data: any) => {
                setVerificationResult(data);
                setCurrentStep(5); // Result step
                showToast({
                    title: data.status === "VERIFIED" ? "✅ Verified!" : "Status Updated",
                    description: data.message,
                    type: data.status === "REJECTED" ? "ERROR" : "SUCCESS",
                });
                queryClient.invalidateQueries("verificationStatus");
                queryClient.invalidateQueries("fetchCurrentUser");
            },
            onError: (error: any) => {
                const message = error.response?.data?.message || error.message || "Failed to upload documents";
                showToast({
                    title: "Upload Failed",
                    description: message,
                    type: "ERROR",
                });
            },
        }
    );

    // Real-time Aadhaar validation
    useEffect(() => {
        const cleaned = aadhaarNumber.replace(/[\s-]/g, "");
        if (cleaned.length === 12) {
            setAadhaarValid(validateVerhoeffClient(cleaned));
        } else {
            setAadhaarValid(null);
        }
    }, [aadhaarNumber]);

    const handleAadhaarInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/[^\d\s-]/g, "");
        // Auto-format: XXXX XXXX XXXX
        const digits = value.replace(/[\s-]/g, "");
        if (digits.length <= 12) {
            const formatted = digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
            setAadhaarNumber(formatted);
        }
    };

    const handleSelfieCapture = (imageDataUrl: string) => {
        setSelfieImage(imageDataUrl);
        setShowCamera(false);
    };

    const handleAadhaarCardCapture = (imageDataUrl: string) => {
        if (cameraCaptureTarget === "front") {
            setAadhaarFrontImage(imageDataUrl);
        } else {
            setAadhaarBackImage(imageDataUrl);
        }
        setShowCamera(false);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: "front" | "back") => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            showToast({ title: "File too large", description: "Maximum file size is 5MB", type: "ERROR" });
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            if (target === "front") {
                setAadhaarFrontImage(result);
            } else {
                setAadhaarBackImage(result);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = () => {
        if (!aadhaarNumber || !selfieImage || !aadhaarFrontImage || !aadhaarBackImage) return;

        const formData = new FormData();
        formData.append("aadhaarNumber", aadhaarNumber.replace(/\s/g, ""));
        formData.append("aadhaarFront", dataURLtoBlob(aadhaarFrontImage), "aadhaar_front.jpg");
        formData.append("aadhaarBack", dataURLtoBlob(aadhaarBackImage), "aadhaar_back.jpg");
        formData.append("selfie", dataURLtoBlob(selfieImage), "selfie_with_aadhaar.jpg");

        mutate(formData);
    };

    const canProceed = () => {
        switch (currentStep) {
            case 1: return aadhaarValid === true;
            case 2: return selfieImage !== null;
            case 3: return aadhaarFrontImage !== null && aadhaarBackImage !== null;
            case 4: return true;
            default: return false;
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <LoadingSpinner />
            </div>
        );
    }

    const status = statusData?.status || "PENDING";

    // Show existing status (already verified/submitted)
    if (status === "VERIFIED" && currentStep < 5) {
        return (
            <div className="container mx-auto py-10 px-4 max-w-2xl">
                <Card className="shadow-2xl border-t-8 border-t-emerald-500 overflow-hidden">
                    <CardContent className="pt-12 pb-12">
                        <div className="text-center">
                            <div className="w-28 h-28 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-emerald-50 shadow-lg shadow-emerald-500/20">
                                <CheckCircle2 className="w-14 h-14 text-emerald-500" />
                            </div>
                            <h3 className="text-3xl font-black text-gray-900 mb-2">Identity Verified</h3>
                            <p className="text-gray-600 mb-2 max-w-sm mx-auto">Your Aadhaar-based identity has been verified successfully.</p>
                            {statusData?.confidenceScore && (
                                <p className="text-sm font-bold text-emerald-600 mb-8">
                                    AI Confidence: {statusData.confidenceScore}%
                                </p>
                            )}
                            <Button onClick={() => navigate("/")} className="px-10 py-6 text-lg font-bold bg-emerald-600 hover:bg-emerald-700 shadow-lg">
                                Explore Hotels
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (status === "SUBMITTED" && currentStep < 5) {
        return (
            <div className="container mx-auto py-10 px-4 max-w-2xl">
                <Card className="shadow-2xl border-t-8 border-t-amber-500 overflow-hidden">
                    <CardContent className="pt-12 pb-12">
                        <div className="text-center">
                            <div className="w-28 h-28 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-8 relative">
                                <AlertCircle className="w-14 h-14 text-amber-600 animate-pulse" />
                                <div className="absolute inset-0 bg-amber-400 rounded-full animate-ping opacity-20"></div>
                            </div>
                            <h3 className="text-3xl font-black text-gray-900 mb-4">Under Review</h3>
                            <p className="text-gray-600 max-w-sm mx-auto text-lg leading-relaxed">
                                Our AI flagged some items for manual review. An admin will verify your documents shortly.
                            </p>
                            {statusData?.confidenceScore !== undefined && (
                                <div className="mt-6 inline-block bg-gray-50 rounded-xl px-6 py-3 border border-gray-100">
                                    <p className="text-sm font-bold text-gray-500">AI Confidence Score</p>
                                    <p className="text-2xl font-black text-amber-600">{statusData.confidenceScore}%</p>
                                </div>
                            )}
                            <div className="mt-8 p-4 bg-gray-50 rounded-xl inline-block border border-gray-100">
                                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Typical Response: 2-4 Hours</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Show camera full screen when active
    if (showCamera) {
        return (
            <div className="container mx-auto py-6 px-4 max-w-2xl">
                <LiveCameraCapture
                    mode={cameraMode}
                    onCapture={cameraMode === "selfie_with_aadhaar" ? handleSelfieCapture : handleAadhaarCardCapture}
                    onCancel={() => setShowCamera(false)}
                />
            </div>
        );
    }

    return (
        <div className="container mx-auto py-10 px-4 max-w-2xl">
            <Card className="shadow-2xl border-t-8 border-t-blue-600 overflow-hidden">
                {/* Header */}
                <CardHeader className="text-center pb-6 bg-gradient-to-b from-blue-50 to-white border-b relative">
                    <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 text-blue-600 shadow-inner">
                        <ShieldCheck className="w-8 h-8" />
                    </div>
                    <CardTitle className="text-2xl font-black text-gray-900 tracking-tight">
                        Smart Aadhaar Verification
                    </CardTitle>
                    <CardDescription className="text-sm mt-1 font-medium text-gray-500">
                        AI-powered identity verification with live capture
                    </CardDescription>

                    {/* Step Indicator */}
                    {currentStep <= 4 && (
                        <div className="flex items-center justify-center gap-1 mt-6 px-4">
                            {STEPS.map((step, idx) => {
                                const StepIcon = step.icon;
                                const isActive = currentStep === step.id;
                                const isCompleted = currentStep > step.id;

                                return (
                                    <div key={step.id} className="flex items-center">
                                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                                            isActive
                                                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                                                : isCompleted
                                                    ? "bg-emerald-100 text-emerald-700"
                                                    : "bg-gray-100 text-gray-400"
                                        }`}>
                                            {isCompleted ? (
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                            ) : (
                                                <StepIcon className="w-3.5 h-3.5" />
                                            )}
                                            <span className="hidden sm:inline">{step.title}</span>
                                            <span className="sm:hidden">{step.id}</span>
                                        </div>
                                        {idx < STEPS.length - 1 && (
                                            <div className={`w-4 h-0.5 mx-0.5 rounded ${
                                                currentStep > step.id ? "bg-emerald-400" : "bg-gray-200"
                                            }`} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardHeader>

                <CardContent className="pt-8 pb-6 px-6 sm:px-8 min-h-[350px]">
                    {/* REJECTED status banner */}
                    {status === "REJECTED" && currentStep === 1 && (
                        <Alert variant="destructive" className="mb-6 bg-red-50 border-red-200">
                            <XCircle className="h-5 w-5 text-red-600" />
                            <AlertTitle className="text-base font-bold text-red-800">Previous Attempt Rejected</AlertTitle>
                            <AlertDescription className="mt-1 text-red-700 text-sm">
                                {statusData?.rejectionReason || "Documents were invalid. Please try again with clear, valid documents."}
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* ===== STEP 1: Aadhaar Number ===== */}
                    {currentStep === 1 && (
                        <div className="space-y-6">
                            <div className="text-center mb-4">
                                <Fingerprint className="w-12 h-12 text-blue-500 mx-auto mb-3" />
                                <h3 className="text-xl font-black text-gray-900">Enter Aadhaar Number</h3>
                                <p className="text-sm text-gray-500 mt-1">We validate using the official Verhoeff checksum algorithm</p>
                            </div>

                            <div className="relative">
                                <input
                                    type="text"
                                    value={aadhaarNumber}
                                    onChange={handleAadhaarInput}
                                    placeholder="XXXX XXXX XXXX"
                                    maxLength={14}
                                    className={`w-full text-center text-3xl font-mono font-black tracking-[0.3em] py-5 px-4 rounded-2xl border-2 
                                        transition-all outline-none
                                        ${aadhaarValid === true
                                            ? "border-emerald-400 bg-emerald-50 text-emerald-800 ring-4 ring-emerald-100"
                                            : aadhaarValid === false
                                                ? "border-red-400 bg-red-50 text-red-800 ring-4 ring-red-100"
                                                : "border-gray-200 bg-gray-50 text-gray-800 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                                        }`}
                                />

                                {/* Validation indicator */}
                                {aadhaarValid !== null && (
                                    <div className={`absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 ${
                                        aadhaarValid ? "text-emerald-600" : "text-red-600"
                                    }`}>
                                        {aadhaarValid ? (
                                            <CheckCircle2 className="w-7 h-7" />
                                        ) : (
                                            <XCircle className="w-7 h-7" />
                                        )}
                                    </div>
                                )}
                            </div>

                            {aadhaarValid === false && (
                                <p className="text-sm font-bold text-red-600 text-center">
                                    ❌ Invalid Aadhaar number (Verhoeff checksum failed)
                                </p>
                            )}
                            {aadhaarValid === true && (
                                <p className="text-sm font-bold text-emerald-600 text-center">
                                    ✅ Valid Aadhaar number format
                                </p>
                            )}

                            <div className="bg-blue-50 rounded-2xl p-4 flex gap-3 border border-blue-100">
                                <ShieldCheck className="w-6 h-6 text-blue-600 shrink-0" />
                                <div className="space-y-1">
                                    <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider">Privacy First</h4>
                                    <p className="text-xs text-blue-800 leading-relaxed">
                                        Your Aadhaar number is masked (XXXX-XXXX-last4) before storage. We never store the full number.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ===== STEP 2: Selfie with Aadhaar ===== */}
                    {currentStep === 2 && (
                        <div className="space-y-6">
                            <div className="text-center mb-4">
                                <ScanFace className="w-12 h-12 text-blue-500 mx-auto mb-3" />
                                <h3 className="text-xl font-black text-gray-900">Live Selfie with Aadhaar</h3>
                                <p className="text-sm text-gray-500 mt-1">Hold your Aadhaar card next to your face and capture</p>
                            </div>

                            {selfieImage ? (
                                <div className="space-y-4">
                                    <div className="relative rounded-2xl overflow-hidden shadow-xl border-4 border-emerald-200">
                                        <img
                                            src={selfieImage}
                                            alt="Selfie with Aadhaar"
                                            className="w-full aspect-[4/3] object-cover"
                                        />
                                        <div className="absolute top-3 right-3 bg-emerald-500 text-white p-2 rounded-full shadow-lg">
                                            <CheckCircle2 className="w-5 h-5" />
                                        </div>
                                    </div>
                                    <Button
                                        type="button"
                                        onClick={() => {
                                            setCameraMode("selfie_with_aadhaar");
                                            setShowCamera(true);
                                        }}
                                        variant="outline"
                                        className="w-full h-12 rounded-xl border-2 border-amber-300 text-amber-700 hover:bg-amber-50 font-bold"
                                    >
                                        <RotateCcw className="w-4 h-4 mr-2" />
                                        Retake Selfie
                                    </Button>
                                </div>
                            ) : (
                                <Button
                                    type="button"
                                    onClick={() => {
                                        setCameraMode("selfie_with_aadhaar");
                                        setShowCamera(true);
                                    }}
                                    className="w-full h-20 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-lg shadow-xl shadow-blue-500/30"
                                >
                                    <Camera className="w-6 h-6 mr-3" />
                                    Open Camera
                                </Button>
                            )}

                            <div className="bg-amber-50 rounded-2xl p-4 flex gap-3 border border-amber-100">
                                <Eye className="w-6 h-6 text-amber-600 shrink-0" />
                                <div className="space-y-1">
                                    <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">Why a selfie?</h4>
                                    <p className="text-xs text-amber-800 leading-relaxed">
                                        The selfie with Aadhaar proves that you are the actual person on the card. This prevents someone from submitting someone else's ID.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ===== STEP 3: Aadhaar Card Capture (Front + Back) ===== */}
                    {currentStep === 3 && (
                        <div className="space-y-6">
                            <div className="text-center mb-2">
                                <CreditCard className="w-12 h-12 text-blue-500 mx-auto mb-3" />
                                <h3 className="text-xl font-black text-gray-900">Aadhaar Card — Front & Back</h3>
                                <p className="text-sm text-gray-500 mt-1">Capture or upload clear images of both sides of your Aadhaar card</p>
                            </div>

                            {/* Front Side */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-black">1</div>
                                    <span className="text-sm font-black text-gray-700 uppercase tracking-wider">Front Side</span>
                                    {aadhaarFrontImage && <CheckCircle2 className="w-4 h-4 text-emerald-500 ml-auto" />}
                                </div>

                                {aadhaarFrontImage ? (
                                    <div className="space-y-2">
                                        <div className="relative rounded-xl overflow-hidden shadow-lg border-2 border-emerald-200">
                                            <img src={aadhaarFrontImage} alt="Aadhaar Front" className="w-full aspect-[16/10] object-cover" />
                                            <div className="absolute top-2 right-2 bg-emerald-500 text-white p-1.5 rounded-full shadow">
                                                <CheckCircle2 className="w-4 h-4" />
                                            </div>
                                        </div>
                                        <Button type="button" onClick={() => setAadhaarFrontImage(null)} variant="outline" className="w-full h-10 rounded-xl border-2 border-gray-200 text-gray-500 hover:bg-gray-50 font-bold text-xs">
                                            <RotateCcw className="w-3 h-3 mr-1.5" /> Change Front Image
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-3">
                                        <Button
                                            type="button"
                                            onClick={() => { setCameraMode("aadhaar_only"); setCameraCaptureTarget("front"); setShowCamera(true); }}
                                            className="h-16 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-lg"
                                        >
                                            <Camera className="w-5 h-5 mr-2" />
                                            Capture
                                        </Button>
                                        <label className="h-16 rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50/50 cursor-pointer flex items-center justify-center gap-2 text-sm font-bold text-gray-600 transition-all">
                                            <Upload className="w-5 h-5" />
                                            Upload
                                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, "front")} />
                                        </label>
                                    </div>
                                )}
                            </div>

                            {/* Divider */}
                            <div className="border-t border-gray-100" />

                            {/* Back Side */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-black">2</div>
                                    <span className="text-sm font-black text-gray-700 uppercase tracking-wider">Back Side</span>
                                    {aadhaarBackImage && <CheckCircle2 className="w-4 h-4 text-emerald-500 ml-auto" />}
                                </div>

                                {aadhaarBackImage ? (
                                    <div className="space-y-2">
                                        <div className="relative rounded-xl overflow-hidden shadow-lg border-2 border-emerald-200">
                                            <img src={aadhaarBackImage} alt="Aadhaar Back" className="w-full aspect-[16/10] object-cover" />
                                            <div className="absolute top-2 right-2 bg-emerald-500 text-white p-1.5 rounded-full shadow">
                                                <CheckCircle2 className="w-4 h-4" />
                                            </div>
                                        </div>
                                        <Button type="button" onClick={() => setAadhaarBackImage(null)} variant="outline" className="w-full h-10 rounded-xl border-2 border-gray-200 text-gray-500 hover:bg-gray-50 font-bold text-xs">
                                            <RotateCcw className="w-3 h-3 mr-1.5" /> Change Back Image
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-3">
                                        <Button
                                            type="button"
                                            onClick={() => { setCameraMode("aadhaar_only"); setCameraCaptureTarget("back"); setShowCamera(true); }}
                                            className="h-16 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-sm shadow-lg"
                                        >
                                            <Camera className="w-5 h-5 mr-2" />
                                            Capture
                                        </Button>
                                        <label className="h-16 rounded-xl border-2 border-dashed border-gray-300 hover:border-indigo-400 hover:bg-indigo-50/50 cursor-pointer flex items-center justify-center gap-2 text-sm font-bold text-gray-600 transition-all">
                                            <Upload className="w-5 h-5" />
                                            Upload
                                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, "back")} />
                                        </label>
                                    </div>
                                )}
                            </div>

                            <div className="bg-blue-50 rounded-2xl p-4 flex gap-3 border border-blue-100">
                                <Sparkles className="w-6 h-6 text-blue-600 shrink-0" />
                                <div className="space-y-1">
                                    <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider">AI-Powered OCR</h4>
                                    <p className="text-xs text-blue-800 leading-relaxed">
                                        Our AI reads the front of your Aadhaar card to cross-verify the number and name. Both front and back are securely stored for verification.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ===== STEP 4: Review ===== */}
                    {currentStep === 4 && (
                        <div className="space-y-6">
                            <div className="text-center mb-4">
                                <FileCheck className="w-12 h-12 text-blue-500 mx-auto mb-3" />
                                <h3 className="text-xl font-black text-gray-900">Review & Submit</h3>
                                <p className="text-sm text-gray-500 mt-1">Verify your details before submission</p>
                            </div>

                            {/* Aadhaar Number */}
                            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                                <div className="flex items-center gap-3 mb-2">
                                    <Fingerprint className="w-5 h-5 text-blue-500" />
                                    <span className="text-xs font-black text-gray-500 uppercase tracking-wider">Aadhaar Number</span>
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 ml-auto" />
                                </div>
                                <p className="text-2xl font-mono font-black text-gray-800 tracking-widest">{aadhaarNumber}</p>
                                <p className="text-xs text-gray-400 mt-1">Stored as: XXXX-XXXX-{aadhaarNumber.replace(/\s/g, "").slice(8)}</p>
                            </div>

                            {/* Images */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-1.5">
                                        <ScanFace className="w-3.5 h-3.5 text-blue-500" />
                                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Selfie</span>
                                    </div>
                                    <div className="rounded-xl overflow-hidden shadow-md border-2 border-gray-100 aspect-[3/4]">
                                        <img src={selfieImage!} alt="Selfie" className="w-full h-full object-cover" />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-1.5">
                                        <CreditCard className="w-3.5 h-3.5 text-blue-500" />
                                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Front</span>
                                    </div>
                                    <div className="rounded-xl overflow-hidden shadow-md border-2 border-gray-100 aspect-[3/4]">
                                        <img src={aadhaarFrontImage!} alt="Aadhaar Front" className="w-full h-full object-cover" />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-1.5">
                                        <CreditCard className="w-3.5 h-3.5 text-indigo-500" />
                                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Back</span>
                                    </div>
                                    <div className="rounded-xl overflow-hidden shadow-md border-2 border-gray-100 aspect-[3/4]">
                                        <img src={aadhaarBackImage!} alt="Aadhaar Back" className="w-full h-full object-cover" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-emerald-50 rounded-2xl p-4 flex gap-3 border border-emerald-100">
                                <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
                                <div className="space-y-1">
                                    <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider">What happens next</h4>
                                    <p className="text-xs text-emerald-800 leading-relaxed">
                                        Our AI will run 6 verification checks: Verhoeff checksum, OCR number matching, name matching, document authenticity, duplicate detection, and image quality analysis.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ===== STEP 5: Result (always "Under Review") ===== */}
                    {currentStep === 5 && verificationResult && (
                        <div className="space-y-5">
                            <div className="text-center">
                                <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-blue-50 shadow-lg shadow-blue-500/20 relative">
                                    <ShieldCheck className="w-12 h-12 text-blue-600" />
                                    <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-10"></div>
                                </div>
                                <h3 className="text-2xl font-black text-gray-900">Submitted for Admin Review 📋</h3>
                                <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
                                    Our AI has completed its analysis. An admin will review all details and make the final decision.
                                </p>
                            </div>

                            {/* AI Confidence Score */}
                            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">AI Confidence Score</p>
                                    <span className={`text-xl font-black ${
                                        verificationResult.confidenceScore >= 80 ? "text-emerald-600"
                                        : verificationResult.confidenceScore >= 40 ? "text-amber-600"
                                        : "text-red-600"
                                    }`}>{verificationResult.confidenceScore}%</span>
                                </div>
                                <div className="relative w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-1000 ${
                                            verificationResult.confidenceScore >= 80
                                                ? "bg-gradient-to-r from-emerald-400 to-green-500"
                                                : verificationResult.confidenceScore >= 40
                                                    ? "bg-gradient-to-r from-amber-400 to-orange-500"
                                                    : "bg-gradient-to-r from-red-400 to-rose-500"
                                        }`}
                                        style={{ width: `${verificationResult.confidenceScore}%` }}
                                    />
                                </div>
                                <p className="text-xs text-gray-400 mt-2 text-center">This score is advisory — the admin makes the final decision</p>
                            </div>

                            {/* Check grid summary */}
                            {verificationResult.checks && (
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { key: "verhoeffValid", label: "Checksum" },
                                        { key: "ocrNumberMatch", label: "ID Match" },
                                        { key: "ocrNameMatch", label: "Name" },
                                        { key: "ocrKeywordsFound", label: "Authentic" },
                                        { key: "duplicateCheck", label: "Unique" },
                                        { key: "imageQuality", label: "Quality" },
                                    ].map(({ key, label }) => {
                                        const passed = verificationResult.checks[key];
                                        return (
                                            <div key={key} className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-center ${
                                                passed ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"
                                            }`}>
                                                {passed
                                                    ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                                    : <XCircle className="w-4 h-4 text-red-500" />
                                                }
                                                <span className="text-[10px] font-black text-gray-600 uppercase tracking-wide">{label}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Action buttons */}
                            <div className="flex gap-3 pt-1">
                                <Button
                                    onClick={() => navigate("/")}
                                    variant="outline"
                                        className="flex-1 h-14 text-lg font-bold border-2 rounded-2xl"
                                    >
                                        Go to Home
                                    </Button>
                            </div>
                        </div>
                    )}
                </CardContent>

                {/* Navigation buttons (Steps 1-4) */}
                {currentStep >= 1 && currentStep <= 4 && (
                    <CardFooter className="bg-gray-50 border-t py-5 px-6 sm:px-8 flex justify-between gap-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => currentStep === 1 ? navigate(-1) : setCurrentStep(currentStep - 1)}
                            className="h-12 px-6 rounded-xl border-2 font-bold"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            {currentStep === 1 ? "Cancel" : "Back"}
                        </Button>

                        {currentStep < 4 ? (
                            <Button
                                type="button"
                                onClick={() => setCurrentStep(currentStep + 1)}
                                disabled={!canProceed()}
                                className="h-12 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 font-black shadow-lg"
                            >
                                Next
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                onClick={handleSubmit}
                                disabled={isUploading}
                                className="h-12 px-8 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 font-black shadow-xl shadow-blue-500/30"
                            >
                                {isUploading ? (
                                    <div className="flex items-center gap-2">
                                        <LoadingSpinner size="sm" />
                                        <span>Verifying...</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <Lock className="w-4 h-4" />
                                        Submit for Verification
                                    </div>
                                )}
                            </Button>
                        )}
                    </CardFooter>
                )}
            </Card>
        </div>
    );
};

export default IdentityVerification;
