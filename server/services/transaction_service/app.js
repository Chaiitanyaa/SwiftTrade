const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

dotenv.config();
const app = express();

app.use(express.json());
app.use(cors());

// Connect to MongoDB
connectDB();

// Routes
const transactionsRoute = require("./routes/transactions");
const userPortfolioRoutes = require("./routes/userportfolio");

app.use("/transaction", transactionsRoute);
app.use("/transaction", userPortfolioRoutes);

app.get("/", (req, res) => res.send("✅ Transaction Service is running!"));

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => console.log(`🚀 Transaction Service running on port ${PORT}`));
