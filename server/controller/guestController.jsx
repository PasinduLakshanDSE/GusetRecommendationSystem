const Guest = require("../models/Guest.jsx");
const { analyzeGuest } = require("../services/flaskAiService.jsx");

async function createGuest(request, response) {
  try {
    const guest = new Guest(request.body);
    const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const normalize = (value) => String(value || "").trim().toLowerCase();
    const matchConditions = [{ email: guest.email }];
    if (guest.phone) matchConditions.push({ phone: guest.phone });
    if (guest.fullName && guest.country) {
      matchConditions.push({
        fullName: { $regex: `^${escapeRegex(guest.fullName.trim())}$`, $options: "i" },
        country: { $regex: `^${escapeRegex(guest.country.trim())}$`, $options: "i" },
      });
    }

    const previousBookings = await Guest.find({ $or: matchConditions })
      .select("bookingStatus status fullName country email phone")
      .lean();
    const previousCancellations = previousBookings.filter(
      (booking) => booking.bookingStatus === "Cancelled" || booking.status === "Cancelled",
    ).length;
    const completedStays = previousBookings.filter(
      (booking) => booking.bookingStatus === "Completed",
    ).length;
    const matchMethods = new Set();
    previousBookings.forEach((booking) => {
      if (normalize(booking.email) === normalize(guest.email)) matchMethods.add("email");
      if (guest.phone && normalize(booking.phone) === normalize(guest.phone)) matchMethods.add("phone");
      if (
        normalize(booking.fullName) === normalize(guest.fullName) &&
        normalize(booking.country) === normalize(guest.country)
      ) {
        matchMethods.add("full name and country");
      }
    });
    const bookingHistory = {
      repeatGuest: previousBookings.length > 0,
      previousBookings: previousBookings.length,
      previousCancellations,
      completedStays,
      matchMethods: Array.from(matchMethods),
    };

    guest.aiAnalysis = await analyzeGuest(guest, bookingHistory);
    await guest.save();
    response.status(201).json(guest);
  } catch (error) {
    response.status(500).json({ error: error.message || "Unable to create guest profile" });
  }
}

async function listGuests(request, response) {
  response.json(await Guest.find().sort({ createdAt: -1 }).limit(50));
}

async function getNotifications(request, response) {
  const guests = await Guest.find({ notificationRead: false }).sort({ createdAt: -1 });
  response.json({ count: guests.length, guests });
}

async function getGuest(request, response) {
  const guest = await Guest.findById(request.params.id);
  if (!guest) return response.status(404).json({ error: "Guest not found" });
  guest.notificationRead = true;
  await guest.save();
  response.json(guest);
}

async function updateBookingStatus(request, response) {
  const allowedStatuses = ["Pending", "Confirmed", "Completed", "Cancelled"];
  if (!allowedStatuses.includes(request.body.bookingStatus)) {
    return response.status(400).json({ error: "Invalid booking status" });
  }
  const guest = await Guest.findByIdAndUpdate(
    request.params.id,
    { bookingStatus: request.body.bookingStatus },
    { new: true, runValidators: true },
  );
  if (!guest) return response.status(404).json({ error: "Guest not found" });
  response.json(guest);
}

module.exports = { createGuest, listGuests, getNotifications, getGuest, updateBookingStatus };
