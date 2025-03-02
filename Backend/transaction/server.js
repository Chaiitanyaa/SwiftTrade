const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

const transactionsRoute = require("./routes/transactions");
const userPortfolioRoutes = require("./routes/userportfolio");
const walletRoutes = require("./routes/wallets");

const app = express();
const PORT = process.env.PORT || 3003;
const MONGO_URI = process.env.MONGO_URI || "mongodb://mongo:27017/tradingDB";

// Middleware
app.use(express.json());
app.use(cors());

// Connect to MongoDB
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("✅ Connected to MongoDB - Transaction Service"))
  .catch(err => console.error("❌ MongoDB Connection Error:", err));

// Routes
app.use("/transaction", transactionsRoute);
app.use("/transaction", userPortfolioRoutes);
app.use("/transaction", walletRoutes);

// Health check endpoint
app.get("/", (req, res) => res.send("✅ Transaction Service is running"));

// Start Server
app.listen(PORT, () => console.log(`🚀 Transaction Service running on port ${PORT}`));
