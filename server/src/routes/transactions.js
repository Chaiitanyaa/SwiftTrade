// src/routes/transactions.js
const express = require("express");
const authMiddleware = require("../middleware/authMiddleware"); // Ensure this is correctly handling JWT
const MatchingEngine = require("../matchingEngine/matchingEngine");

const router = express.Router();
const engine = new MatchingEngine();

// ✅ API to Place a Sell Order (Extract user ID from JWT)
router.post("/placeSellOrder", authMiddleware, async (req, res) => {
    console.log("✅ Received order:", req.body);

    const user_id = req.user.id; // Extract user ID from JWT token
    const { stock_id, is_buy, order_type, quantity, price } = req.body;

    if (!stock_id || typeof is_buy !== "boolean" || !order_type || !quantity || !price) {
        console.error("❌ Missing required fields:", { stock_id, user_id, is_buy, order_type, quantity, price });
        return res.status(400).json({ error: "Missing required fields" });
    }

    const order = { id: Date.now(), stock_id, user_id, is_buy, order_type, quantity, price };
    const result = await engine.placeOrder(order);

    return res.json(result);
});

// ✅ API to Cancel an Order
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

module.exports = router;
