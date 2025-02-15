// Updated UserPortfolio Schema - Ensure stock_id is a String
const mongoose = require("mongoose");

const UserPortfolioSchema = new mongoose.Schema({
  userid: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  stock_id: { type: String, required: true }, // 🔹 FIX: Store stock_id as a String
  quantity_owned: { type: Number, default: 0 }
});

module.exports = mongoose.model("UserPortfolio", UserPortfolioSchema);
