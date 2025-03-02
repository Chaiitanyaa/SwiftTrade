const express = require("express");
const Wallet = require("../models/Wallet");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const User = require("../models/User");

//Add Money to Wallet
router.post("/addMoneyToWallet", authMiddleware, async (req, res) => {
    try {
        const user_id = req.user.id; //Ensure user ID is extracted from JWT
        const { amount } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ success: false, data: { error: "Invalid amount" } });
        }

        console.log(`Looking for user with ID: ${user_id}`);

        
        const user = await User.findOne({ _id: user_id });

        if (!user) {
            console.error("User not found in DB:", user_id);
            return res.status(404).json({ success: false, data: { error: "User not found" } });
        }

        //Update user's wallet balance
        user.wallet_balance += amount;
        await user.save();

        return res.json({ success: true, data: null });

    } catch (error) {
        console.error("Error adding money to wallet:", error);
        return res.status(500).json({ success: false, data: { error: error.message } });
    }
});

router.get("/getWalletBalance", authMiddleware, async (req, res) => {
    try {
        const user_id = req.user.id; //Extract user ID from JWT

        console.log(`Fetching wallet balance for user ID: ${user_id}`);

        //Find user in the database
        const user = await User.findOne({ _id: user_id });

        if (!user) {
            console.error("User not found:", user_id);
            return res.status(404).json({ success: false, data: { error: "User not found" } });
        }

        console.log(`Wallet balance for user ${user_id}: $${user.wallet_balance}`);

        return res.json({ success: true, data: { balance: user.wallet_balance } });

    } catch (error) {
        console.error("Error fetching wallet balance:", error);
        return res.status(500).json({ success: false, data: { error: error.message } });
    }
});

 
    



router.get("/getWalletTransactions", authMiddleware, async (req, res) => {
    try {
        const user_id = req.user.id; // Get user ID from JWT token
        console.log(`Fetching wallet transactions for user: ${user_id}`);

        //Find wallet transactions for the user
        const walletTransactions = await Wallet.find({ user_id });

        if (!walletTransactions || walletTransactions.length === 0) {
            console.log("No wallet transactions found for user.");
            return res.json({ success: true, data: [] });
        }

        //Format the response correctly
        const formattedTransactions = walletTransactions.map(tx => ({
            wallet_tx_id: tx.wallet_tx_id,
            stock_tx_id: tx.stock_tx_id,
            is_debit: tx.is_debit,
            amount: tx.amount,
            time_stamp: tx.timestamp
        }));

        console.log(`Wallet Transactions found: ${formattedTransactions.length}`);

        return res.json({ success: true, data: formattedTransactions });

    } catch (error) {
        console.error("❌ Error fetching wallet transactions:", error);
        return res.status(500).json({ success: false, data: { error: error.message } });
    }
});




   


module.exports = router;
