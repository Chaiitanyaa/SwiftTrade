const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const Transaction = require("../models/Transaction");
const Stock = require("../models/Stock");
const Wallet = require("../models/Wallet");
const { v4: uuidv4 } = require("uuid");
const User = require("../models/User");
const router = express.Router();
const UserPortfolio = require("../models/UserPortfolio");
const fetch = require("node-fetch"); // 🔹 Required for external API calls
const MATCHING_ENGINE_URL = "http://matching:5000/api/createOrder";



//router.get("/getStockTransactions", authMiddleware, async (req, res) => 
    




//router.post("/placeStockOrder", authMiddleware, async (req, res) => 
    

//router.post("/cancelStockTransaction", authMiddleware, async (req, res) => 
    






module.exports = router;