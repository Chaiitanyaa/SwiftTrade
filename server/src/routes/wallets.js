const express = require("express");
const authenticateToken = require("../middleware/authMiddleware"); // ✅ Import this!
const Wallet = require("../models/Wallet");
const { v4: uuidv4 } = require("uuid");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

// ✅ Add Money to Wallet
router.post("/addMoneyToWallet", authMiddleware, async (req, res) => {
    try {
        const user_id = req.user.id;
        const { amount } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ success: false, data: { error: "Invalid amount" } });
        }

        // 🔹 Find user's wallet
        let wallet = await Wallet.findOne({ user_id });

        if (!wallet) {
            // 🔹 Create a new wallet if it doesn't exist
            wallet = new Wallet({
                user_id,
                amount: 0,
                stock_tx_id: uuidv4(), // ✅ Generate unique transaction ID
                wallet_tx_id: uuidv4()  // ✅ Generate unique wallet transaction ID
            });
        }

        // 🔹 Add the amount to wallet
        wallet.amount += amount;
        await wallet.save();

        return res.json({ success: true, data: null });

    } catch (error) {
        console.error("❌ Error adding money to wallet:", error);
        return res.status(500).json({ success: false, data: { error: error.message } });
    }
});

// ✅ Get Wallet Balance
router.get("/getWalletBalance", authMiddleware, async (req, res) => {
    try {
        const user_id = req.user.id;

        // 🔹 Find user's wallet
        const wallet = await Wallet.findOne({ user_id });

        if (!wallet) {
            return res.status(404).json({ success: false, data: { error: "Wallet not found" } });
        }

        return res.json({ success: true, data: { balance: wallet.amount } });

    } catch (error) {
        console.error("❌ Error fetching wallet balance:", error);
        return res.status(500).json({ success: false, data: { error: error.message } });
    }
});

 
    



//router.get("/getWalletTransactions", authenticateToken, async (req, res) => 
   


module.exports = router;
