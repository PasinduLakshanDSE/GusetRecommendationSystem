const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const connectDatabase = require("./config/database.jsx");
const guestRoutes = require("./routes/guestRoute.jsx");

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

connectDatabase();
app.use("/api/guests", guestRoutes);

app.get("/api/hotel-intelligence", async (request, response) => {
  try {
    const { data } = await axios.get(
      `${process.env.FLASK_AI_URL || "http://127.0.0.1:5000"}/api/hotel-intelligence`,
      { params: { hotel: request.query.hotel }, timeout: 10000 },
    );
    response.json(data);
  } catch (error) {
    response.status(503).json({
      error: "Hotel review intelligence is unavailable. Start the Flask AI service.",
    });
  }
});

app.get("/api/health", (request, response) => {
  response.json({ status: "Node API is running" });
});

const port = process.env.PORT || 8000;

app.listen(port, () => {
  console.log(`Node Server Started on Port ${port}`);
});
