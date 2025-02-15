const express = require("express");
const authenticateToken = require("../middleware/authMiddleware"); // ✅ Import this!
const Wallet = require("../models/Wallet");
const { v4: uuidv4 } = require("uuid");
const router = express.Router();

// ✅ Add money to wallet
//router.post("/addMoneyToWallet", authenticateToken, async (req, res) => 
    


//router.get("/getWalletBalance", authenticateToken, async (req, res) => 
 
    



//router.get("/getWalletTransactions", authenticateToken, async (req, res) => 
   


module.exports = router;
