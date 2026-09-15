import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { Route, Routes } from "react-router-dom";

import ModernHotelStaffDashboard from "./pages/HotelStaffDashboard/ModernHotelStaffDashboard";
import GuestDetailsfrom from "./pages/GuestDeatilsForm/GuestDetailsfrom";
import GuestProfilePage from "./pages/PreferenceAnalysisPage/AdvancedPreferenceAnalysisPage";
import GuestDetailsDisplayPage from "./pages/GuestDetailsDisplayPage/GuestDetailsDisplayPage";
import PreferenceAnalysisPage from "./pages/PreferenceAnalysisPage/AdvancedPreferenceAnalysisPage";
import LoginPage from "./pages/LoginPage/LoginPage";
import UserManagementPage from "./pages/UserManagementPage/UserManagementPage";
import ProtectedRoute from "./components/ProtectedRoute";
import ForgotPasswordPage from "./pages/ForgotPasswordPage/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ForgotPasswordPage/ResetPasswordPage";
import GuestReviewQueuePage from "./pages/GuestReviewQueuePage/GuestReviewQueuePage";
import RecommendationHistoryPage from "./pages/RecommendationHistoryPage/RecommendationHistoryPage";
//import GuestDetailsPage from "./pages/GuestDetailsPage/GuestDetailsPage";

export default function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/GuestDetailsForm" element={<GuestDetailsfrom />} />
        <Route element={<ProtectedRoute />}>
        <Route path="/Hotelstaffdashboard" element={<ModernHotelStaffDashboard />} />
        <Route path="/SideBar" element={<ModernHotelStaffDashboard />} />
        <Route path="/guest-profile/:id" element={<GuestProfilePage />} />
        <Route path="/guest-details/:id" element={<GuestDetailsDisplayPage />} />
        <Route path="/preference-analysis/:id" element={<PreferenceAnalysisPage />} />
        <Route path="/guest-review-queue" element={<GuestReviewQueuePage />} />
        <Route path="/recommendation-history" element={<RecommendationHistoryPage />} />
        </Route>
        <Route element={<ProtectedRoute adminOnly />}><Route path="/user-management" element={<UserManagementPage />} /></Route>
      </Routes>
    </div>
  );
}
