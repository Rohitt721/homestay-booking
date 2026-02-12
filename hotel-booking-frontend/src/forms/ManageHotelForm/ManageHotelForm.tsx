import { FormProvider, useForm } from "react-hook-form";
import DetailsSection from "./DetailsSection";
import TypeSection from "./TypeSection";
import FacilitiesSection from "./FacilitiesSection";
import GuestsSection from "./GuestsSection";
import ImagesSection from "./ImagesSection";
import ContactSection from "./ContactSection";
import PoliciesSection from "./PoliciesSection";
import { HotelType } from "../../../../shared/types";
import { useEffect, useState } from "react";
import { Save, Loader2, ChevronLeft, ChevronRight, Check, Building2, MapPin, Bed, Users, Phone, FileText, Image } from "lucide-react";

export type HotelFormData = {
  name: string;
  city: string;
  country: string;
  description: string;
  type: string[];
  pricePerNight: number;
  pricePerHour: number;

  facilities: string[];
  imageFiles?: FileList;
  imageUrls: string[];
  adultCount: number;
  childCount: number;
  contact?: {
    phone: string;
    email: string;
    website: string;
  };
  policies?: {
    checkInTime: string;
    checkOutTime: string;
    checkInHour?: number;
    checkOutHour?: number;
    cancellationPolicy: string;
    petPolicy: string;
    smokingPolicy: string;
  };
  location: {
    type: string;
    coordinates: [number, number];
    address: {
      street: string;
      city: string;
      state: string;
      country: string;
      zipCode: string;
    };
  };
  isFeatured: boolean;
};

type Props = {
  hotel?: HotelType;
  onSave: (hotelFormData: FormData) => void;
  isLoading: boolean;
};

const STEPS = [
  { id: 1, title: "Basic Info", icon: Building2, description: "Property name & location" },
  { id: 2, title: "Property Type", icon: MapPin, description: "Category of your property" },
  { id: 3, title: "Amenities", icon: Bed, description: "Facilities you offer" },
  { id: 4, title: "Capacity", icon: Users, description: "Guest capacity" },
  { id: 5, title: "Contact", icon: Phone, description: "Contact information" },
  { id: 6, title: "Policies", icon: FileText, description: "House rules" },
  { id: 7, title: "Photos", icon: Image, description: "Property images" },
];

