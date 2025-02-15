const express = require("express");
const router = express.Router();
const UserPortfolio = require("../models/UserPortfolio");
const authMiddleware = require("../middleware/authMiddleware");
const Transaction = require("../models/Transaction");
const Stock = require("../models/Stock");
const Wallet = require("../models/Wallet");
const { v4: uuidv4 } = require("uuid");
const User = require("../models/User");




// @desc Get all user portfolios
router.get("/", async (req, res) => {
    try {
        const portfolios = await UserPortfolio.find();
        res.json(portfolios);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// @desc Add a new user portfolio
router.post("/", async (req, res) => {
    try {
        const newPortfolio = new UserPortfolio(req.body);
        await newPortfolio.save();
        res.status(201).json(newPortfolio);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get user's stock portfolio
router.get("/getStockPortfolio", authMiddleware, async (req, res) => {
    
});


module.exports = router;
