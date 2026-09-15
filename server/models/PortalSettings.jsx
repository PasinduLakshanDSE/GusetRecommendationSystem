const mongoose = require("mongoose");

const portalSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: "default", unique: true },
    hotelName: { type: String, default: "GuestAI Hotel", trim: true },
    location: { type: String, default: "Sri Lanka", trim: true },
    contactEmail: { type: String, default: "guestservices@hotel.com", trim: true },
    timezone: { type: String, default: "Asia/Colombo (GMT+5:30)" },
    newGuestAlerts: { type: Boolean, default: true },
    riskAlerts: { type: Boolean, default: true },
    dailySummary: { type: Boolean, default: false },
    aiAutoAnalysis: { type: Boolean, default: true },
    aiStaffActions: { type: Boolean, default: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "StaffUser" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("PortalSettings", portalSettingsSchema);
