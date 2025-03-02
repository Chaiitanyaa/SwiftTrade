const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

const usersRoute = require("./routes/users");

const app = express();
const PORT = process.env.PORT || 3002;
const MONGO_URI = process.env.MONGO_URI || "mongodb://mongo:27017/tradingDB";

// Middleware
app.use(express.json());
app.use(cors());

// Connect to MongoDB
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("✅ Connected to MongoDB - Authentication Service"))
  .catch(err => console.error("❌ MongoDB Connection Error:", err));

// Routes
app.use("/authentication", usersRoute);

// Health check endpoint
app.get("/", (req, res) => res.send("✅ Authentication Service is running"));

// Start Server
app.listen(PORT, () => console.log(`🚀 Authentication Service running on port ${PORT}`));
