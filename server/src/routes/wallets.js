const express = require("express");
const Wallet = require("../models/Wallet");
const router = express.Router();

// Fetch all wallets
router.get("/", async (req, res) => {
  try {
    const wallets = await Wallet.find();
    res.json(wallets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
