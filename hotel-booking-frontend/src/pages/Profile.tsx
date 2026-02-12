import { useMutation, useQuery, useQueryClient } from "react-query";
import { useForm } from "react-hook-form";
import * as apiClient from "../api-client";
import { UserType } from "../../../shared/types";
import { useState, useEffect } from "react";
import useAppContext from "../hooks/useAppContext";
import SignOutButton from "../components/SignOutButton";
import {
    User,
    Building2,
    ShieldCheck,
    Camera,
    MapPin,
    Phone,
    Mail,
    Briefcase,
    Settings,
    ShieldAlert,
    LogOut
} from "lucide-react";

export type ProfileFormData = {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
    // Owner specific
    companyName?: string;
    taxId?: string;
    businessAddress?: string;
};

const Profile = () => {
    const { showToast } = useAppContext();
    const queryClient = useQueryClient();
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    const { data: currentUser } = useQuery("fetchCurrentUser", apiClient.fetchCurrentUser);

    const { register, handleSubmit, reset, setValue } = useForm<ProfileFormData>();

    useEffect(() => {
        if (currentUser) {
            reset({
                firstName: currentUser.firstName,
                lastName: currentUser.lastName,
                email: currentUser.email,
                phone: currentUser.phone || "",
                street: currentUser.address?.street || "",
                city: currentUser.address?.city || "",
                state: currentUser.address?.state || "",
                country: currentUser.address?.country || "",
                zipCode: currentUser.address?.zipCode || "",
                companyName: currentUser.businessInfo?.companyName || "",
                taxId: currentUser.businessInfo?.taxId || "",
                businessAddress: currentUser.businessInfo?.businessAddress || "",
            });
            if (currentUser.profileImage) {
                setPreviewImage(currentUser.profileImage);
            }
        }
    }, [currentUser, reset]);

    const mutation = useMutation(apiClient.updateUserProfile, {
        onSuccess: () => {
            showToast({ title: "Success", description: "Profile updated successfully!", type: "SUCCESS" });
            queryClient.invalidateQueries("fetchCurrentUser");
        },
        onError: (error: Error) => {
            showToast({ title: "Error", description: error.message, type: "ERROR" });
        },
    });

    const onSubmit = handleSubmit((data) => {
        const formData = new FormData();
        formData.append("firstName", data.firstName);
        formData.append("lastName", data.lastName);
        formData.append("phone", data.phone);
        formData.append("street", data.street);
        formData.append("city", data.city);
        formData.append("state", data.state);
        formData.append("country", data.country);
        formData.append("zipCode", data.zipCode);

        if (currentUser?.role === "hotel_owner") {
            formData.append("companyName", data.companyName || "");
            formData.append("taxId", data.taxId || "");
            formData.append("businessAddress", data.businessAddress || "");
        }

        if (selectedImage) {
            formData.append("profileImage", selectedImage);
        }

        mutation.mutate(formData);
    });

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setSelectedImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    if (!currentUser) {
        return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
    }

    const isOwner = currentUser.role === "hotel_owner";
    const isAdmin = currentUser.role === "admin";

    return (
        <div className="bg-gray-50 min-h-screen py-10">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900">My Profile</h1>
                        <p className="text-gray-500 font-medium mt-1">Manage your account settings and preferences</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider
                            ${isOwner ? "bg-indigo-100 text-indigo-700" :
                                isAdmin ? "bg-purple-100 text-purple-700" :
                                    "bg-emerald-100 text-emerald-700"}`}>
                            {isOwner ? "Hotel Owner" : isAdmin ? "Administrator" : "Traveller"}
                        </span>
                        <SignOutButton />
                    </div>
                </div>

                <form onSubmit={onSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column - Profile Card */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 text-center">
                            <div className="relative inline-block mb-6 group">
                                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gray-100 mx-auto">
                                    {previewImage ? (
                                        <img src={previewImage} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                                            <User className="w-16 h-16" />
                                        </div>
                                    )}
                                </div>
                                <label className="absolute bottom-0 right-0 bg-gray-900 text-white p-2 rounded-full cursor-pointer hover:bg-gray-800 transition-colors shadow-md">
                                    <Camera className="w-4 h-4" />
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleImageChange}
                                    />
                                </label>
                            </div>

                            <h2 className="text-xl font-black text-gray-900">{currentUser.firstName} {currentUser.lastName}</h2>
                            <p className="text-sm text-gray-500 font-medium mb-6">{currentUser.email}</p>

                            <div className="space-y-3 text-left bg-gray-50 p-5 rounded-2xl">
                                {!isAdmin && (
                                    <div className="flex items-center gap-3 text-sm text-gray-600">
                                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                        <span className="font-bold">Status:</span>
                                        <span className="capitalize text-emerald-600">{currentUser.verification?.status || "Pending"}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <Briefcase className="w-4 h-4 text-indigo-500" />
                                    <span className="font-bold">Role:</span>
                                    <span className="capitalize">{currentUser.role?.replace("_", " ")}</span>
                                </div>
                            </div>
                        </div>

                        {/* Verification Status Card - Hidden for Admins */}
                        {!isAdmin && (
                            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
                                <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
                                    <ShieldAlert className="w-5 h-5 text-gray-400" />
                                    Verification
                                </h3>
                                {currentUser.verification?.status === "VERIFIED" ? (
                                    <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-center">
                                        <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                                        <p className="text-emerald-700 font-bold text-sm">Identity Verified</p>
                                        <p className="text-emerald-600/80 text-xs mt-1">You are fully verified to book authentic stays.</p>
                                    </div>
                                ) : (
                                    <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 text-center">
                                        <ShieldAlert className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                                        <p className="text-orange-700 font-bold text-sm">Not Verified</p>
                                        <a href="/verify-identity" className="text-indigo-600 text-xs font-black underline mt-2 block">Complete Verification</a>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Right Column - Form Fields */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Personal Information */}
                        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
                            <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
                                <User className="w-5 h-5 text-gray-400" />
                                Personal Details
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">First Name</label>
                                    <input
                                        type="text"
                                        className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 font-bold text-gray-900 focus:ring-2 focus:ring-indigo-500"
                                        {...register("firstName", { required: "First name is required" })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Last Name</label>
                                    <input
                                        type="text"
                                        className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 font-bold text-gray-900 focus:ring-2 focus:ring-indigo-500"
                                        {...register("lastName", { required: "Last name is required" })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Phone Number</label>
                                    <input
                                        type="tel"
                                        className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 font-bold text-gray-900 focus:ring-2 focus:ring-indigo-500"
                                        {...register("phone")}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Email Address</label>
                                    <input
                                        type="email"
                                        disabled
                                        className="w-full bg-gray-100 border-none rounded-xl px-4 py-3 font-bold text-gray-500 cursor-not-allowed"
                                        {...register("email")}
                                    />
                                    <p className="text-[10px] text-gray-400 pl-1">Email cannot be changed</p>
                                </div>
                            </div>
                        </div>

                        {/* Address Information */}
                        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
                            <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-gray-400" />
                                Address
                            </h3>
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Street Address</label>
                                    <input
                                        type="text"
                                        className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 font-bold text-gray-900 focus:ring-2 focus:ring-indigo-500"
                                        {...register("street")}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">City</label>
                                        <input
                                            type="text"
                                            className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 font-bold text-gray-900 focus:ring-2 focus:ring-indigo-500"
                                            {...register("city")}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">State</label>
                                        <input
                                            type="text"
                                            className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 font-bold text-gray-900 focus:ring-2 focus:ring-indigo-500"
                                            {...register("state")}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Country</label>
                                        <input
                                            type="text"
                                            className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 font-bold text-gray-900 focus:ring-2 focus:ring-indigo-500"
                                            {...register("country")}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Zip Code</label>
                                        <input
                                            type="text"
                                            className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 font-bold text-gray-900 focus:ring-2 focus:ring-indigo-500"
                                            {...register("zipCode")}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Owner Specific - Business Info */}
                        {isOwner && (
                            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
                                <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
                                    <Briefcase className="w-5 h-5 text-gray-400" />
                                    Business Information
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Company Name</label>
                                        <input
                                            type="text"
                                            className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 font-bold text-gray-900 focus:ring-2 focus:ring-indigo-500"
                                            {...register("companyName")}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Tax ID / GST</label>
                                        <input
                                            type="text"
                                            className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 font-bold text-gray-900 focus:ring-2 focus:ring-indigo-500"
                                            {...register("taxId")}
                                        />
                                    </div>
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Business Address</label>
                                        <input
                                            type="text"
                                            className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 font-bold text-gray-900 focus:ring-2 focus:ring-indigo-500"
                                            {...register("businessAddress")}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Save Button */}
                        <div className="flex justify-end pt-4">
                            <button
                                type="submit"
                                disabled={mutation.isLoading}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 px-10 rounded-2xl shadow-lg shadow-indigo-200 transition-all transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {mutation.isLoading ? "Saving..." : "Save Changes"}
                            </button>
                        </div>

                    </div>
                </form>
            </div>
        </div>
    );
};

export default Profile;
