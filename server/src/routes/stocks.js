const express = require("express");
const Stock = require("../models/Stock");
const router = express.Router();

// Fetch all stocks
router.get("/", async (req, res) => {
  try {
    const stocks = await Stock.find();
    res.json(stocks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;
