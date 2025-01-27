const mongoose = require("mongoose");

const WalletSchema = new mongoose.Schema({
  wallet_id: { type: String, required: true, unique: true },
  user_id: { type: String, required: true },
  balance: { type: Number, default: 0 },
  transactions: [
    {
      transaction_id: { type: String },
      amount: { type: Number },
      timestamp: { type: Date, default: Date.now },
    },
  ],
});

module.exports = mongoose.model("Wallet", WalletSchema);
