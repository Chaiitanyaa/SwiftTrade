const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const usersRoute = require("./routes/users");
const walletRoutes = require("./routes/wallets");
const stocksRoute = require("./routes/stocks");
const transactionsRoute = require("./routes/transactions");
const userPortfolioRoutes = require("./routes/userportfolio");

const app = express();
const DEV_ENV = process.env.DEV === "true";

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("✅ Backend is running!");
});

app.use("/api/users", usersRoute);
app.use("/api/wallet", walletRoutes);
app.use("/api/stocks", stocksRoute);
app.use("/api/userportfolio", userPortfolioRoutes);
app.use("/api/transactions", transactionsRoute);

module.exports = app;