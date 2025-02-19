const express = require("express");
const router = express.Router();
const UserPortfolio = require("../models/UserPortfolio");
const authMiddleware = require("../middleware/authMiddleware");
const Stock = require("../models/Stock");

// Get all user portfolios
router.get("/", async (req, res) => {
    try {
        const portfolios = await UserPortfolio.find();
        res.json(portfolios);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add a new user portfolio
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
    try {
        const user_id = req.user.id;
        const portfolio = await UserPortfolio.find({ userid: user_id, quantity_owned: { $gt: 0 } }); // 🔹 Exclude stocks with quantity 0

        if (!portfolio || portfolio.length === 0) {
            return res.json({ success: true, data: [] });
        }

        // 🔹 Fetch stock details manually since `.populate()` doesn't work on Strings
        const stockPortfolio = await Promise.all(
            portfolio.map(async (entry) => {
                const stock = await Stock.findOne({ stock_id: entry.stock_id });
                return stock
                    ? {
                        stock_id: entry.stock_id,
                        stock_name: stock.stock_name,
                        quantity_owned: entry.quantity_owned,
                        updated_at: new Date().toISOString(),
                    }
                    : null;
            })
        );

        res.json({ success: true, data: stockPortfolio.filter((item) => item !== null) });
    } catch (err) {
        res.status(500).json({ success: false, data: { error: err.message } });
    }
});


module.exports = router;
