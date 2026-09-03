const mongoose = require("mongoose");

async function connectDatabase() {
  if (!process.env.MONGODB_URI) {
    console.error("MONGODB_URI is missing. Add it to Server/.env.");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connection successful");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
}

module.exports = connectDatabase;