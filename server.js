const dns = require("node:dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const movieRoutes = require("./routes/movies");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Movie Watchlist API is running",
    data: null,
  });
});

app.use("/api/movies", movieRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
    data: null,
  });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(400).json({
    success: false,
    message: "Invalid request",
    data: null,
  });
});

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB Atlas");
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  });