const ManageHotelForm = ({ onSave, isLoading, hotel }: Props) => {
  const [currentStep, setCurrentStep] = useState(1);
  const formMethods = useForm<HotelFormData>();
  const { handleSubmit, reset, trigger } = formMethods;

  useEffect(() => {
    if (hotel) {
      const formData: any = {
        ...hotel,
        pricePerHour: hotel.pricePerHour || 0,
        contact: hotel.contact || { phone: "", email: "", website: "" },
        policies: hotel.policies || {
          checkInTime: "", checkOutTime: "", checkInHour: undefined,
          checkOutHour: undefined, cancellationPolicy: "", petPolicy: "", smokingPolicy: "",
        },
      };

      if (hotel.location) {
        formData.location = {
          type: "Point",
          coordinates: hotel.location.coordinates || [0, 0],
          address: hotel.location.address || {
            street: "", city: hotel.city, state: "", country: hotel.country, zipCode: ""
          }
        }
      }
      reset(formData);
    }
  }, [hotel, reset]);

  const onSubmit = handleSubmit((formDataJson: HotelFormData) => {
    const formData = new FormData();
    if (hotel) formData.append("hotelId", hotel._id);
    formData.append("name", formDataJson.name);
    formData.append("city", formDataJson.location?.address?.city || formDataJson.city);
    formData.append("country", formDataJson.location?.address?.country || formDataJson.country);
    formData.append("description", formDataJson.description);

    formDataJson.type?.forEach((t, idx) => formData.append(`type[${idx}]`, t));
    formData.append("pricePerNight", formDataJson.pricePerNight?.toString() || "0");
    formData.append("pricePerHour", formDataJson.pricePerHour?.toString() || "0");

    formData.append("adultCount", formDataJson.adultCount?.toString() || "1");
    formData.append("childCount", formDataJson.childCount?.toString() || "0");

    formDataJson.facilities?.forEach((facility, index) => formData.append(`facilities[${index}]`, facility));

    if (formDataJson.contact) {
      formData.append("contact.phone", formDataJson.contact.phone || "");
      formData.append("contact.email", formDataJson.contact.email || "");
      formData.append("contact.website", formDataJson.contact.website || "");
    }

    if (formDataJson.policies) {
      formData.append("policies.checkInTime", formDataJson.policies.checkInTime || "");
      formData.append("policies.checkOutTime", formDataJson.policies.checkOutTime || "");
      formData.append("policies.cancellationPolicy", formDataJson.policies.cancellationPolicy || "");
      formData.append("policies.petPolicy", formDataJson.policies.petPolicy || "");
      formData.append("policies.smokingPolicy", formDataJson.policies.smokingPolicy || "");
    }

    if (formDataJson.location) {
      formData.append("location.longitude", (formDataJson.location.coordinates?.[0] || 0) as any);
      formData.append("location.latitude", (formDataJson.location.coordinates?.[1] || 0) as any);
      formData.append("location.address.street", formDataJson.location.address?.street || "");
      formData.append("location.address.city", formDataJson.location.address?.city || "");
      formData.append("location.address.state", formDataJson.location.address?.state || "");
      formData.append("location.address.country", formDataJson.location.address?.country || "");
      formData.append("location.address.zipCode", formDataJson.location.address?.zipCode || "");
    }

    formDataJson.imageUrls?.forEach((url, index) => formData.append(`imageUrls[${index}]`, url));
    if (formDataJson.imageFiles && formDataJson.imageFiles.length > 0) {
      Array.from(formDataJson.imageFiles).forEach((imageFile) => formData.append(`imageFiles`, imageFile));
    }

    onSave(formData);
  });

  const handleNext = async () => {
    // Optional: Add validation for each step here
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToStep = (step: number) => {
    setCurrentStep(step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1: return <DetailsSection />;
      case 2: return <TypeSection />;
      case 3: return <FacilitiesSection />;
      case 4: return <GuestsSection />;
      case 5: return <ContactSection />;
      case 6: return <PoliciesSection />;
      case 7: return <ImagesSection />;
      default: return <DetailsSection />;
    }
  };

  const progress = ((currentStep - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <FormProvider {...formMethods}>
          <form onSubmit={onSubmit}>
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">
                {hotel ? "Edit Property" : "List Your Property"}
              </h1>
              <p className="text-blue-200">Complete all steps to publish your listing</p>
            </div>

            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-blue-200">Step {currentStep} of {STEPS.length}</span>
                <span className="text-sm text-blue-200">{Math.round(progress)}% Complete</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Step Indicators */}
            <div className="hidden md:flex items-center justify-between mb-8 px-4">
              {STEPS.map((step, index) => {
                const Icon = step.icon;
                const isCompleted = currentStep > step.id;
                const isCurrent = currentStep === step.id;

                return (
                  <div key={step.id} className="flex flex-col items-center relative group">
                    {/* Connector Line */}
                    {index > 0 && (
                      <div
                        className={`absolute right-1/2 top-5 w-full h-0.5 -translate-x-1/2 transition-colors duration-300 ${isCompleted ? 'bg-green-500' : 'bg-white/20'
                          }`}
                        style={{ width: 'calc(100% + 40px)', right: 'calc(50% + 20px)' }}
                      />
                    )}

                    {/* Step Circle */}
                    <button
                      type="button"
                      onClick={() => goToStep(step.id)}
                      className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${isCompleted
                        ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                        : isCurrent
                          ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30 ring-4 ring-blue-500/20'
                          : 'bg-white/10 text-white/50 hover:bg-white/20'
                        }`}
                    >
                      {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                    </button>

                    {/* Step Label */}
                    <div className="mt-2 text-center">
                      <p className={`text-xs font-medium transition-colors ${isCurrent ? 'text-white' : 'text-white/50'
                        }`}>
                        {step.title}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mobile Step Indicator */}
            <div className="md:hidden mb-6">
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-4">
                {(() => {
                  const CurrentIcon = STEPS[currentStep - 1].icon;
                  return <CurrentIcon className="w-6 h-6 text-blue-400" />;
                })()}
                <div>
                  <p className="text-white font-medium">{STEPS[currentStep - 1].title}</p>
                  <p className="text-blue-200 text-sm">{STEPS[currentStep - 1].description}</p>
                </div>
              </div>
            </div>

            {/* Current Step Content */}
            <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 min-h-[400px]">
              {renderStep()}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-6 gap-4">
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentStep === 1}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${currentStep === 1
                  ? 'bg-white/5 text-white/30 cursor-not-allowed'
                  : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
              >
                <ChevronLeft className="w-5 h-5" />
                Previous
              </button>

              <div className="flex gap-2">
                {STEPS.map((step) => (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => goToStep(step.id)}
                    className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${currentStep === step.id
                      ? 'bg-white w-8'
                      : currentStep > step.id
                        ? 'bg-green-500'
                        : 'bg-white/30'
                      }`}
                  />
                ))}
              </div>

              {currentStep < STEPS.length ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-medium hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Next
                  <ChevronRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-medium hover:from-green-600 hover:to-emerald-600 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Publish Property
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  );
};

export default ManageHotelForm;
