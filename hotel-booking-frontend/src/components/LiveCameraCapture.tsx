import { useState, useRef, useCallback, useEffect } from "react";
import { Camera, RotateCcw, Check, X, FlipHorizontal, Aperture } from "lucide-react";
import { Button } from "./ui/button";

type CaptureMode = "selfie_with_aadhaar" | "aadhaar_only";

type Props = {
    mode: CaptureMode;
    onCapture: (imageDataUrl: string) => void;
    onCancel: () => void;
};

const LiveCameraCapture = ({ mode, onCapture, onCancel }: Props) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const [isCameraActive, setIsCameraActive] = useState(false);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [countdown, setCountdown] = useState<number | null>(null);
    const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
    const [cameraError, setCameraError] = useState<string | null>(null);

    const startCamera = useCallback(async () => {
        try {
            setCameraError(null);

            // Stop existing stream if any
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
            }

            const constraints: MediaStreamConstraints = {
                video: {
                    facingMode: facingMode,
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                },
                audio: false,
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
                setIsCameraActive(true);
            }
        } catch (error: any) {
            console.error("Camera access error:", error);
            if (error.name === "NotAllowedError") {
                setCameraError("Camera access denied. Please allow camera access in your browser settings.");
            } else if (error.name === "NotFoundError") {
                setCameraError("No camera found on this device.");
            } else {
                setCameraError("Could not access camera. Please try again.");
            }
        }
    }, [facingMode]);

    useEffect(() => {
        startCamera();

        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
            }
        };
    }, [startCamera]);

    const toggleCamera = async () => {
        setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
    };

    const startCountdown = () => {
        setCountdown(3);
        const interval = setInterval(() => {
            setCountdown((prev) => {
                if (prev === null || prev <= 1) {
                    clearInterval(interval);
                    capturePhoto();
                    return null;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        if (!ctx) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Mirror the image for front-facing camera
        if (facingMode === "user") {
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageDataUrl = canvas.toDataURL("image/jpeg", 0.85);
        setCapturedImage(imageDataUrl);

        // Stop the camera
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            setIsCameraActive(false);
        }
    };

    const retake = () => {
        setCapturedImage(null);
        startCamera();
    };

    const acceptPhoto = () => {
        if (capturedImage) {
            onCapture(capturedImage);
        }
    };

    const guidanceText = mode === "selfie_with_aadhaar"
        ? "Hold your Aadhaar card next to your face. Make sure both your face and the card are clearly visible."
        : "Place your Aadhaar card on a flat surface and capture a clear photo of the front side.";

    const titleText = mode === "selfie_with_aadhaar"
        ? "Selfie with Aadhaar Card"
        : "Capture Aadhaar Card";

    return (
        <div className="flex flex-col items-center w-full">
            <div className="w-full max-w-lg mx-auto">
                {/* Title */}
                <div className="text-center mb-4">
                    <h3 className="text-lg font-black text-gray-900">{titleText}</h3>
                    <p className="text-sm text-gray-500 mt-1">{guidanceText}</p>
                </div>

                {/* Camera Error */}
                {cameraError && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4 text-center">
                        <Camera className="w-8 h-8 text-red-400 mx-auto mb-2" />
                        <p className="text-sm font-bold text-red-700">{cameraError}</p>
                        <Button
                            onClick={startCamera}
                            className="mt-3 bg-red-600 hover:bg-red-700 text-white text-xs"
                        >
                            Try Again
                        </Button>
                    </div>
                )}

                {/* Camera / Preview */}
                <div className="relative rounded-2xl overflow-hidden bg-black aspect-[4/3] shadow-2xl border-4 border-gray-200">
                    {!capturedImage ? (
                        <>
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className={`w-full h-full object-cover ${facingMode === "user" ? "scale-x-[-1]" : ""}`}
                            />

                            {/* Overlay Guide */}
                            {mode === "selfie_with_aadhaar" && isCameraActive && (
                                <div className="absolute inset-0 pointer-events-none">
                                    {/* Face oval guide */}
                                    <div className="absolute top-[10%] left-[15%] w-[35%] h-[60%] border-2 border-dashed border-white/60 rounded-full" />
                                    <div className="absolute top-[10%] left-[15%] w-[35%] h-[60%] flex items-end justify-center pb-2">
                                        <span className="text-[10px] font-black text-white/80 bg-black/40 px-2 py-1 rounded-full uppercase tracking-wider">Face</span>
                                    </div>

                                    {/* Card guide - right side */}
                                    <div className="absolute top-[25%] right-[5%] w-[40%] h-[40%] border-2 border-dashed border-emerald-400/70 rounded-xl" />
                                    <div className="absolute top-[25%] right-[5%] w-[40%] h-[40%] flex items-end justify-center pb-2">
                                        <span className="text-[10px] font-black text-emerald-300 bg-black/40 px-2 py-1 rounded-full uppercase tracking-wider">Aadhaar</span>
                                    </div>
                                </div>
                            )}

                            {mode === "aadhaar_only" && isCameraActive && (
                                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                    <div className="w-[85%] h-[55%] border-2 border-dashed border-blue-400/70 rounded-xl relative">
                                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-black text-blue-300 bg-black/60 px-3 py-1 rounded-full uppercase tracking-wider">
                                            Align Aadhaar Card Here
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Countdown */}
                            {countdown !== null && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                    <span className="text-8xl font-black text-white animate-ping">
                                        {countdown}
                                    </span>
                                </div>
                            )}
                        </>
                    ) : (
                        <img
                            src={capturedImage}
                            alt="Captured"
                            className="w-full h-full object-cover"
                        />
                    )}
                </div>

                {/* Controls */}
                <div className="flex gap-3 mt-4 justify-center">
                    {!capturedImage ? (
                        <>
                            <Button
                                type="button"
                                onClick={onCancel}
                                variant="outline"
                                className="flex-1 h-12 rounded-xl border-2 border-gray-200 text-gray-600 hover:bg-gray-50 font-bold"
                            >
                                <X className="w-4 h-4 mr-2" />
                                Cancel
                            </Button>

                            <Button
                                type="button"
                                onClick={toggleCamera}
                                variant="outline"
                                className="h-12 w-12 rounded-xl border-2 border-gray-200 text-gray-600 hover:bg-gray-50 p-0"
                                disabled={!isCameraActive}
                            >
                                <FlipHorizontal className="w-5 h-5" />
                            </Button>

                            <Button
                                type="button"
                                onClick={startCountdown}
                                disabled={!isCameraActive || countdown !== null}
                                className="flex-1 h-12 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black shadow-lg shadow-blue-500/30"
                            >
                                <Aperture className="w-5 h-5 mr-2" />
                                Capture
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                type="button"
                                onClick={retake}
                                variant="outline"
                                className="flex-1 h-12 rounded-xl border-2 border-amber-300 text-amber-700 hover:bg-amber-50 font-bold"
                            >
                                <RotateCcw className="w-4 h-4 mr-2" />
                                Retake
                            </Button>

                            <Button
                                type="button"
                                onClick={acceptPhoto}
                                className="flex-1 h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-black shadow-lg shadow-emerald-500/30"
                            >
                                <Check className="w-5 h-5 mr-2" />
                                Use Photo
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Hidden canvas for capture */}
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
};

export default LiveCameraCapture;
