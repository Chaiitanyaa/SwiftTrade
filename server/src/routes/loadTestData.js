const express = require("express");
const Stock = require("../models/Stock");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const Wallet = require("../models/Wallet");
const router = express.Router();
const stocksData = require("../../test_data/stocks.json")
const transactionsData = require("../../test_data/transactions.json")
const userData = require("../../test_data/users.json")
const walletData = require("../../test_data/wallet.json")

router.get("/", async (req, res) => {
  try {
    await Promise.all([
      Stock.deleteMany({}),
      Transaction.deleteMany({}),
      User.deleteMany({}),
      Wallet.deleteMany({})
    ]);

    await Promise.all([
      Stock.insertMany(stocksData),
      Transaction.insertMany(transactionsData),
      User.insertMany(userData),
      Wallet.insertMany(walletData)
    ]);
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;
