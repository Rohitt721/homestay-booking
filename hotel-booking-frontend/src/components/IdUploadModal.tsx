import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "react-query";
import * as apiClient from "../api-client";
import {
    Upload,
    X,
    ShieldCheck,
    AlertCircle,
    CheckCircle2,
    FileUp,
    CreditCard,
    UserCheck
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import useAppContext from "../hooks/useAppContext";

type Props = {
    bookingId: string;
    isOpen: boolean;
    onClose: () => void;
};

type FormValues = {
    idType: "Aadhaar" | "Passport" | "Driving License" | "Voter ID";
    frontImage: FileList;
    backImage?: FileList;
};

const IdUploadModal = ({ bookingId, isOpen, onClose }: Props) => {
    const { showToast } = useAppContext();
    const queryClient = useQueryClient();
    const [frontPreview, setFrontPreview] = useState<string | null>(null);
    const [backPreview, setBackPreview] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<FormValues>({
        defaultValues: {
            idType: "Aadhaar",
        }
    });

    const selectedIdType = watch("idType");

    const mutation = useMutation(
        (formData: FormData) => apiClient.uploadBookingId(bookingId, formData),
        {
            onSuccess: () => {
                showToast({
                    title: "ID Uploaded Successfully",
                    description: "Your ID has been submitted for verification.",
                    type: "SUCCESS",
                });
                queryClient.invalidateQueries("fetchMyBookings");
                onClose();
            },
            onError: (error: Error) => {
                showToast({
                    title: "Upload Failed",
                    description: error.message,
                    type: "ERROR",
                });
            },
        }
    );

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: "frontImage" | "backImage") => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                showToast({ title: "File too large", description: "Max size is 5MB", type: "ERROR" });
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                if (field === "frontImage") setFrontPreview(reader.result as string);
                else setBackPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const onSubmit = handleSubmit((data) => {
        const formData = new FormData();
        formData.append("idType", data.idType);
        if (data.frontImage?.[0]) {
            formData.append("frontImage", data.frontImage[0]);
        }
        if (data.backImage?.[0]) {
            formData.append("backImage", data.backImage[0]);
        }

        mutation.mutate(formData);
    });

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4 text-blue-600">
                        <UserCheck className="w-6 h-6" />
                    </div>
                    <DialogTitle className="text-2xl font-bold text-center">ID Verification Required</DialogTitle>
                    <DialogDescription className="text-center text-gray-500">
                        Please upload a valid government-issued ID to confirm your booking.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={onSubmit} className="space-y-6 mt-4">
                    <div className="space-y-2">
                        <Label className="text-sm font-semibold">Select ID Type</Label>
                        <Select
                            onValueChange={(value: any) => setValue("idType", value)}
                            defaultValue="Aadhaar"
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Choose ID Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Aadhaar">Aadhaar Card</SelectItem>
                                <SelectItem value="Passport">Passport</SelectItem>
                                <SelectItem value="Driving License">Driving License</SelectItem>
                                <SelectItem value="Voter ID">Voter ID</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Front Image */}
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold italic">Front Side</Label>
                            <div
                                className={`relative border-2 border-dashed rounded-xl p-4 transition-all ${frontPreview ? 'border-primary-500 bg-primary-50/10' : 'border-gray-200 hover:border-blue-400'
                                    }`}
                            >
                                {frontPreview ? (
                                    <div className="relative aspect-[3/2] w-full">
                                        <img src={frontPreview} className="w-full h-full object-cover rounded-lg shadow-sm" alt="Front Preview" />
                                        <button
                                            type="button"
                                            onClick={() => setFrontPreview(null)}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center justify-center aspect-[3/2] cursor-pointer">
                                        <FileUp className="w-8 h-8 text-gray-400 mb-2" />
                                        <span className="text-xs text-gray-500 text-center px-4">Upload Front Image</span>
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*,.pdf"
                                            {...register("frontImage", {
                                                required: "Front image is required",
                                                onChange: (e) => handleFileChange(e, "frontImage")
                                            })}
                                        />
                                    </label>
                                )}
                            </div>
                            {errors.frontImage && <p className="text-xs text-red-500 mt-1">{errors.frontImage.message}</p>}
                        </div>

                        {/* Back Image (Optional for some) */}
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold italic">Back Side (Optional)</Label>
                            <div
                                className={`relative border-2 border-dashed rounded-xl p-4 transition-all ${backPreview ? 'border-primary-500 bg-primary-50/10' : 'border-gray-200 hover:border-blue-400'
                                    }`}
                            >
                                {backPreview ? (
                                    <div className="relative aspect-[3/2] w-full">
                                        <img src={backPreview} className="w-full h-full object-cover rounded-lg shadow-sm" alt="Back Preview" />
                                        <button
                                            type="button"
                                            onClick={() => setBackPreview(null)}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center justify-center aspect-[3/2] cursor-pointer">
                                        <FileUp className="w-8 h-8 text-gray-400 mb-2" />
                                        <span className="text-xs text-gray-500 text-center px-4">Upload Back Image</span>
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*,.pdf"
                                            {...register("backImage", {
                                                onChange: (e) => handleFileChange(e, "backImage")
                                            })}
                                        />
                                    </label>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Privacy Disclaimer */}
                    <div className="bg-amber-50 rounded-lg p-3 flex gap-3 border border-amber-100">
                        <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
                        <p className="text-[10px] text-amber-800 leading-tight">
                            Privacy Disclaimer: Your ID proof is strictly used for stay verification by the hotel owner. It will be automatically deleted 7 days after your checkout in compliance with data security laws.
                        </p>
                    </div>

                    <DialogFooter className="flex flex-col sm:flex-row gap-2">
                        <Button type="button" variant="ghost" onClick={onClose} disabled={mutation.isLoading}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700 text-white flex-1 font-bold"
                            disabled={mutation.isLoading}
                        >
                            {mutation.isLoading ? (
                                <>
                                    <Upload className="w-4 h-4 mr-2 animate-bounce" />
                                    Uploading...
                                </>
                            ) : (
                                "Submit ID Proof"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default IdUploadModal;
