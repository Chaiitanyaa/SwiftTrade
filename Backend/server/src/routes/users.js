const express = require("express");
const { getChannel } = require("../utils/rabbitmq"); // ✅ RabbitMQ Connection
const User = require("../models/User"); // ✅ MongoDB Model
const router = express.Router();

// Function to wait until user registration completes
const waitForUserCreation = async (user_name) => {
    let attempts = 0;
    while (attempts < 10) { // ✅ Check for 10 seconds
        const user = await User.findOne({ user_name });
        if (user) return user; // ✅ Return the created user
        await new Promise(resolve => setTimeout(resolve, 1000)); // ✅ Wait 1 sec
        attempts++;
    }
    return null; // ❌ User not found after 10 attempts
};

// Function to wait until login attempt succeeds
const waitForLoginToken = async (user_name) => {
    let attempts = 0;
    while (attempts < 10) {
        const user = await User.findOne({ user_name }).select("jwt_token");
        if (user && user.jwt_token) {
            return user.jwt_token; // ✅ Return token if available
        }
        await new Promise(resolve => setTimeout(resolve, 1000)); // ✅ Wait 1 sec
        attempts++;
    }
    return null; // ❌ Login failed after 10 attempts
};

// Register user (Sends to RabbitMQ, then checks DB)
router.post("/register", async (req, res) => {
    try {
        const { user_name } = req.body;
        const channel = getChannel();
        if (!channel) return res.status(500).json({ success: false, error: "RabbitMQ not connected" });

        await channel.sendToQueue("user_registration", Buffer.from(JSON.stringify(req.body)));

        // ✅ Wait until user is created in DB
        const user = await waitForUserCreation(user_name);
        if (!user) {
            return res.status(400).json({ success: false, error: "User already exists" });
        }

        return res.status(201).json({ success: true, data: null });

    } catch (error) {
        console.error("❌ Registration Error:", error);
        return res.status(500).json({ success: false, error: "Server error" });
    }
});

// Login user (Sends to RabbitMQ, then checks DB)
router.post("/login", async (req, res) => {
    try {
        const { user_name } = req.body;
        const channel = getChannel();
        if (!channel) return res.status(500).json({ success: false, error: "RabbitMQ not connected" });

        await channel.sendToQueue("user_login", Buffer.from(JSON.stringify(req.body)));

        // ✅ Wait until user gets a JWT token
        const token = await waitForLoginToken(user_name);
        if (!token) {
            return res.status(400).json({ success: false, error: "Invalid credentials" });
        }

        return res.status(200).json({ success: true, data: { token } });

    } catch (error) {
        console.error("❌ Login Error:", error);
        return res.status(500).json({ success: false, error: "Server error" });
    }
});

module.exports = router;
