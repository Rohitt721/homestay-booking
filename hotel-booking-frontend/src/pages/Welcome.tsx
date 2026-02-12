import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "react-query";
import * as apiClient from "../api-client";
import useAppContext from "../hooks/useAppContext";
import {
    Sparkles,
    Map,
    Building2,
    ArrowRight,
    CheckCircle,
    Loader2,
    Globe,
    Heart,
    Star,
} from "lucide-react";
import { Button } from "../components/ui/button";
import {
    Card,
    CardContent,
} from "../components/ui/card";

const HEARD_FROM_OPTIONS = [
    "Search Engine (Google, Bing, etc.)",
    "Social Media (Instagram, Facebook, etc.)",
    "Friend or Family",
    "Travel Blog / Article",
    "Other",
];

const Welcome = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { showToast } = useAppContext();
    const [selectedRole, setSelectedRole] = useState<"user" | "hotel_owner" | null>(null);
    const [heardFrom, setHeardFrom] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [step, setStep] = useState(1);

    const handleContinue = async () => {
        if (!selectedRole) return;

        setIsSubmitting(true);
        try {
            await apiClient.completeOnboarding(selectedRole, heardFrom || undefined);
            await queryClient.invalidateQueries("validateToken");

            showToast({
                title: "Welcome to HomeStay! 🎉",
                description: selectedRole === "hotel_owner"
                    ? "Your owner account is ready. Start listing your properties!"
                    : "Your account is ready. Discover amazing stays!",
                type: "SUCCESS",
            });

            navigate("/");
        } catch (error: any) {
            showToast({
                title: "Something went wrong",
                description: error?.response?.data?.message || "Failed to complete setup",
                type: "ERROR",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary-50 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-700 rounded-3xl shadow-xl shadow-primary-200 mb-6">
                        <Sparkles className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-4xl font-extrabold text-gray-900 mb-3 tracking-tight">
                        Welcome to HomeStay!
                    </h1>
                    <p className="text-gray-500 text-lg max-w-md mx-auto">
                        Let's get you set up. Just a quick step to personalize your experience.
                    </p>
                </div>

                {/* Step 1: Role Selection */}
                {step === 1 && (
                    <div className="space-y-6">
                        <h2 className="text-center text-lg font-semibold text-gray-700">
                            What brings you to HomeStay?
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {/* Traveller Card */}
                            <button
                                onClick={() => setSelectedRole("user")}
                                className="group relative"
                            >
                                <Card className={`relative overflow-hidden border-2 transition-all duration-300 cursor-pointer hover:shadow-xl hover:-translate-y-1 ${selectedRole === "user"
                                        ? "border-primary-500 bg-primary-50/50 shadow-lg shadow-primary-100"
                                        : "border-gray-200 hover:border-primary-200"
                                    }`}>
                                    {selectedRole === "user" && (
                                        <div className="absolute top-3 right-3 w-7 h-7 bg-primary-500 rounded-full flex items-center justify-center">
                                            <CheckCircle className="w-5 h-5 text-white" />
                                        </div>
                                    )}
                                    <CardContent className="p-8 text-center space-y-4">
                                        <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center transition-colors duration-300 ${selectedRole === "user"
                                                ? "bg-gradient-to-br from-blue-400 to-blue-600"
                                                : "bg-blue-100 group-hover:bg-blue-200"
                                            }`}>
                                            <Map className={`w-8 h-8 ${selectedRole === "user" ? "text-white" : "text-blue-600"}`} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900 mb-1">I'm a Traveller</h3>
                                            <p className="text-sm text-gray-500 leading-relaxed">
                                                Discover and book amazing stays, plan trips, and explore new destinations
                                            </p>
                                        </div>
                                        <div className="flex justify-center gap-3">
                                            <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                                                <Globe className="w-3.5 h-3.5" /> Explore
                                            </span>
                                            <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                                                <Heart className="w-3.5 h-3.5" /> Save
                                            </span>
                                            <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                                                <Star className="w-3.5 h-3.5" /> Review
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </button>

                            {/* Hotel Owner Card */}
                            <button
                                onClick={() => setSelectedRole("hotel_owner")}
                                className="group relative"
                            >
                                <Card className={`relative overflow-hidden border-2 transition-all duration-300 cursor-pointer hover:shadow-xl hover:-translate-y-1 ${selectedRole === "hotel_owner"
                                        ? "border-primary-500 bg-primary-50/50 shadow-lg shadow-primary-100"
                                        : "border-gray-200 hover:border-primary-200"
                                    }`}>
                                    {selectedRole === "hotel_owner" && (
                                        <div className="absolute top-3 right-3 w-7 h-7 bg-primary-500 rounded-full flex items-center justify-center">
                                            <CheckCircle className="w-5 h-5 text-white" />
                                        </div>
                                    )}
                                    <CardContent className="p-8 text-center space-y-4">
                                        <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center transition-colors duration-300 ${selectedRole === "hotel_owner"
                                                ? "bg-gradient-to-br from-amber-400 to-orange-600"
                                                : "bg-amber-100 group-hover:bg-amber-200"
                                            }`}>
                                            <Building2 className={`w-8 h-8 ${selectedRole === "hotel_owner" ? "text-white" : "text-amber-600"}`} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900 mb-1">I'm a Hotel Owner</h3>
                                            <p className="text-sm text-gray-500 leading-relaxed">
                                                List your properties, manage bookings, and grow your hospitality business
                                            </p>
                                        </div>
                                        <div className="flex justify-center gap-3">
                                            <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                                                <Building2 className="w-3.5 h-3.5" /> List
                                            </span>
                                            <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                                                <Star className="w-3.5 h-3.5" /> Manage
                                            </span>
                                            <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                                                <Globe className="w-3.5 h-3.5" /> Earn
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </button>
                        </div>

                        {/* Next Button */}
                        <Button
                            onClick={() => selectedRole && setStep(2)}
                            disabled={!selectedRole}
                            className="w-full py-3 mt-4 text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed shadow-lg rounded-xl text-base font-semibold"
                        >
                            <ArrowRight className="w-5 h-5 mr-2" />
                            Continue
                        </Button>
                    </div>
                )}

                {/* Step 2: How did you hear about us? */}
                {step === 2 && (
                    <div className="space-y-6">
                        <h2 className="text-center text-lg font-semibold text-gray-700">
                            How did you hear about us?
                        </h2>
                        <p className="text-center text-sm text-gray-400">
                            This helps us improve — completely optional!
                        </p>

                        <div className="space-y-3 max-w-md mx-auto">
                            {HEARD_FROM_OPTIONS.map((option) => (
                                <button
                                    key={option}
                                    onClick={() => setHeardFrom(option)}
                                    className={`w-full px-5 py-3.5 text-left rounded-xl border-2 transition-all duration-200 text-sm font-medium ${heardFrom === option
                                            ? "border-primary-500 bg-primary-50 text-primary-700"
                                            : "border-gray-200 text-gray-600 hover:border-primary-200 hover:bg-gray-50"
                                        }`}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>

                        <div className="flex gap-3 max-w-md mx-auto">
                            <Button
                                onClick={() => setStep(1)}
                                variant="ghost"
                                className="flex-1 py-3 text-gray-500 hover:text-gray-700 rounded-xl"
                            >
                                Back
                            </Button>
                            <Button
                                onClick={handleContinue}
                                disabled={isSubmitting}
                                className="flex-[2] py-3 text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 shadow-lg rounded-xl text-base font-semibold"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                        Setting up...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-5 h-5 mr-2" />
                                        Get Started
                                    </>
                                )}
                            </Button>
                        </div>

                        <button
                            onClick={handleContinue}
                            disabled={isSubmitting}
                            className="block mx-auto text-xs text-gray-400 hover:text-gray-500 underline underline-offset-2"
                        >
                            Skip this step
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Welcome;
