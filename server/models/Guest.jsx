const mongoose = require("mongoose");

const guestSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phone: String,
    country: String,
    arrivalDate: String,
    stayDuration: Number,
    adults: Number,
    children: Number,
    purposeOfVisit: String,
    district: String,
    budget: String,
    activityLevel: String,
    roomPreference: String,
    foodPreference: String,
    interests: [String],
    specialRequests: String,
    accessibilityNeeds: String,
    aiAnalysis: mongoose.Schema.Types.Mixed,
    status: { type: String, default: "Ready to review" },
    notificationRead: { type: Boolean, default: false },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Guest", guestSchema);
