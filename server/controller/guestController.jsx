const Guest = require("../models/Guest.jsx");
const { analyzeGuest } = require("../services/flaskAiService.jsx");

async function createGuest(request, response) {
  try {
    const guest = new Guest(request.body);
    guest.aiAnalysis = await analyzeGuest(guest);
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

module.exports = { createGuest, listGuests, getNotifications, getGuest };
