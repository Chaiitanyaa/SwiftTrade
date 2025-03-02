const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

const transactionsRoute = require("./routes/transactions");

const app = express();
const PORT = process.env.PORT || 3004;
const MONGO_URI = process.env.MONGO_URI || "mongodb://mongo:27017/tradingDB";

// Middleware
app.use(express.json());
app.use(cors());

// Connect to MongoDB
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("✅ Connected to MongoDB - Engine Service"))
  .catch(err => console.error("❌ MongoDB Connection Error:", err));

// Routes
app.use("/engine", transactionsRoute);

// Health check endpoint
app.get("/", (req, res) => res.send("✅ Engine Service is running"));

// Start Server
app.listen(PORT, () => console.log(`🚀 Engine Service running on port ${PORT}`));
