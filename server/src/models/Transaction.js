const mongoose = require("mongoose");

const TransactionSchema = new mongoose.Schema({
    stock_tx_id: { type: String, required: true, unique: true },
    stock_id: { type: String, required: true }, // 🔹 Ensure stock_id is stored as a String
    wallet_tx_id: { type: String, default: null },
    order_status: { type: String, required: true, enum: ["IN_PROGRESS", "PARTIALLY_COMPLETED", "COMPLETED", "CANCELLED"] }, // 🔹 Store order_status as a String
    parent_stock_tx_id: { type: String, default: null }, // 🔹 Allow NULL for parent transactions
    is_buy: { type: Boolean, required: true },
    order_type: { type: String, required: true, enum: ["MARKET", "LIMIT"] },
    stock_price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    time_stamp: { type: Date, default: Date.now },
    buyer_id: { type: String, default: null }, // 🔹 Ensure buyer_id is stored as a String
    seller_id: { type: String, default: null }  // 🔹 Ensure seller_id is stored as a String
});

module.exports = mongoose.model("Transaction", TransactionSchema);
