import { useForm } from "react-hook-form";
import { useQueryClient } from "react-query";
import { useMutationWithLoading } from "../hooks/useLoadingHooks";
import * as apiClient from "../api-client";
import useAppContext from "../hooks/useAppContext";
import { useNavigate, Link } from "react-router-dom";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  UserPlus,
  Sparkles,
  CheckCircle,
  Building,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Label } from "../components/ui/label";
import { Separator } from "../components/ui/separator";
import { Badge } from "../components/ui/badge";
import GoogleAuth from "../components/GoogleAuth";

export type RegisterFormData = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: "user" | "hotel_owner";
};

const RESEND_COOLDOWN = 60; // seconds

const Register = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { showToast } = useAppContext();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Multi-step state
  const [currentStep, setCurrentStep] = useState(1);
  const [otpToken, setOtpToken] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [countdown, setCountdown] = useState(0);
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpError, setOtpError] = useState("");
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const {
    register,
    watch,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<RegisterFormData>();

  const mutation = useMutationWithLoading(apiClient.register, {
    onSuccess: async () => {
      showToast({
        title: "Registration Successful",
        description: "Your account has been created successfully! Welcome to HomeStay.",
        type: "SUCCESS",
      });
      await queryClient.invalidateQueries("validateToken");
      setCurrentStep(3); // Show success step
      setTimeout(() => navigate("/"), 2000);
    },
    onError: (error: Error) => {
      showToast({
        title: "Registration Failed",
        description: error.message,
        type: "ERROR",
      });
    },
    loadingMessage: "Creating your account...",
  });

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // Auto-focus first OTP input when step 2 is shown
  useEffect(() => {
    if (currentStep === 2) {
      setTimeout(() => otpInputRefs.current[0]?.focus(), 300);
    }
  }, [currentStep]);

  const maskEmail = (email: string) => {
    const [local, domain] = email.split("@");
    if (local.length <= 2) return `${local[0]}***@${domain}`;
    return `${local[0]}${local[1]}***${local[local.length - 1]}@${domain}`;
  };

  // ── Send OTP ─────────────────────────────────────────────────────────
  const handleSendOTP = useCallback(async () => {
    const email = getValues("email");
    if (!email) return;

    setOtpSending(true);
    setOtpError("");
    try {
      await apiClient.sendOTP(email);
      setCountdown(RESEND_COOLDOWN);
      setCurrentStep(2);
      showToast({
        title: "OTP Sent",
        description: `Verification code sent to ${maskEmail(email)}`,
        type: "SUCCESS",
      });
    } catch (error: any) {
      const msg = error?.response?.data?.message || "Failed to send OTP";
      setOtpError(msg);
      showToast({ title: "Error", description: msg, type: "ERROR" });
    } finally {
      setOtpSending(false);
    }
  }, [getValues, showToast]);

  // ── OTP Input Handling ─────────────────────────────────────────────
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // digits only

    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1); // only last char
    setOtpDigits(newDigits);
    setOtpError("");

    // Auto-advance to next input
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits are entered
    if (value && index === 5 && newDigits.every((d) => d !== "")) {
      handleVerifyOTP(newDigits.join(""));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasteData.length === 6) {
      const newDigits = pasteData.split("");
      setOtpDigits(newDigits);
      otpInputRefs.current[5]?.focus();
      handleVerifyOTP(pasteData);
    }
  };

  // ── Verify OTP ──────────────────────────────────────────────────────
  const handleVerifyOTP = async (otp: string) => {
    const email = getValues("email");
    setOtpVerifying(true);
    setOtpError("");
    try {
      const data = await apiClient.verifyOTP(email, otp);
      setOtpToken(data.otpToken);
      showToast({
        title: "Email Verified",
        description: "Your email has been verified! Creating your account...",
        type: "SUCCESS",
      });
      // Auto-submit registration
      const formData = getValues();
      setIsLoading(true);
      mutation.mutate(
        { ...formData, otpToken: data.otpToken },
        { onSettled: () => setIsLoading(false) }
      );
    } catch (error: any) {
      const msg = error?.response?.data?.message || "Invalid OTP. Please try again.";
      setOtpError(msg);
      setOtpDigits(["", "", "", "", "", ""]);
      otpInputRefs.current[0]?.focus();
    } finally {
      setOtpVerifying(false);
    }
  };

  // ── Resend OTP ──────────────────────────────────────────────────────
  const handleResendOTP = async () => {
    if (countdown > 0) return;
    setOtpDigits(["", "", "", "", "", ""]);
    setOtpError("");
    await handleSendOTP();
  };

  // ── Step 1: Validate and send OTP ───────────────────────────────────
  const onStep1Submit = handleSubmit(async () => {
    await handleSendOTP();
  });

  const password = watch("password");
  const currentEmail = watch("email");

  // ── Step Indicator ──────────────────────────────────────────────────
  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-6">
      {[1, 2, 3].map((step) => (
        <div key={step} className="flex items-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 ${currentStep >= step
                ? "bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-200"
                : "bg-gray-100 text-gray-400"
              }`}
          >
            {currentStep > step ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              step
            )}
          </div>
          {step < 3 && (
            <div
              className={`w-12 h-0.5 mx-1 transition-all duration-500 ${currentStep > step ? "bg-primary-500" : "bg-gray-200"
                }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl w-full space-y-8">
        <Card className="relative overflow-hidden border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
          {/* Decorative Top Bar */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 to-primary-600"></div>
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary-100 rounded-full opacity-50"></div>
          <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-primary-200 rounded-full opacity-30"></div>

          {/* Header */}
          <CardHeader className="text-center relative z-10 pb-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
              {currentStep === 3 ? (
                <CheckCircle className="w-8 h-8 text-white" />
              ) : currentStep === 2 ? (
                <ShieldCheck className="w-8 h-8 text-white" />
              ) : (
                <UserPlus className="w-8 h-8 text-white" />
              )}
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
              {currentStep === 3
                ? "Welcome to HomeStay!"
                : currentStep === 2
                  ? "Verify Your Email"
                  : "Join HomeStay"}
            </CardTitle>
            <CardDescription className="text-gray-600">
              {currentStep === 3
                ? "Your account has been created successfully"
                : currentStep === 2
                  ? `Enter the code sent to ${maskEmail(currentEmail || "")}`
                  : "Create your account to start booking"}
            </CardDescription>
            <StepIndicator />
          </CardHeader>

          <CardContent className="space-y-6">
            {/* ═══ STEP 1: Registration Form ═══ */}
            {currentStep === 1 && (
              <form className="space-y-6" onSubmit={onStep1Submit}>
                {/* Name Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-sm font-semibold text-gray-700">
                      First Name
                    </Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                        <User className="h-6 w-6 text-gray-600" />
                      </div>
                      <Input
                        id="firstName"
                        type="text"
                        className="pl-10 pr-3 py-3 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm"
                        placeholder="Enter first name"
                        {...register("firstName", { required: "First name is required" })}
                      />
                    </div>
                    {errors.firstName && (
                      <div className="flex items-center mt-1">
                        <Badge variant="outline" className="text-red-500 border-red-200 bg-red-50">
                          <Sparkles className="w-4 h-4 mr-1" />
                          {errors.firstName.message}
                        </Badge>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-sm font-semibold text-gray-700">
                      Last Name
                    </Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                        <User className="h-6 w-6 text-gray-600" />
                      </div>
                      <Input
                        id="lastName"
                        type="text"
                        className="pl-10 pr-3 py-3 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm"
                        placeholder="Enter last name"
                        {...register("lastName", { required: "Last name is required" })}
                      />
                    </div>
                    {errors.lastName && (
                      <div className="flex items-center mt-1">
                        <Badge variant="outline" className="text-red-500 border-red-200 bg-red-50">
                          <Sparkles className="w-4 h-4 mr-1" />
                          {errors.lastName.message}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>

                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                    Email Address
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                      <Mail className="h-6 w-6 text-gray-600" />
                    </div>
                    <Input
                      id="email"
                      type="email"
                      className="pl-10 pr-3 py-3 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm"
                      placeholder="Enter your email"
                      {...register("email", { required: "Email is required" })}
                    />
                  </div>
                  {errors.email && (
                    <div className="flex items-center mt-1">
                      <Badge variant="outline" className="text-red-500 border-red-200 bg-red-50">
                        <Sparkles className="w-4 h-4 mr-1" />
                        {errors.email.message}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                    Password
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                      <Lock className="h-6 w-6 text-gray-600" />
                    </div>
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      className="pl-10 pr-12 py-3 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm"
                      placeholder="Create a password"
                      {...register("password", {
                        required: "Password is required",
                        minLength: { value: 6, message: "Password must be at least 6 characters" },
                      })}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute inset-y-0 right-0 pr-3 h-full"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      )}
                    </Button>
                  </div>
                  {errors.password && (
                    <div className="flex items-center mt-1">
                      <Badge variant="outline" className="text-red-500 border-red-200 bg-red-50">
                        <Sparkles className="w-4 h-4 mr-1" />
                        {errors.password.message}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Confirm Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-700">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                      <Lock className="h-6 w-6 text-gray-600" />
                    </div>
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      className="pl-10 pr-12 py-3 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm"
                      placeholder="Confirm your password"
                      {...register("confirmPassword", {
                        validate: (val) => {
                          if (!val) return "Please confirm your password";
                          if (password !== val) return "Passwords do not match";
                        },
                      })}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute inset-y-0 right-0 pr-3 h-full"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      )}
                    </Button>
                  </div>
                  {errors.confirmPassword && (
                    <div className="flex items-center mt-1">
                      <Badge variant="outline" className="text-red-500 border-red-200 bg-red-50">
                        <Sparkles className="w-4 h-4 mr-1" />
                        {errors.confirmPassword.message}
                      </Badge>
                    </div>
                  )}
                  {password && !errors.confirmPassword && watch("confirmPassword") === password && (
                    <div className="flex items-center mt-1">
                      <Badge variant="outline" className="text-green-500 border-green-200 bg-green-50">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Passwords match
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Role Selection */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">Account Type</Label>
                  <div className="grid grid-cols-1 gap-3">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        value="user"
                        {...register("role")}
                        defaultChecked
                        className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                      />
                      <div className="flex items-center space-x-2">
                        <User className="w-5 h-5 text-gray-600" />
                        <span className="text-sm font-medium text-gray-900">Guest (User)</span>
                      </div>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        value="hotel_owner"
                        {...register("role")}
                        className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                      />
                      <div className="flex items-center space-x-2">
                        <Building className="w-5 h-5 text-gray-600" />
                        <span className="text-sm font-medium text-gray-900">Hotel Owner</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Submit (Send OTP) */}
                <Button
                  type="submit"
                  disabled={otpSending}
                  className="w-full py-3 px-4 rounded-md text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {otpSending ? (
                    <div className="flex items-center">
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Sending verification code...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <ArrowRight className="w-5 h-5 mr-2" />
                      Continue & Verify Email
                    </div>
                  )}
                </Button>

                {/* Divider */}
                <div className="relative my-6">
                  <Separator className="bg-gray-300" />
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">or</span>
                  </div>
                </div>

                {/* Google Social Login */}
                <div className="space-y-4">
                  <GoogleAuth />
                </div>

                {/* Sign In Link */}
                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    Already have an account?{" "}
                    <Link
                      to="/sign-in"
                      className="font-semibold text-primary-600 hover:text-primary-700 transition-colors duration-200 underline decoration-2 underline-offset-2"
                    >
                      Sign in here
                    </Link>
                  </p>
                </div>
              </form>
            )}

            {/* ═══ STEP 2: OTP Verification ═══ */}
            {currentStep === 2 && (
              <div className="space-y-8">
                {/* Email Display */}
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-700 px-4 py-2 rounded-full text-sm font-medium">
                    <Mail className="w-4 h-4" />
                    {maskEmail(currentEmail || "")}
                  </div>
                </div>

                {/* OTP Input */}
                <div className="flex justify-center gap-3" onPaste={handleOtpPaste}>
                  {otpDigits.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => { otpInputRefs.current[index] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className={`w-12 h-14 text-center text-xl font-bold rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${otpError
                          ? "border-red-300 bg-red-50 text-red-600"
                          : digit
                            ? "border-primary-300 bg-primary-50 text-primary-700"
                            : "border-gray-200 bg-gray-50 text-gray-900"
                        }`}
                    />
                  ))}
                </div>

                {/* OTP Error */}
                {otpError && (
                  <div className="text-center">
                    <Badge variant="outline" className="text-red-500 border-red-200 bg-red-50">
                      <Sparkles className="w-4 h-4 mr-1" />
                      {otpError}
                    </Badge>
                  </div>
                )}

                {/* Verifying Indicator */}
                {otpVerifying && (
                  <div className="flex items-center justify-center gap-2 text-primary-600">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm font-medium">Verifying...</span>
                  </div>
                )}

                {/* Countdown / Resend */}
                <div className="text-center space-y-3">
                  {countdown > 0 ? (
                    <p className="text-sm text-gray-500">
                      Resend code in{" "}
                      <span className="font-bold text-primary-600">{countdown}s</span>
                    </p>
                  ) : (
                    <button
                      onClick={handleResendOTP}
                      disabled={otpSending}
                      className="text-sm font-semibold text-primary-600 hover:text-primary-700 underline underline-offset-2 disabled:opacity-50"
                    >
                      {otpSending ? "Sending..." : "Resend verification code"}
                    </button>
                  )}
                </div>

                {/* Back Button */}
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-gray-500 hover:text-gray-700"
                  onClick={() => {
                    setCurrentStep(1);
                    setOtpDigits(["", "", "", "", "", ""]);
                    setOtpError("");
                  }}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to registration
                </Button>
              </div>
            )}

            {/* ═══ STEP 3: Success ═══ */}
            {currentStep === 3 && (
              <div className="text-center py-8 space-y-6">
                <div className="relative inline-block">
                  <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-200 animate-bounce">
                    <CheckCircle className="w-10 h-10 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Account Created!</h3>
                  <p className="text-gray-500 text-sm">
                    Redirecting you to the homepage...
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 text-primary-600">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Redirecting...</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Terms */}
        {currentStep === 1 && (
          <div className="text-center">
            <p className="text-xs text-gray-500">
              By creating an account, you agree to our{" "}
              <a href="#" className="text-primary-600 hover:underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="text-primary-600 hover:underline">
                Privacy Policy
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Register;
