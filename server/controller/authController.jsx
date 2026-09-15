const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const StaffUser = require("../models/StaffUser.jsx");
const { sendPasswordResetEmail } = require("../config/mailer.jsx");

const publicUser = (user) => ({
  id: user._id,
  fullName: user.fullName,
  email: user.email,
  role: user.role,
  department: user.department,
  active: user.active,
  lastLoginAt: user.lastLoginAt,
  createdAt: user.createdAt,
});

const signToken = (user) => jwt.sign(
  { id: user._id.toString(), role: user.role, email: user.email, fullName: user.fullName },
  process.env.JWT_SECRET,
  { expiresIn: "8h" },
);

function validPassword(password) {
  return typeof password === "string" && password.length >= 8;
}

async function setupStatus(request, response) {
  response.json({ needsSetup: (await StaffUser.countDocuments()) === 0 });
}

async function bootstrapAdmin(request, response) {
  if (await StaffUser.countDocuments()) return response.status(403).json({ error: "Initial administrator has already been created." });
  const { fullName, email, password } = request.body;
  if (!fullName?.trim() || !email?.trim() || !validPassword(password)) return response.status(400).json({ error: "Name, email, and an 8-character password are required." });
  const user = await StaffUser.create({ fullName: fullName.trim(), email: email.trim(), passwordHash: await bcrypt.hash(password, 12), role: "admin", department: "Administration" });
  response.status(201).json({ token: signToken(user), user: publicUser(user) });
}

async function login(request, response) {
  const { email, password } = request.body;
  const user = await StaffUser.findOne({ email: String(email || "").trim().toLowerCase() });
  if (!user || !(await bcrypt.compare(String(password || ""), user.passwordHash))) return response.status(401).json({ error: "Incorrect email address or password." });
  if (!user.active) return response.status(403).json({ error: "This staff account has been deactivated. Contact an administrator." });
  user.lastLoginAt = new Date();
  await user.save();
  response.json({ token: signToken(user), user: publicUser(user) });
}

async function currentUser(request, response) {
  const user = await StaffUser.findById(request.user.id);
  if (!user || !user.active) return response.status(401).json({ error: "Account is not available." });
  response.json({ user: publicUser(user) });
}

async function requestPasswordReset(request, response) {
  const email = String(request.body.email || "").trim().toLowerCase();
  const user = await StaffUser.findOne({ email });
  const message = "If that active staff account exists, a password reset link has been created.";
  if (!user || !user.active) return response.json({ message });
  const token = crypto.randomBytes(32).toString("hex");
  user.passwordResetTokenHash = crypto.createHash("sha256").update(token).digest("hex");
  user.passwordResetExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
  await user.save();
  try {
    await sendPasswordResetEmail({ to: user.email, fullName: user.fullName, resetUrl: `${process.env.APP_URL || "http://localhost:5173"}/reset-password/${token}` });
    response.json({ message });
  } catch (error) {
    user.passwordResetTokenHash = undefined;
    user.passwordResetExpiresAt = undefined;
    await user.save();
    response.status(503).json({ error: error.message || "Password reset email could not be sent." });
  }
}

async function resetPassword(request, response) {
  const { password } = request.body;
  if (!validPassword(password)) return response.status(400).json({ error: "Use a password with at least 8 characters." });
  const tokenHash = crypto.createHash("sha256").update(request.params.token).digest("hex");
  const user = await StaffUser.findOne({ passwordResetTokenHash: tokenHash, passwordResetExpiresAt: { $gt: new Date() } });
  if (!user) return response.status(400).json({ error: "This password reset link is invalid or has expired." });
  user.passwordHash = await bcrypt.hash(password, 12);
  user.passwordResetTokenHash = undefined;
  user.passwordResetExpiresAt = undefined;
  await user.save();
  response.json({ message: "Password updated. You can now sign in." });
}

module.exports = { setupStatus, bootstrapAdmin, login, currentUser, requestPasswordReset, resetPassword, publicUser, validPassword };
