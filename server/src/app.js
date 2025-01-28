const express = require("express");
const app = express();

const DEV_ENV = process.env.DEV === 'true'

// Middleware to parse JSON requests
app.use(express.json());

// Test route to verify the server
app.get("/", (req, res) => {
  res.send("Backend is running!");
});

const usersRoute = require("./routes/users");
const walletsRoute = require("./routes/wallets");
const transactionsRoute = require("./routes/transactions");
const stocksRoute = require("./routes/stocks");
const loadTestData = require("./routes/loadTestData")
app.use("/api/users", usersRoute);
app.use("/api/wallets", walletsRoute);
app.use("/api/stocks", stocksRoute);
app.use("/api/transactions", transactionsRoute);

if (DEV_ENV) app.use("/api/loadTestData", loadTestData);



module.exports = app;