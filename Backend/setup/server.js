const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

const stocksRoute = require("./routes/stocks");

const app = express();
const PORT = process.env.PORT || 3005;
const MONGO_URI = process.env.MONGO_URI || "mongodb://mongo:27017/tradingDB";

// Middleware
app.use(express.json());
app.use(cors());

// Connect to MongoDB
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("✅ Connected to MongoDB - Setup Service"))
  .catch(err => console.error("❌ MongoDB Connection Error:", err));

// Routes
app.use("/setup", stocksRoute);

// Health check endpoint
app.get("/", (req, res) => res.send("✅ Setup Service is running"));

// Start Server
app.listen(PORT, () => console.log(`🚀 Setup Service running on port ${PORT}`));
