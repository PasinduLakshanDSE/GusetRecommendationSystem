const PortalSettings = require("../models/PortalSettings.jsx");

const allowedFields = ["hotelName", "location", "contactEmail", "timezone", "newGuestAlerts", "riskAlerts", "dailySummary", "aiAutoAnalysis", "aiStaffActions"];

async function getSettings(request, response) {
  const settings = await PortalSettings.findOneAndUpdate(
    { key: "default" },
    { $setOnInsert: { key: "default" } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
  response.json(settings);
}

async function updateSettings(request, response) {
  const updates = {};
  allowedFields.forEach((field) => {
    if (request.body[field] !== undefined) updates[field] = request.body[field];
  });
  const settings = await PortalSettings.findOneAndUpdate(
    { key: "default" },
    { $set: { ...updates, updatedBy: request.user.id }, $setOnInsert: { key: "default" } },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
  );
  response.json(settings);
}

async function getPublicSettings() {
  return PortalSettings.findOneAndUpdate(
    { key: "default" },
    { $setOnInsert: { key: "default" } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  ).lean();
}

module.exports = { getSettings, updateSettings, getPublicSettings };
