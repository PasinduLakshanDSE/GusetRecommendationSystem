import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { Route, Routes } from "react-router-dom";

import ModernHotelStaffDashboard from "./pages/HotelStaffDashboard/ModernHotelStaffDashboard";

export default function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/Hotelstaffdashboard" element={<ModernHotelStaffDashboard />} />
      </Routes>
    </div>
  );
}
