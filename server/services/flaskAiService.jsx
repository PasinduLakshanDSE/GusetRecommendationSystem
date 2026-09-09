const axios = require("axios");
const interestNames = [
  "Nature",
  "Culture",
  "Adventure",
  "Food",
  "Wellness",
  "Entertainment",
  "Shopping",
  "Family",
];

async function analyzeGuest(guest, bookingHistory = {}) {
  const preferences = Object.fromEntries(
    interestNames.map((name) => [
      `${name}_Interest`,
      (guest.interests || []).includes(name) ? 5 : 1,
    ]),
  );
  const { data } = await axios.post(
    process.env.FLASK_AI_URL || "http://127.0.0.1:5000/api/guests",
    {
      name: guest.fullName,
      email: guest.email,
      phone: guest.phone,
      country: guest.country,
      adults: guest.adults,
      children: guest.children,
      budget: guest.budget,
      district: guest.district,
      arrivalDate: guest.arrivalDate,
      stayDuration: guest.stayDuration,
      purposeOfVisit: guest.purposeOfVisit,
      roomPreference: guest.roomPreference,
      foodPreference: guest.foodPreference,
      bookingHistory,
      preferences,
    },
  );
  return data.analysis;
}

module.exports = { analyzeGuest };
