const mongoose = require("mongoose");

const WalletSchema = new mongoose.Schema({
  wallet_tx_id: { type: String, required: true, unique: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  stock_tx_id: { type: String, required: true },
  is_debit: { type: Number, default: 0 },
  amount: { type: Number, default: 0 },
  timestamp: { type: Date },
});

module.exports = mongoose.model("Wallet", WalletSchema);
