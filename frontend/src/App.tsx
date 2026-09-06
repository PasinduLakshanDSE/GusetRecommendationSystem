import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { Route, Routes } from "react-router-dom";

import ModernHotelStaffDashboard from "./pages/HotelStaffDashboard/ModernHotelStaffDashboard";
import GuestDetailsfrom from "./pages/GuestDeatilsForm/GuestDetailsfrom";
import GuestProfilePage from "./pages/PreferenceAnalysisPage/AdvancedPreferenceAnalysisPage";
import GuestDetailsDisplayPage from "./pages/GuestDetailsDisplayPage/GuestDetailsDisplayPage";
import PreferenceAnalysisPage from "./pages/PreferenceAnalysisPage/AdvancedPreferenceAnalysisPage";
//import GuestDetailsPage from "./pages/GuestDetailsPage/GuestDetailsPage";

export default function App() {
  return (
    <div className="App">
      <Routes>
       
        <Route path="/Hotelstaffdashboard" element={<ModernHotelStaffDashboard />} />
        <Route path="/SideBar" element={<ModernHotelStaffDashboard />} />
        <Route path="/GuestDetailsForm" element={<GuestDetailsfrom />} />
        <Route path="/guest-profile/:id" element={<GuestProfilePage />} />
        <Route path="/guest-details/:id" element={<GuestDetailsDisplayPage />} />
        <Route path="/preference-analysis/:id" element={<PreferenceAnalysisPage />} />
      </Routes>
    </div>
  );
}
