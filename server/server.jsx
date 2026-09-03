const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDatabase = require("./config/database.jsx");
const guestRoutes = require("./routes/guestRoute.jsx");

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

connectDatabase();
app.use("/api/guests", guestRoutes);

app.get("/api/health", (request, response) => {
  response.json({ status: "Node API is running" });
});

const port = process.env.PORT || 8000;

app.listen(port, () => {
  console.log(`Node Server Started on Port ${port}`);
});
