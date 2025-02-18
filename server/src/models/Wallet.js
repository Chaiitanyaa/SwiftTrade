const mongoose = require("mongoose");

const WalletSchema = new mongoose.Schema({
  wallet_tx_id: { type: String, required: true, unique: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  stock_tx_id: { type: String, required: true },
  is_debit: { type: Boolean, required: true }, // ✅ Now stores `true/false`
  amount: { type: Number, default: 0 },
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Wallet", WalletSchema);
