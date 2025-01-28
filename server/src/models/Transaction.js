const mongoose = require("mongoose");

const TransactionSchema = new mongoose.Schema({
  transaction_id: { type: String, required: true, unique: true },
  stock_id: { type: String, required: true },
  seller_id: { type: String, required: true },
  buyer_id: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  status: { type: String, enum: ["COMPLETE", "IN_PROGRESS", "PARTIALLY_COMPLETE"], required: true },
  availability: { type: Date, default: Date.now, required: true },

});

module.exports = mongoose.model("Transaction", TransactionSchema);