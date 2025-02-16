// src/routes/transactions.js
const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const MatchingEngine = require("../matchingEngine/matchingEngine");
const Transaction = require("../models/Transaction");
const { v4: uuidv4 } = require("uuid");

const router = express.Router();
const engine = new MatchingEngine();

// ✅ API to Place a Sell Order (Extract user ID from JWT)
router.post("/placeStockOrder", authMiddleware, async (req, res) => {
    console.log("✅ Received order:", req.body);

    const user_id = req.user.id; // Extract user ID from JWT token
    const { stock_id, is_buy, order_type, quantity, price } = req.body;

    if (!stock_id || typeof is_buy !== "boolean" || !order_type || !quantity || !price) {
        console.error("❌ Missing required fields:", { stock_id, user_id, is_buy, order_type, quantity, price });
        return res.status(400).json({ error: "Missing required fields" });
    }

    try {
        // 🔹 Log the order into the Transactions DB
        const newTransaction = new Transaction({
            stock_tx_id: uuidv4(), // Generate unique ID
            stock_id,
            wallet_tx_id: null,
            order_status: "IN_PROGRESS",
            parent_stock_tx_id: null,
            is_buy,
            order_type,
            stock_price: price,
            quantity,
            time_stamp: new Date(),
            buyer_id: is_buy ? user_id : null,
            seller_id: is_buy ? null : user_id,
        });

        await newTransaction.save();
        console.log("📌 Order logged in Transactions DB:", newTransaction);

        // 🔹 Send order to the Matching Engine
        const order = { id: newTransaction.stock_tx_id, stock_id, user_id, is_buy, order_type, quantity, price };
        await engine.placeOrder(order);

        return res.json({ success: true, data: null }); // ✅ Required Response Format
    } catch (error) {
        console.error("❌ Error placing order:", error);
        return res.status(500).json({ success: false, data: { error: error.message } });
    }
});


router.post("/cancelOrder", authMiddleware, async (req, res) => {
    const user_id = req.user.id; // Extract user ID from JWT token
    const { order_id, is_buy } = req.body;

    if (!order_id || typeof is_buy !== "boolean") {
        return res.status(400).json({ error: "Missing required fields" });
    }

    const result = await engine.cancelOrder(order_id, user_id, is_buy);
    return res.json(result);
});

router.get("/getOrderBook", async (req, res) => {
    try {
        const buyOrders = engine.orderBook.buyOrders;
        const sellOrders = engine.orderBook.sellOrders;

        return res.json({
            success: true,
            data: {
                buy_orders: buyOrders.map(order => ({
                    stock_id: order.stock_id,
                    price: order.price,
                    quantity: order.quantity
                })),
                sell_orders: sellOrders.map(order => ({
                    stock_id: order.stock_id,
                    price: order.price,
                    quantity: order.quantity
                }))
            }
        });
    } catch (error) {
        console.error("❌ Error fetching order book:", error);
        return res.status(500).json({ success: false, data: { error: error.message } });
    }
}); 

router.get("/getStockTransactions", authMiddleware, async (req, res) => {
    try {
        const user_id = req.user.id; // Extract user ID from JWT token

        console.log(`🔍 Fetching transactions for user: ${user_id}`);

        // 🔹 Find transactions where the user is the buyer or seller
        const transactions = await Transaction.find({
            $or: [{ buyer_id: user_id }, { seller_id: user_id }]
        });

        console.log(`📝 MongoDB Query Result: ${JSON.stringify(transactions, null, 2)}`);

        if (!transactions || transactions.length === 0) {
            console.log("⚠️ No transactions found for user.");
            return res.json({ success: true, data: [] });
        }

        // 🔹 Format response
        const formattedTransactions = transactions.map(tx => ({
            stock_tx_id: tx.stock_tx_id,
            parent_stock_tx_id: tx.parent_stock_tx_id || null,
            stock_id: tx.stock_id,
            wallet_tx_id: tx.wallet_tx_id || null,
            order_status: tx.order_status,
            is_buy: tx.is_buy,
            order_type: tx.order_type,
            stock_price: tx.stock_price,
            quantity: tx.quantity,
            time_stamp: tx.time_stamp
        }));

        console.log(`✅ Transactions found: ${formattedTransactions.length}`);

        return res.json({ success: true, data: formattedTransactions });

    } catch (error) {
        console.error("❌ Error fetching stock transactions:", error);
        return res.status(500).json({ success: false, data: { error: error.message } });
    }
});


module.exports = router;
