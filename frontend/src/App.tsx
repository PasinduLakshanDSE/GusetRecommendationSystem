import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { Route, Routes } from "react-router-dom";

import ModernHotelStaffDashboard from "./pages/HotelStaffDashboard/ModernHotelStaffDashboard";
import GuestDetailsfrom from "./pages/GuestDeatilsForm/GuestDetailsfrom";
import GuestDetailsPage from "./pages/GuestDetailsPage/GuestDetailsPage";

export default function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<GuestDetailsPage />} />
        <Route path="/Hotelstaffdashboard" element={<ModernHotelStaffDashboard />} />
        <Route path="/SideBar" element={<ModernHotelStaffDashboard />} />
        <Route path="/GuestDetailsForm" element={<GuestDetailsfrom />} />
      </Routes>
    </div>
  );
}
