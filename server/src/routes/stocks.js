const express = require("express");
const Stock = require("../models/Stock");
const UserPortfolio = require("../models/UserPortfolio");
const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");
const router = express.Router();
const authenticateToken = require("../middleware/authMiddleware");
const { v4: uuidv4 } = require("uuid");
const mongoose = require("mongoose");

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



router.get("/getStockPrices", authenticateToken, async (req, res) => {
    try {
        const user_id = req.user.id.toString(); // ✅ Extract user ID from JWT

        console.log(`🔍 Fetching available stocks for user: ${user_id}`);

        // 🔹 Find stock IDs where this user has active sell orders
        const userSellOrders = await Transaction.find({ seller_id: user_id }).distinct("stock_id");

        console.log(`🛑 User is selling stocks: ${JSON.stringify(userSellOrders)}`);

        // 🔹 Find all stocks that have sell orders from *other* users
        const stocksWithOtherSellers = await Transaction.find({
            is_buy: false,
            stock_id: { $in: userSellOrders }, // Consider stocks user sells
            seller_id: { $ne: user_id } // Exclude user’s own sell orders
        }).distinct("stock_id");

        console.log(`📌 Stocks available from other users: ${JSON.stringify(stocksWithOtherSellers)}`);

        // 🔹 Combine stocks that are not sold by the user alone
        const validStockIds = [...new Set([...stocksWithOtherSellers])];

        // 🔹 Fetch stock details for the available stock IDs
        const availableStocks = await Stock.find({ stock_id: { $in: validStockIds } });

        if (!availableStocks || availableStocks.length === 0) {
            console.log("⚠️ No available stocks found.");
            return res.json({ success: true, data: [] });
        }

        // 🔹 Get prices from the Order Book (Lowest available sell price)
        const formattedStocks = availableStocks.map(stock => {
            const bestSellOrder = engine.orderBook.sellOrders
                .filter(order => order.stock_id === stock.stock_id)
                .sort((a, b) => a.price - b.price)[0]; // Lowest price

            return {
                stock_id: stock.stock_id,
                stock_name: stock.stock_name,
                stock_price: bestSellOrder ? bestSellOrder.price : null // ✅ Get price from order book
            };
        });

        console.log(`✅ Available stocks: ${formattedStocks.length}`);

        return res.json({ success: true, data: formattedStocks });

    } catch (error) {
        console.error("❌ Error fetching stock prices:", error);
        return res.status(500).json({ success: false, data: { error: error.message } });
    }
});

module.exports = router;
