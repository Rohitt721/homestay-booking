import { useForm } from "react-hook-form";
import { UserType, HotelType } from "../../../../shared/types";
import useSearchContext from "../../hooks/useSearchContext";
import { useParams, useNavigate } from "react-router-dom";
import * as apiClient from "../../api-client";
import useAppContext from "../../hooks/useAppContext";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import {
  User,
  Phone,
  MessageSquare,
  CreditCard,
  Shield,
  CheckCircle,
  Loader2,
  Lock,
  Smartphone,
  Landmark,
  QrCode,
} from "lucide-react";
import { useState } from "react";

type Props = {
  currentUser: UserType;
  hotel: HotelType;
  numberOfNights: number;
};

export type BookingFormData = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  adultCount: number;
  childCount: number;
  checkIn: string;
  checkOut: string;
  hotelId: string;
  totalCost: number;
  specialRequests?: string;
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardName: string;
};

const BookingForm = ({ currentUser, hotel, numberOfNights }: Props) => {
  const search = useSearchContext();
  const { hotelId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useAppContext();

  const [phone, setPhone] = useState<string>("");
  const [specialRequests, setSpecialRequests] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "upi" | "netbanking">("card");

  const totalCost = hotel.pricePerNight * numberOfNights;

  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<BookingFormData>({
    defaultValues: {
      firstName: currentUser.firstName,
      lastName: currentUser.lastName,
      email: currentUser.email,
      adultCount: search.adultCount,
      childCount: search.childCount,
      checkIn: search.checkIn.toISOString(),
      checkOut: search.checkOut.toISOString(),
      hotelId: hotelId,
      totalCost: totalCost,
    },
  });

  const onSubmit = async (formData: BookingFormData) => {
    setIsProcessing(true);

    try {
      // Simulate a small "processing" delay for the dummy payment
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const completeFormData = {
        ...formData,
        phone,
        specialRequests,
        paymentIntentId: "dummy_payment_" + Date.now(), // Send a dummy ID to the backend
      };

      await apiClient.createRoomBooking(hotelId as string, completeFormData);

      showToast({
        title: "Booking Successful",
        description: "Your hotel booking has been confirmed successfully!",
        type: "SUCCESS",
      });

      setTimeout(() => {
        navigate("/my-bookings");
      }, 1500);
    } catch (error) {
      showToast({
        title: "Booking Failed",
        description: "There was an error processing your booking. Please try again.",
        type: "ERROR",
      });
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-6">
      <CardHeader className="pb-6">
        <CardTitle className="flex items-center gap-2 text-2xl font-bold text-gray-900">
          <User className="h-6 w-6 text-blue-600" />
          Confirm Your Details
        </CardTitle>
        <p className="text-gray-600 mt-2">
          Please review and complete your booking information
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              Personal Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">First Name</Label>
                <Input
                  type="text"
                  readOnly
                  disabled
                  className="bg-gray-50 text-gray-600"
                  {...register("firstName")}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Last Name</Label>
                <Input
                  type="text"
                  readOnly
                  disabled
                  className="bg-gray-50 text-gray-600"
                  {...register("lastName")}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Email</Label>
                <Input
                  type="email"
                  readOnly
                  disabled
                  className="bg-gray-50 text-gray-600"
                  {...register("email")}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone (Optional)
                </Label>
                <Input
                  type="tel"
                  placeholder="Enter your phone number"
                  className="focus:ring-2 focus:ring-blue-500"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-600" />
              Payment Method
            </h3>

            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod("card")}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${paymentMethod === "card"
                  ? "border-blue-600 bg-blue-50 text-blue-600"
                  : "border-gray-100 bg-white text-gray-500 hover:border-gray-200"
                  }`}
              >
                <CreditCard className="h-6 w-6 mb-2" />
                <span className="text-xs font-bold">Card</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("upi")}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${paymentMethod === "upi"
                  ? "border-blue-600 bg-blue-50 text-blue-600"
                  : "border-gray-100 bg-white text-gray-500 hover:border-gray-200"
                  }`}
              >
                <Smartphone className="h-6 w-6 mb-2" />
                <span className="text-xs font-bold">UPI</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("netbanking")}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${paymentMethod === "netbanking"
                  ? "border-blue-600 bg-blue-50 text-blue-600"
                  : "border-gray-100 bg-white text-gray-500 hover:border-gray-200"
                  }`}
              >
                <Landmark className="h-6 w-6 mb-2" />
                <span className="text-xs font-bold">Net Banking</span>
              </button>
            </div>

            {/* Dummy Payment Content based on method */}
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 min-h-[200px]">
              {paymentMethod === "card" && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <Lock className="h-4 w-4 text-green-600" />
                      Secure Credit/Debit Card
                    </span>
                    <div className="flex gap-2">
                      <div className="h-6 w-9 bg-white border rounded flex items-center justify-center text-[10px] font-bold text-blue-800 tracking-tighter">VISA</div>
                      <div className="h-6 w-9 bg-white border rounded flex items-center justify-center text-[10px] font-bold text-red-600 tracking-tighter">MC</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Card Number</Label>
                    <Input
                      type="text"
                      placeholder="4242 4242 4242 4242"
                      className="focus:ring-2 focus:ring-blue-500"
                      {...register("cardNumber")}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Expiry Date</Label>
                      <Input
                        type="text"
                        placeholder="MM/YY"
                        className="focus:ring-2 focus:ring-blue-500"
                        {...register("expiryDate")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">CVV</Label>
                      <Input
                        type="password"
                        placeholder="***"
                        className="focus:ring-2 focus:ring-blue-500"
                        {...register("cvv")}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Name on Card</Label>
                    <Input
                      type="text"
                      placeholder="John Doe"
                      className="focus:ring-2 focus:ring-blue-500"
                      {...register("cardName")}
                    />
                  </div>
                </div>
              )}

              {paymentMethod === "upi" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex flex-col items-center justify-center text-center p-4">
                    <div className="bg-white p-4 rounded-xl border shadow-sm mb-4">
                      <QrCode className="h-24 w-24 text-gray-800" />
                    </div>
                    <p className="text-xs text-gray-500 mb-6">Scan QR to pay or enter UPI ID below</p>

                    <div className="w-full space-y-2 text-left">
                      <Label className="text-sm font-medium text-gray-700">Enter UPI ID (VPA)</Label>
                      <div className="flex gap-2">
                        <Input
                          type="text"
                          placeholder="yourname@upi"
                          className="focus:ring-2 focus:ring-blue-500"
                        />
                        <Button type="button" variant="outline" className="text-xs whitespace-nowrap">Verify</Button>
                      </div>
                      <p className="text-[10px] text-gray-400">Example: username@okaxis, username@paytm</p>
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === "netbanking" && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <Label className="text-sm font-medium text-gray-700">Popular Banks</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {["HDFC Bank", "SBI", "ICICI Bank", "Axis Bank", "KOTAK Bank", "Yes Bank"].map((bank) => (
                      <div key={bank} className="flex items-center gap-3 p-3 bg-white border rounded-lg hover:border-blue-400 cursor-pointer transition-colors group">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          {bank[0]}
                        </div>
                        <span className="text-sm font-medium text-gray-600">{bank}</span>
                      </div>
                    ))}
                  </div>
                  <div className="pt-2">
                    <select className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option>--- Select Other Bank ---</option>
                      <option>Bank of Baroda</option>
                      <option>Canara Bank</option>
                      <option>Union Bank</option>
                    </select>
                  </div>
                </div>
              )}

              <p className="text-[10px] text-gray-400 mt-6 flex items-start gap-1">
                <Shield className="h-3 w-3 mt-0.5 text-blue-500 flex-shrink-0" />
                This is a secure dummy environment. No actual funds will be deducted from your account.
              </p>
            </div>
          </div>

          {/* Special Requests */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              Special Requests (Optional)
            </h3>
            <textarea
              rows={3}
              placeholder="Any special requests..."
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 resize-none"
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
            />
          </div>

          {/* Price Summary */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 rounded-xl text-white shadow-md">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-blue-100 text-sm">Total Amount to Pay</p>
                <h4 className="text-3xl font-bold">₹{totalCost.toFixed(2)}</h4>
              </div>
              <div className="text-right">
                <p className="text-blue-100 text-sm">{numberOfNights} Nights</p>
                <p className="text-xs text-blue-200">Instant confirmation</p>
              </div>
            </div>
          </div>

          {/* ID Verification Notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
            <Shield className="h-5 w-5 text-amber-600 mt-1 flex-shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-amber-900">ID Verification Required</p>
              <p className="text-xs text-amber-800 leading-relaxed">
                Booking confirmation is subject to government-approved ID verification by the hotel owner.
                After payment, you must upload your ID proof in the "My Bookings" section to confirm your stay.
                If the owner rejects your ID, a **full 100% refund** will be initiated automatically.
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            disabled={isProcessing}
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-70"
          >
            {isProcessing ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Processing Booking...
              </div>
            ) : (
              "Confirm & Book Room"
            )}
          </Button>
        </form>

        {/* Trust Indicators */}
        <div className="flex items-center justify-center gap-4 py-4 text-[10px] text-gray-400 uppercase tracking-widest font-bold">
          <div className="flex items-center gap-1">
            <Shield className="h-3 w-3" />
            SECURE
          </div>
          <div className="h-1 w-1 bg-gray-300 rounded-full" />
          <div className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            VERIFIED
          </div>
          <div className="h-1 w-1 bg-gray-300 rounded-full" />
          <div className="flex items-center gap-1">
            <Lock className="h-3 w-3" />
            ENCRYPTED
          </div>
        </div>
      </CardContent>
    </div >
  );
};

export default BookingForm;
