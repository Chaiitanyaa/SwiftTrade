const express = require("express");
const { getChannel } = require("../utils/rabbitmq");
const User = require("../models/User");
const PendingRequest = require("../models/PendingRequest");
const router = express.Router();

// Function to wait for request completion
const waitForRequestCompletion = async (user_name) => {
    let attempts = 0;
    while (attempts < 15) { // ✅ Check for 15 seconds
        const request = await PendingRequest.findOne({ user_name });
        if (request && request.status === "completed") return true; // ✅ Successfully processed
        if (request && request.status === "failed") return false; // ❌ Failed processing
        await new Promise(resolve => setTimeout(resolve, 1000)); // ✅ Wait 1 sec
        attempts++;
    }
    return false; // ❌ Timed out
};

// Register user
router.post("/register", async (req, res) => {
    try {
        const { user_name } = req.body;
        const channel = getChannel();
        if (!channel) return res.status(500).json({ success: false, error: "RabbitMQ not connected" });

        // ✅ Check if user already exists before sending to RabbitMQ
        const existingUser = await User.findOne({ user_name });
        if (existingUser) {
            return res.status(400).json({ success: false, error: "User already exists" });
        }

        // ✅ Mark request as pending in MongoDB
        await PendingRequest.findOneAndUpdate(
            { user_name },
            { status: "pending" },
            { upsert: true }
        );

        await channel.sendToQueue("user_registration", Buffer.from(JSON.stringify(req.body)));

        // ✅ Wait until request is marked as "completed" or "failed"
        const success = await waitForRequestCompletion(user_name);
        if (!success) {
            return res.status(500).json({ success: false, error: "Registration failed" });
        }

        return res.status(201).json({ success: true, data: null });

    } catch (error) {
        console.error("❌ Registration Error:", error);
        return res.status(500).json({ success: false, error: "Server error" });
    }
});

// Login user
router.post("/login", async (req, res) => {
    try {
        const { user_name } = req.body;
        const channel = getChannel();
        if (!channel) return res.status(500).json({ success: false, error: "RabbitMQ not connected" });

        await PendingRequest.findOneAndUpdate(
            { user_name },
            { status: "pending" },
            { upsert: true }
        );

        await channel.sendToQueue("user_login", Buffer.from(JSON.stringify(req.body)));

        // ✅ Wait until login is completed
        const success = await waitForRequestCompletion(user_name);
        if (!success) {
            return res.status(400).json({ success: false, error: "Invalid credentials" });
        }

        const user = await User.findOne({ user_name }).select("jwt_token");
        return res.status(200).json({ success: true, data: { token: user.jwt_token } }); // ✅ Correct token format

    } catch (error) {
        console.error("❌ Login Error:", error);
        return res.status(500).json({ success: false, error: "Server error" });
    }
});

module.exports = router;
