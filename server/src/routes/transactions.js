const express = require("express");
const Transaction = require("../models/Transaction");
const router = express.Router();

// Fetch all transactions
router.get("/", async (req, res) => {
    try {
      const transactions = await Transaction.find();
      res.json(transactions);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

module.exports = router;
