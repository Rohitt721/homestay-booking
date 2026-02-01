import { useMutation, useQuery } from "react-query";
import * as apiClient from "../api-client";
import useAppContext from "../hooks/useAppContext";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { useNavigate } from "react-router-dom";
import { Check, Shield, Zap, Star, Loader2, Calendar } from "lucide-react";

const Subscription = () => {
    const { showToast } = useAppContext();
    const navigate = useNavigate();

    const { data: verificationStatus } = useQuery(
        "verificationStatus",
        apiClient.fetchVerificationStatus
    );

    const { data: subscription, isLoading: isLoadingStatus } = useQuery(
        "fetchSubscriptionStatus",
        apiClient.fetchSubscriptionStatus,
        { enabled: !!verificationStatus }
    );


    const { mutate: subscribe, isLoading: isSubscribing } = useMutation(
        apiClient.subscribeToPlan,
        {
            onSuccess: () => {
                showToast({
                    title: "Subscription Activated",
                    description: "Your unlimited publishing plan is now active!",
                    type: "SUCCESS",
                });
            },
            onError: () => {
                showToast({
                    title: "Payment Failed",
                    description: "Something went wrong during payment processing.",
                    type: "ERROR",
                });
            },
        }
    );

    const plans = [
        {
            id: "MONTHLY",
            name: "Monthly Plan",
            price: "₹499",
            period: "/month",
            features: [
                "Unlimted Hotel Publishing",
                "Business Insights Access",
                "Featured Hotel Options",
                "Premium Support",
            ],
            icon: Zap,
            color: "blue",
        },
        {
            id: "YEARLY",
            name: "Yearly Saver",
            price: "₹4,999",
            period: "/year",
            features: [
                "Unlimted Hotel Publishing",
                "Save 16% annually",
                "Priority Search Placement",
                "Personal Account Manager",
                "Advanced Analytics",
            ],
            icon: Star,
            color: "indigo",
            popular: true,
        },
    ];

    if (isLoadingStatus) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
            </div>
        );
    }

    const isVerified = verificationStatus?.status === "VERIFIED";
    const status = verificationStatus?.status;


    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center mb-16">
                <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl mb-4">
                    Upgrade to <span className="text-blue-600 font-black">PREMIUM</span>
                </h1>
                <p className="text-xl text-gray-600">
                    Unlock unlimited hotel publishing and grow your hospitality business today.
                </p>

                {/* Verification Warning */}
                {!isVerified && (
                    <div className="mt-8 max-w-2xl mx-auto bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r shadow-sm text-left">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <Shield className="h-5 w-5 text-amber-500" />
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-amber-800">Verification Required</h3>
                                <div className="mt-2 text-sm text-amber-700">
                                    <p>
                                        You must complete the verification process before you can subscribe. Current Status: <span className="font-bold">{status || "PENDING"}</span>
                                    </p>
                                    <div className="mt-4">
                                        <Button
                                            variant="outline"
                                            className="text-amber-800 border-amber-800 hover:bg-amber-100"
                                            onClick={() => navigate("/verification")}
                                        >
                                            Complete Verification
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {subscription && (
                    <div className="mt-8 inline-flex items-center gap-2 px-6 py-2 bg-green-100 text-green-800 rounded-full font-semibold border border-green-200">
                        <Shield className="h-5 w-5" />
                        Active Subscription: Valid till {new Date(subscription.endDate).toLocaleDateString()}
                    </div>
                )}
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                {plans.map((plan) => (
                    <Card
                        key={plan.id}
                        className={`relative overflow-hidden border-2 transition-all duration-300 hover:shadow-2xl ${plan.popular ? "border-blue-600 scale-105 z-10" : "border-white"
                            }`}
                    >
                        {plan.popular && (
                            <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg transform uppercase tracking-widest">
                                Most Popular
                            </div>
                        )}
                        <CardHeader className="text-center pt-8">
                            <div className={`mx-auto w-12 h-12 bg-${plan.color}-100 rounded-xl flex items-center justify-center mb-4`}>
                                <plan.icon className={`h-6 w-6 text-${plan.color}-600`} />
                            </div>
                            <CardTitle className="text-2xl font-bold text-gray-900">{plan.name}</CardTitle>
                            <div className="mt-4 flex items-baseline justify-center">
                                <span className="text-5xl font-extrabold tracking-tight text-gray-900">{plan.price}</span>
                                <span className="ml-1 text-xl font-medium text-gray-500">{plan.period}</span>
                            </div>
                        </CardHeader>
                        <CardContent className="px-8 pb-8">
                            <ul className="space-y-4">
                                {plan.features.map((feature, index) => (
                                    <li key={index} className="flex items-start gap-3">
                                        <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                                        <span className="text-gray-600 text-sm font-medium">{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                        <CardFooter className="px-8 pb-8">
                            <Button
                                disabled={isSubscribing || (subscription?.plan === plan.id && subscription.status === "ACTIVE") || !isVerified}
                                onClick={() => isVerified ? subscribe(plan.id as "MONTHLY" | "YEARLY") : navigate("/verification")}
                                className={`w-full py-6 text-lg font-bold rounded-xl transition-all active:scale-95 ${plan.popular
                                    ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
                                    : "bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50"
                                    } ${!isVerified && "opacity-75 cursor-not-allowed"}`}
                            >
                                {isSubscribing ? (
                                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                ) : !isVerified ? (
                                    "Verify to Subscribe"
                                ) : subscription?.plan === plan.id && subscription.status === "ACTIVE" ? (
                                    "Currently Active"
                                ) : (
                                    `Subscribe ${plan.id === "MONTHLY" ? "Now" : "Yearly"}`
                                )}
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>

            <div className="mt-20 text-center text-gray-500">
                <div className="flex items-center justify-center gap-8 opacity-60">
                    <div className="flex flex-col items-center">
                        <Lock className="h-8 w-8 mb-2" />
                        <span className="text-xs uppercase font-bold tracking-widest">Secure Payment</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <Shield className="h-8 w-8 mb-2" />
                        <span className="text-xs uppercase font-bold tracking-widest">Money Back</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <Calendar className="h-8 w-8 mb-2" />
                        <span className="text-xs uppercase font-bold tracking-widest">Cancel Anytime</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Helper for Secure payment icon
const Lock = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
);

export default Subscription;
