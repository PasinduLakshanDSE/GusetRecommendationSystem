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

async function analyzeGuest(guest) {
  const preferences = Object.fromEntries(
    interestNames.map((name) => [
      `${name}_Interest`,
      guest.interests.includes(name) ? 5 : 2,
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
      preferences,
    },
  );
  return data.analysis;
}

module.exports = { analyzeGuest };
