const mongoose = require("mongoose");

const staffUserSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["admin", "staff"], default: "staff" },
    department: { type: String, default: "Guest Services", trim: true },
    active: { type: Boolean, default: true },
    lastLoginAt: Date,
    passwordResetTokenHash: String,
    passwordResetExpiresAt: Date,
  },
  { timestamps: true },
);

module.exports = mongoose.model("StaffUser", staffUserSchema);
