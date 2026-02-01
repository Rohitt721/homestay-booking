import { Link, useNavigate } from "react-router-dom";
import useAppContext from "../hooks/useAppContext";
import useSearchContext from "../hooks/useSearchContext";
import SignOutButton from "./SignOutButton";
import {
  FileText,
  Activity,
  BarChart3,
  Building2,
  Calendar,
  LogIn,
  ShieldCheck,
  Users,
} from "lucide-react";

import { useQuery } from "react-query";
import * as apiClient from "../api-client";

const Header = () => {
  const { isLoggedIn, user } = useAppContext();
  const search = useSearchContext();
  const navigate = useNavigate();

  const handleLogoClick = () => {
    // Clear search context when going to home page
    search.clearSearchValues();
    navigate("/");
  };

  const isHotelOwner = user?.role === "hotel_owner";

  const { data: guests } = useQuery(
    "fetchMyGuests",
    apiClient.fetchMyGuests,
    {
      enabled: isLoggedIn && isHotelOwner,
      refetchInterval: 60000, // Refresh every minute for notifications
    }
  );

  const pendingVerificationsCount = guests?.reduce((acc, guest) => {
    const hasPending = guest.stayHistory.some((stay: any) => stay.status === "ID_SUBMITTED");
    return acc + (hasPending ? 1 : 0);
  }, 0) || 0;

  return (
    <>
      {/* Development Banner */}
      {/* {!import.meta.env.PROD && (
        <div className="bg-yellow-500 text-black text-center py-1 text-xs font-medium">
          🚧 Development Mode - Auth state persists between sessions
        </div>
      )} */}
      <header className="bg-gradient-to-r from-primary-600 to-primary-700 shadow-large sticky top-0 z-50">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <button
              onClick={handleLogoClick}
              className="flex items-center space-x-2 group"
            >
              <div className="bg-white p-2 rounded-lg shadow-soft group-hover:shadow-medium transition-all duration-300">
                <Building2 className="w-6 h-6 text-primary-600" />
              </div>
              <span className="text-2xl font-bold text-white tracking-tight group-hover:text-primary-100 transition-colors">
                MernHolidays
              </span>
            </button>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {isLoggedIn ? (
                <>
                  {/* Admin Dashboard - Only for admins */}
                  {user?.role === "admin" && (
                    <Link
                      to="/admin"
                      className="flex items-center text-white/90 hover:text-white px-4 py-2 rounded-lg font-medium hover:bg-white/10 transition-all duration-200 group"
                    >
                      <BarChart3 className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                      Admin Dashboard
                    </Link>
                  )}

                  {/* Analytics Dashboard Link - Only for hotel owners */}
                  {isHotelOwner && (
                    <Link
                      className="flex items-center text-white/90 hover:text-white px-4 py-2 rounded-lg font-medium hover:bg-white/10 transition-all duration-200 group"
                      to="/analytics"
                    >
                      <BarChart3 className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                      Analytics
                    </Link>
                  )}

                  {isHotelOwner && (
                    <Link
                      className="flex items-center text-white/90 hover:text-white px-4 py-2 rounded-lg font-medium bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 transition-all duration-200 group"
                      to="/subscription"
                    >
                      <ShieldCheck className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform text-emerald-300" />
                      Upgrade
                    </Link>
                  )}

                  {/* <div className="w-px h-6 bg-white/20 mx-2"></div> */}
                  {isHotelOwner ? (
                    <Link
                      className="flex items-center text-white/90 hover:text-white px-4 py-2 rounded-lg font-medium hover:bg-white/10 transition-all duration-200 group relative"
                      to="/guests"
                    >
                      <div className="relative">
                        <Users className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                        {pendingVerificationsCount > 0 && (
                          <span className="absolute -top-1.5 -right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border border-white"></span>
                          </span>
                        )}
                      </div>
                      Guests
                      {pendingVerificationsCount > 0 && (
                        <span className="ml-1.5 px-1.5 py-0.5 bg-red-500 text-[10px] text-white rounded-full font-bold">
                          {pendingVerificationsCount}
                        </span>
                      )}
                    </Link>
                  ) : (
                    <Link
                      className="flex items-center text-white/90 hover:text-white px-4 py-2 rounded-lg font-medium hover:bg-white/10 transition-all duration-200 group"
                      to="/my-bookings"
                    >
                      <Calendar className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                      My Bookings
                    </Link>
                  )}
                  {/* My Hotels Link - Only for hotel owners */}
                  {isHotelOwner && (
                    <Link
                      className="flex items-center text-white/90 hover:text-white px-4 py-2 rounded-lg font-medium hover:bg-white/10 transition-all duration-200 group"
                      to="/my-hotels"
                    >
                      <Building2 className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                      My Hotels
                    </Link>
                  )}

                  {/* API Documentation Link */}
                  <Link
                    className="flex items-center text-white/90 hover:text-white px-4 py-2 rounded-lg font-medium hover:bg-white/10 transition-all duration-200 group"
                    to="/api-docs"
                  >
                    <FileText className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                    API Docs
                  </Link>

                  {/* API Status Link */}
                  <Link
                    className="flex items-center text-white/90 hover:text-white px-4 py-2 rounded-lg font-medium hover:bg-white/10 transition-all duration-200 group"
                    to="/api-status"
                  >
                    <Activity className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                    API Status
                  </Link>

                  <SignOutButton />
                </>
              ) : (
                <>
                  <Link
                    to="/sign-in"
                    className="flex items-center bg-gray-100 text-gray-700 hover:bg-gray-200 px-4 py-2 rounded-lg font-semibold transition-all duration-200 mr-2"
                  >
                    Admin
                  </Link>
                  <Link
                    to="/sign-in"
                    className="flex items-center bg-white text-primary-600 px-6 py-2 rounded-lg font-semibold hover:bg-primary-50 hover:shadow-medium transition-all duration-200 group"
                  >
                    <LogIn className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                    Sign In
                  </Link>
                </>
              )}
            </nav>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button className="text-white p-2 rounded-lg hover:bg-white/10 transition-colors">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header >
    </>
  );
};

export default Header;
