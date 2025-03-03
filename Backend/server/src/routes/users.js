const express = require("express");
const { getChannel } = require("../utils/rabbitmq");
const User = require("../models/User");
const PendingRequest = require("../models/PendingRequest");
const router = express.Router();

// Function to wait for request completion
const waitForRequestCompletion = async (user_name) => {
    let attempts = 0;
    while (attempts < 10) { // Try for 5 seconds
        const request = await PendingRequest.findOne({ user_name });
        const userExists = await User.findOne({ user_name });

        if (request && request.status === "completed" && userExists) return true;
        if (request && request.status === "failed") return false;

        await new Promise(resolve => setTimeout(resolve, 500)); // Wait 0.5s
        attempts++;
    }
    return false;
};

// ✅ Register user
router.post("/register", async (req, res) => {
    try {
        const { user_name } = req.body;
        const channel = getChannel();
        if (!channel) return res.status(500).json({ success: false, error: "RabbitMQ not connected" });

        const existingUser = await User.findOne({ user_name });
        if (existingUser) {
            return res.status(400).json({ success: false, error: "User already exists" });
        }

        await PendingRequest.findOneAndUpdate({ user_name }, { status: "pending" }, { upsert: true });
        await channel.sendToQueue("user_registration", Buffer.from(JSON.stringify([req.body])));

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

// ✅ Login user
router.post("/login", async (req, res) => {
    try {
        const { user_name } = req.body;
        const channel = getChannel();
        if (!channel) return res.status(500).json({ success: false, error: "RabbitMQ not connected" });

        await PendingRequest.findOneAndUpdate({ user_name }, { status: "pending" }, { upsert: true });
        await channel.sendToQueue("user_login", Buffer.from(JSON.stringify(req.body)));

        const success = await waitForRequestCompletion(user_name);
        if (!success) {
            return res.status(400).json({ success: false, error: "Invalid credentials or user not ready" });
        }

        const user = await User.findOne({ user_name }).select("jwt_token");
        if (!user || !user.jwt_token) {
            return res.status(500).json({ success: false, error: "Token generation failed" });
        }

        return res.status(200).json({ success: true, data: { token: user.jwt_token } });

    } catch (error) {
        console.error("❌ Login Error:", error);
        return res.status(500).json({ success: false, error: "Server error" });
    }
});

module.exports = router;
