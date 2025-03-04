const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const redisClient = require("../config/redis");
const router = express.Router();


// Ensure user_name is indexed in MongoDB
(async () => {
    await User.createIndexes({ user_name: 1 }, { unique: true });
    console.log("✅ User Index Created");
})();


// Register a new user
router.post("/register", async (req, res) => {
    try {
        const { user_name, password, name } = req.body;

        let isCached = false;
        try {
            const cachedUser = await redisClient.get(`user:${user_name}`);
            if (cachedUser) isCached = true;
        } catch (redisError) {
            console.error("⚠️ Redis Lookup Failed:", redisError.message);
        }

        if (isCached) {
            return res.status(400).json({ success: false, error: "User already exists (cached)" });
        }

        const existingUser = await User.findOne({ user_name }).maxTimeMS(10000); // ✅ Increased from 3000 to 10000
        if (existingUser) {
            try {
                await redisClient.set(`user:${user_name}`, "exists", "EX", 300);
            } catch (redisError) {
                console.error("⚠️ Redis Set Failed:", redisError.message);
            }
            return res.status(400).json({ success: false, error: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ user_name, password: hashedPassword, name });

        await newUser.save();
        return res.status(201).json({ success: true, message: "User registered successfully" });

    } catch (error) {
        console.error("❌ Registration Error:", error);
        return res.status(500).json({ success: false, error: "Server error" });
    }
});


// Login user (Ensure it's optimized for multi-threading)
router.post("/login", async (req, res) => {
    try {
        const { user_name, password } = req.body;
        const user = await User.findOne({ user_name });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ success: false, error: "Invalid credentials" });
        }

        const token = jwt.sign(
            { id: user._id.toString(), user_name: user.user_name },
            process.env.JWT_SECRET || "your_secret",
            { expiresIn: "1h" }
        );

        user.jwt_token = token;
        await user.save();

        return res.json({ success: true, data: { token } });

    } catch (error) {
        console.error("❌ Login Error:", error);
        return res.status(500).json({ success: false, error: "Server error" });
    }
});

module.exports = router;
