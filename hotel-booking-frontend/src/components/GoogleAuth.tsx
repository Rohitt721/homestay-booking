import { GoogleLogin } from "@react-oauth/google";
import * as apiClient from "../api-client";
import useAppContext from "../hooks/useAppContext";
import { useNavigate, useLocation } from "react-router-dom";
import { useQueryClient } from "react-query";
import { useState } from "react";

const GoogleAuth = () => {
    const { showToast } = useAppContext();
    const navigate = useNavigate();
    const location = useLocation();
    const queryClient = useQueryClient();
    const [isLoading, setIsLoading] = useState(false);

    const handleSuccess = async (credentialResponse: any) => {
        setIsLoading(true);
        try {
            if (credentialResponse.credential) {
                const data = await apiClient.googleSignIn(credentialResponse.credential);

                await queryClient.invalidateQueries("validateToken");

                // If this is a new user, redirect to onboarding
                if (data.isNewUser) {
                    showToast({
                        title: "Account Created!",
                        description: "Let's set up your profile.",
                        type: "SUCCESS",
                    });
                    navigate("/welcome");
                } else {
                    showToast({
                        title: "Login Successful",
                        description: "Welcome back! You have been successfully signed in.",
                        type: "SUCCESS",
                    });
                    navigate(location.state?.from?.pathname || "/");
                }
            }
        } catch (error: any) {
            showToast({
                title: "Login Failed",
                description: error.message || "Google login failed. Please try again.",
                type: "ERROR",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleError = () => {
        showToast({
            title: "Login Failed",
            description: "Google login failed. Please try again.",
            type: "ERROR",
        });
    };

    return (
        <div className="flex flex-col items-center justify-center w-full space-y-4">
            <div className="w-full flex justify-center auth-google-button">
                <GoogleLogin
                    onSuccess={handleSuccess}
                    onError={handleError}
                    useOneTap
                    theme="outline"
                    shape="rectangular"
                    width="100%"
                    text="continue_with"
                />
            </div>
            {isLoading && (
                <p className="text-sm text-gray-500 animate-pulse">
                    Authenticating with Google...
                </p>
            )}
        </div>
    );
};

export default GoogleAuth;
