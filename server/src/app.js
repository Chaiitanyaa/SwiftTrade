const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const usersRoute = require("./routes/users");
const walletRoutes = require("./routes/wallets");
const stocksRoute = require("./routes/stocks");
const transactionsRoute = require("./routes/transactions");
const userPortfolioRoutes = require("./routes/userportfolio")
//const loadTestData = require("./routes/loadTestData");

const app = express();
const DEV_ENV = process.env.DEV === "true";

app.use(express.json()); // Parse JSON requests
app.use(cors()); // Enable CORS

app.get("/", (req, res) => {
  res.send("✅ Backend is running!");
});

// ✅ Public Routes
app.use("/api/users", usersRoute);
app.use("/api/wallet", walletRoutes);
app.use("/api/stocks", stocksRoute);
app.use("/api/userportfolio", userPortfolioRoutes);

// ✅ Protected Routes (Require Authentication - Middleware is handled in each route file)
app.use("/api/transactions", transactionsRoute);

// ✅ Developer Testing Route (Optional)
//if (DEV_ENV) app.use("/api/loadTestData", loadTestData);

module.exports = app;
