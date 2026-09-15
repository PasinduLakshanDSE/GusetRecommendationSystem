const bcrypt = require("bcryptjs");
const StaffUser = require("../models/StaffUser.jsx");
const { publicUser, validPassword } = require("./authController.jsx");

async function listStaffUsers(request, response) {
  const users = await StaffUser.find().sort({ createdAt: -1 });
  response.json(users.map(publicUser));
}

async function createStaffUser(request, response) {
  const { fullName, email, password, role = "staff", department = "Guest Services" } = request.body;
  if (!fullName?.trim() || !email?.trim() || !validPassword(password)) return response.status(400).json({ error: "Name, email, and an 8-character password are required." });
  if (!["admin", "staff"].includes(role)) return response.status(400).json({ error: "Invalid staff role." });
  if (await StaffUser.exists({ email: email.trim().toLowerCase() })) return response.status(409).json({ error: "A staff user already uses this email address." });
  const user = await StaffUser.create({ fullName: fullName.trim(), email: email.trim(), passwordHash: await bcrypt.hash(password, 12), role, department: department.trim() || "Guest Services" });
  response.status(201).json(publicUser(user));
}

async function updateStaffStatus(request, response) {
  const user = await StaffUser.findById(request.params.id);
  if (!user) return response.status(404).json({ error: "Staff user not found." });
  if (user._id.toString() === request.user.id && request.body.active === false) return response.status(400).json({ error: "You cannot deactivate your own account." });
  user.active = Boolean(request.body.active);
  await user.save();
  response.json(publicUser(user));
}

module.exports = { listStaffUsers, createStaffUser, updateStaffStatus };
