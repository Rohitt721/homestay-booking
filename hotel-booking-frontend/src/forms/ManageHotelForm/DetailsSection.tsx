import { useFormContext } from "react-hook-form";
import { HotelFormData } from "./ManageHotelForm";
import LocationPicker, { AddressData } from "../../components/LocationPicker";
import { MapPin, Building2, DollarSign } from "lucide-react";

const DetailsSection = () => {
  const {
    register,
    formState: { errors },
    watch,
    setValue,
  } = useFormContext<HotelFormData>();

  const lat = watch("location.coordinates.1");
  const lon = watch("location.coordinates.0");

  const handleLocationSelect = (lat: number, lon: number, address?: AddressData) => {
    setValue("location.coordinates.1", lat);
    setValue("location.coordinates.0", lon);

    if (address) {
      if (address.street) setValue("location.address.street", address.street);
      if (address.city) setValue("location.address.city", address.city);
      if (address.state) setValue("location.address.state", address.state);
      if (address.country) setValue("location.address.country", address.country);
      if (address.zipCode) setValue("location.address.zipCode", address.zipCode);
    }
  };

  return (
    <div className="space-y-8">
      {/* Property Name & Description */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-800">Property Details</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Property Name *
            </label>
            <input
              type="text"
              placeholder="e.g., Grand Luxury Resort & Spa"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-800"
              {...register("name", { required: "Property name is required" })}
            />
            {errors.name && (
              <span className="text-red-500 text-sm mt-1 block">{errors.name.message}</span>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              rows={4}
              placeholder="Describe your property's unique features, amenities, and what makes it special..."
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-800 resize-none"
              {...register("description", { required: "Description is required" })}
            />
            {errors.description && (
              <span className="text-red-500 text-sm mt-1 block">{errors.description.message}</span>
            )}
          </div>
        </div>
      </div>

      {/* Location Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-5 h-5 text-green-600" />
          <h2 className="text-lg font-semibold text-gray-800">Location</h2>
        </div>

        {/* Map */}
        <div className="mb-6">
          <LocationPicker
            position={lat && lon ? [Number(lat), Number(lon)] : undefined}
            onLocationSelect={handleLocationSelect}
          />
        </div>

        {/* Address Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Street Address *
            </label>
            <input
              type="text"
              placeholder="Enter street address"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-800"
              {...register("location.address.street", { required: "Street address is required" })}
            />
            {errors.location?.address?.street && (
              <span className="text-red-500 text-sm mt-1 block">{errors.location.address.street.message}</span>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
            <input
              type="text"
              placeholder="City"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-800"
              {...register("location.address.city", { required: "City is required" })}
            />
            {errors.location?.address?.city && (
              <span className="text-red-500 text-sm mt-1 block">{errors.location.address.city.message}</span>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">State / Province *</label>
            <input
              type="text"
              placeholder="State"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-800"
              {...register("location.address.state", { required: "State is required" })}
            />
            {errors.location?.address?.state && (
              <span className="text-red-500 text-sm mt-1 block">{errors.location.address.state.message}</span>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Country *</label>
            <input
              type="text"
              placeholder="Country"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-800"
              {...register("location.address.country", { required: "Country is required" })}
            />
            {errors.location?.address?.country && (
              <span className="text-red-500 text-sm mt-1 block">{errors.location.address.country.message}</span>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ZIP / Postal Code *</label>
            <input
              type="text"
              placeholder="ZIP Code"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-800"
              {...register("location.address.zipCode", { required: "ZIP code is required" })}
            />
            {errors.location?.address?.zipCode && (
              <span className="text-red-500 text-sm mt-1 block">{errors.location.address.zipCode.message}</span>
            )}
          </div>
        </div>

        {/* Hidden Coordinates */}
        <input type="hidden" {...register("location.coordinates.1", { valueAsNumber: true })} />
        <input type="hidden" {...register("location.coordinates.0", { valueAsNumber: true })} />
      </div>

      {/* Pricing Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="w-5 h-5 text-emerald-600" />
          <h2 className="text-lg font-semibold text-gray-800">Pricing</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Price Per Night (₹) *</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
              <input
                type="number"
                min={1}
                placeholder="0"
                className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-800"
                {...register("pricePerNight", { required: "Price per night is required" })}
              />
            </div>
            {errors.pricePerNight && (
              <span className="text-red-500 text-sm mt-1 block">{errors.pricePerNight.message}</span>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Price Per Hour (₹)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
              <input
                type="number"
                min={0}
                placeholder="0 (optional)"
                className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-800"
                {...register("pricePerHour")}
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default DetailsSection;
