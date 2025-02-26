// const express = require("express");
// const Wallet = require("../models/Wallet");
// const { v4: uuidv4 } = require("uuid");
// const router = express.Router();
// const authMiddleware = require("../middleware/authMiddleware");
// // const User = require("../../services/user_service/src/models/User");
// const axios = require("axios");


// // ✅ Add Money to Wallet
// router.post("/addMoneyToWallet", authMiddleware, async (req, res) => {
//     try {
//         const user_id = req.user.id; // ✅ Ensure user ID is extracted from JWT
//         const { amount } = req.body;

//         if (!amount || amount <= 0) {
//             return res.status(400).json({ success: false, data: { error: "Invalid amount" } });
//         }

//         console.log(`🔍 Looking for user with ID: ${user_id}`);

//         // 🔹 Check correct field in database (try `_id` or `id`)
//         const user = await User.findOne({ _id: user_id });

//         if (!user) {
//             console.error("User not found in DB:", user_id);
//             return res.status(404).json({ success: false, data: { error: "User not found" } });
//         }

//         // 🔹 Update user's wallet balance
//         user.wallet_balance += amount;
//         await user.save();

//         return res.json({ success: true, data: null });

//     } catch (error) {
//         console.error("Error adding money to wallet:", error);
//         return res.status(500).json({ success: false, data: { error: error.message } });
//     }
// });

// router.get("/getWalletBalance", authMiddleware, async (req, res) => {
//     try {
//         const user_id = req.user.id; // ✅ Extract user ID from JWT

//         console.log(`🔍 Fetching wallet balance for user ID: ${user_id}`);

//         // 🔹 Find user in the database
//         const user = await User.findOne({ _id: user_id });

//         if (!user) {
//             console.error("❌ User not found:", user_id);
//             return res.status(404).json({ success: false, data: { error: "User not found" } });
//         }

//         console.log(`✅ Wallet balance for user ${user_id}: $${user.wallet_balance}`);

//         return res.json({ success: true, data: { wallet_balance: user.wallet_balance } });

//     } catch (error) {
//         console.error("❌ Error fetching wallet balance:", error);
//         return res.status(500).json({ success: false, data: { error: error.message } });
//     }
// });






// //router.get("/getWalletTransactions", authenticateToken, async (req, res) => 



// module.exports = router;
const express = require("express");
const Wallet = require("../models/Wallet");
const { v4: uuidv4 } = require("uuid");
const axios = require("axios");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

router.post("/addMoneyToWallet", authMiddleware, async (req, res) => {
    try {
        const user_id = req.user.id;
        const { amount } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ success: false, data: { error: "Invalid amount" } });
        }

        console.log(`🔍 Looking for user with ID: ${user_id}`);

        const userResponse = await axios.get(`http://user_service:5001/api/users/${user_id}`);
        const user = userResponse.data;

        if (!user) {
            console.error("User not found in `user_service`:", user_id);
            return res.status(404).json({ success: false, data: { error: "User not found" } });
        }

        // 🔹 Update user's wallet balance in `wallet_service` DB
        let wallet = await Wallet.findOne({ userId: user_id });

        if (!wallet) {
            wallet = new Wallet({ userId: user_id, balance: 0 });
        }

        wallet.balance += amount;
        await wallet.save();

        return res.json({ success: true, data: { balance: wallet.balance } });

    } catch (error) {
        console.error("Error adding money to wallet:", error);
        return res.status(500).json({ success: false, data: { error: error.message } });
    }
});

router.get("/getWalletBalance", authMiddleware, async (req, res) => {
    try {
        const user_id = req.user.id;
        console.log(`🔍 Fetching wallet balance for user ID: ${user_id}`);

        let wallet = await Wallet.findOne({ userId: user_id });

        if (!wallet) {
            return res.status(404).json({ success: false, data: { error: "Wallet not found" } });
        }

        console.log(`Wallet balance for user ${user_id}: $${wallet.balance}`);

        return res.json({ success: true, data: { wallet_balance: wallet.balance } });

    } catch (error) {
        console.error("Error fetching wallet balance:", error);
        return res.status(500).json({ success: false, data: { error: error.message } });
    }
});

module.exports = router;
