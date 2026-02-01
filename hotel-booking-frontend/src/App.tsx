import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import Layout from "./layouts/Layout";
import AuthLayout from "./layouts/AuthLayout";
import ScrollToTop from "./components/ScrollToTop";
import { Toaster } from "./components/ui/toaster";
import Register from "./pages/Register";
import SignIn from "./pages/SignIn";
import AddHotel from "./pages/AddHotel";
import useAppContext from "./hooks/useAppContext";
import MyHotels from "./pages/MyHotels";
import EditHotel from "./pages/EditHotel";
import Search from "./pages/Search";
import Detail from "./pages/Detail";
import Booking from "./pages/Booking";
import MyBookings from "./pages/MyBookings";
import Home from "./pages/Home";
import ApiDocs from "./pages/ApiDocs";
import ApiStatus from "./pages/ApiStatus";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";
import Subscription from "./pages/Subscription";
import MyGuests from "./pages/MyGuests";
import AdminDashboard from "./pages/AdminDashboard";
import VerificationPage from "./pages/VerificationPage";

const App = () => {
  const { isLoggedIn } = useAppContext();
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route
          path="/"
          element={
            <Layout>
              <Home />
            </Layout>
          }
        />
        <Route
          path="/search"
          element={
            <Layout>
              <Search />
            </Layout>
          }
        />
        <Route
          path="/detail/:hotelId"
          element={
            <Layout>
              <Detail />
            </Layout>
          }
        />
        <Route
          path="/api-docs"
          element={
            <Layout>
              <ApiDocs />
            </Layout>
          }
        />
        <Route
          path="/api-status"
          element={
            <Layout>
              <ApiStatus />
            </Layout>
          }
        />
        <Route
          path="/analytics"
          element={
            <Layout>
              <AnalyticsDashboard />
            </Layout>
          }
        />
        <Route
          path="/register"
          element={
            <AuthLayout>
              <Register />
            </AuthLayout>
          }
        />
        <Route
          path="/sign-in"
          element={
            <AuthLayout>
              <SignIn />
            </AuthLayout>
          }
        />

        {/* Protected Routes */}
        <Route
          path="/hotel/:hotelId/booking"
          element={
            <Layout>
              {isLoggedIn ? <Booking /> : <Navigate to="/sign-in" />}
            </Layout>
          }
        />
        <Route
          path="/add-hotel"
          element={
            <Layout>
              {isLoggedIn ? <AddHotel /> : <Navigate to="/sign-in" />}
            </Layout>
          }
        />
        <Route
          path="/edit-hotel/:hotelId"
          element={
            <Layout>
              {isLoggedIn ? <EditHotel /> : <Navigate to="/sign-in" />}
            </Layout>
          }
        />
        <Route
          path="/my-hotels"
          element={
            <Layout>
              {isLoggedIn ? <MyHotels /> : <Navigate to="/sign-in" />}
            </Layout>
          }
        />
        <Route
          path="/my-bookings"
          element={
            <Layout>
              {isLoggedIn ? <MyBookings /> : <Navigate to="/sign-in" />}
            </Layout>
          }
        />
        <Route
          path="/verification"
          element={
            <Layout>
              {isLoggedIn ? <VerificationPage /> : <Navigate to="/sign-in" />}
            </Layout>
          }
        />
        <Route
          path="/subscription"
          element={
            <Layout>
              {isLoggedIn ? <Subscription /> : <Navigate to="/sign-in" />}
            </Layout>
          }
        />
        <Route
          path="/guests"
          element={
            <Layout>
              {isLoggedIn ? <MyGuests /> : <Navigate to="/sign-in" />}
            </Layout>
          }
        />
        <Route
          path="/admin"
          element={
            <Layout>
              {isLoggedIn ? <AdminDashboard /> : <Navigate to="/sign-in" />}
            </Layout>
          }
        />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <Toaster />
    </Router>
  );
};

export default App;
