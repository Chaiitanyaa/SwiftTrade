const express = require("express");
const Stock = require("../models/Stock");
const UserPortfolio = require("../models/UserPortfolio");
const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");
const router = express.Router();
const authenticateToken = require("../middleware/authMiddleware");
const { v4: uuidv4 } = require("uuid");
const mongoose = require("mongoose");
const MatchingEngine = require("../matchingEngine/matchingEngine");



// Fetch all stocks
router.get("/", async (req, res) => {
    try {
        const stocks = await Stock.find();
        res.json({ success: true, data: stocks });
    } catch (err) {
        res.status(500).json({ success: false, data: { error: err.message } });
    }
});

// Create a new stock
router.post("/createStock", authenticateToken, async (req, res) => {
    try {
        const { stock_name } = req.body;

        if (!stock_name) {
            return res.status(400).json({ success: false, data: { error: "Stock name is required" } });
        }

        // Check if stock already exists
        const existingStock = await Stock.findOne({ stock_name });
        if (existingStock) {
            return res.status(400).json({ success: false, data: { error: "Stock already exists" } });
        }

        // Create new stock
        const newStock = new Stock({
            stock_id: uuidv4(),
            stock_name,
            price: 100, // Default price (can be updated later)
            availability: 0, // Initial availability
        });

        await newStock.save();

        res.json({ success: true, data: { stock_id: newStock.stock_id } });
    } catch (err) {
        res.status(500).json({ success: false, data: { error: err.message } });
    }
});


// Add stock to user's portfolio
router.post("/addStockToUser", authenticateToken, async (req, res) => {
    try {
        const { stock_id, quantity } = req.body;
        const user_id = req.user.id;

        if (!stock_id || !quantity || quantity <= 0) {
            return res.status(400).json({ success: false, data: { error: "Invalid stock ID or quantity" } });
        }

        const stock = await Stock.findOne({ stock_id }); // 🔹 FIX: Match stock_id as String
        if (!stock) {
            return res.status(404).json({ success: false, data: { error: "Stock not found" } });
        }

        let portfolio = await UserPortfolio.findOne({ userid: user_id, stock_id });
        if (!portfolio) {
            portfolio = new UserPortfolio({ userid: user_id, stock_id, quantity_owned: quantity });
        } else {
            portfolio.quantity_owned += quantity;
        }

        await portfolio.save();
        res.json({ success: true, data: null });
    } catch (err) {
        res.status(500).json({ success: false, data: { error: err.message } });
    }
});

// ✅ Get Stock Prices from Order Book
router.get("/getStockPrices", authenticateToken, async (req, res) => {
    try {
        console.log("🔍 Fetching stock prices from Order Book...");

        // ✅ Get the order book (same as `getOrderBook`)
        const orderBook = engine.getOrderBook();
        const sellOrders = orderBook.sellOrders;

        if (!sellOrders || sellOrders.length === 0) {
            console.log("⚠️ No sell orders found.");
            return res.json({ success: true, data: [] });
        }

        // 🔹 Extract lowest price for each stock
        const stockPrices = {};
        sellOrders.forEach(order => {
            if (!stockPrices[order.stock_id] || order.price < stockPrices[order.stock_id].current_price) {
                stockPrices[order.stock_id] = {
                    stock_id: order.stock_id,
                    stock_name: "Unknown", // Modify if needed
                    current_price: order.price
                };
            }
        });

        return res.json({ success: true, data: Object.values(stockPrices) });

    } catch (error) {
        console.error("❌ Error fetching stock prices:", error);
        return res.status(500).json({ success: false, data: { error: error.message } });
    }
});






module.exports = router;
