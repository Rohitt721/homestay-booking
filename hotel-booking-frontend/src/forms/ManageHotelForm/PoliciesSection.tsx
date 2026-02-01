import { useFormContext } from "react-hook-form";
import { HotelFormData } from "./ManageHotelForm";
import { useState } from "react";

const PoliciesSection = () => {
  const { register } = useFormContext<HotelFormData>();
  const [enableTimeRange, setEnableTimeRange] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-2xl font-bold">Hotel Policies</h2>
      <div className="flex items-center gap-2 mb-2">
        <input
          type="checkbox"
          id="enableTimeRange"
          checked={enableTimeRange}
          onChange={(e) => setEnableTimeRange(e.target.checked)}
          className="w-4 h-4"
        />
        <label htmlFor="enableTimeRange" className="text-sm font-medium text-gray-700">
          Enable custom check-in/check-out hours (1–6)
        </label>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="text-gray-700 text-sm font-bold flex-1">
          Check-in Time
          <input
            type="text"
            placeholder="e.g., 3:00 PM"
            className="border rounded w-full py-2 px-3 font-normal"
            {...register("policies.checkInTime")}
          />
        </label>
        <label className="text-gray-700 text-sm font-bold flex-1">
          Check-out Time
          <input
            type="text"
            placeholder="e.g., 11:00 AM"
            className="border rounded w-full py-2 px-3 font-normal"
            {...register("policies.checkOutTime")}
          />
        </label>
        <label className="text-gray-700 text-sm font-bold flex-1">
          Check-in Hour (optional)
          <select
            className={`border rounded w-full py-2 px-3 font-normal ${
              enableTimeRange ? "" : "opacity-50 cursor-not-allowed"
            }`}
            {...register("policies.checkInHour")}
            defaultValue="3"
            disabled={!enableTimeRange}
          >
            {[1, 2, 3, 4, 5, 6].map((hour) => (
              <option key={hour} value={hour}>
                {hour}
              </option>
            ))}
          </select>
        </label>
        <label className="text-gray-700 text-sm font-bold flex-1">
          Check-out Hour (optional)
          <select
            className={`border rounded w-full py-2 px-3 font-normal ${
              enableTimeRange ? "" : "opacity-50 cursor-not-allowed"
            }`}
            {...register("policies.checkOutHour")}
            defaultValue="1"
            disabled={!enableTimeRange}
          >
            {[1, 2, 3, 4, 5, 6].map((hour) => (
              <option key={hour} value={hour}>
                {hour}
              </option>
            ))}
          </select>
        </label>
        <label className="text-gray-700 text-sm font-bold flex-1">
          Cancellation Policy
          <textarea
            placeholder="Describe your cancellation policy..."
            className="border rounded w-full py-2 px-3 font-normal"
            rows={3}
            {...register("policies.cancellationPolicy")}
          />
        </label>
        <label className="text-gray-700 text-sm font-bold flex-1">
          Pet Policy
          <textarea
            placeholder="Describe your pet policy..."
            className="border rounded w-full py-2 px-3 font-normal"
            rows={3}
            {...register("policies.petPolicy")}
          />
        </label>
        <label className="text-gray-700 text-sm font-bold flex-1">
          Smoking Policy
          <textarea
            placeholder="Describe your smoking policy..."
            className="border rounded w-full py-2 px-3 font-normal"
            rows={3}
            {...register("policies.smokingPolicy")}
          />
        </label>
      </div>
    </div>
  );
};

export default PoliciesSection;
