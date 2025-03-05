const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const redisClient = require("../config/redis");
const amqp = require("amqplib");
const router = express.Router();

let rabbitConnection = null;
let rabbitChannel = null;
const QUEUE_NAME = "register_users";

async function connectRabbitMQ() {
    try {
        if (rabbitConnection && rabbitChannel) return; // Prevent multiple connections

        console.log("🔄 Connecting to RabbitMQ...");
        
        // ✅ Close old connection if it exists (avoids duplicate connections)
        if (rabbitConnection) {
            await rabbitConnection.close();
            rabbitConnection = null;
            rabbitChannel = null;
        }

        // ✅ Connect to RabbitMQ
        rabbitConnection = await amqp.connect("amqp://rabbitmq", {
            heartbeat: 60, // ✅ Prevents connection timeouts
            connectionTimeout: 30000 // ✅ Avoids premature failures
        });

        rabbitChannel = await rabbitConnection.createChannel();
        await rabbitChannel.assertQueue(QUEUE_NAME, { durable: true });

        // ✅ Enable fair dispatching to avoid overloading workers
        await rabbitChannel.prefetch(50);

        console.log("✅ RabbitMQ Connected & Queue Ready");

        // ✅ Handle connection failures gracefully
        rabbitConnection.on("close", () => {
            console.error("❌ RabbitMQ Connection Closed. Reconnecting...");
            rabbitConnection = null;
            rabbitChannel = null;
            setTimeout(connectRabbitMQ, 5000);
        });

        rabbitConnection.on("error", (err) => {
            console.error("❌ RabbitMQ Error:", err.message);
        });

    } catch (error) {
        console.error("❌ RabbitMQ Connection Failed:", error.message);
        setTimeout(connectRabbitMQ, 5000); // Retry on failure
    }
}

// ✅ Ensure RabbitMQ is connected on startup
connectRabbitMQ();

// ✅ Efficient Message Queuing Function
async function sendToQueue(userData) {
    if (!rabbitChannel) {
        console.error("⚠️ RabbitMQ channel not initialized! Retrying...");
        await connectRabbitMQ(); // Reconnect before retrying
        if (!rabbitChannel) {
            console.error("❌ RabbitMQ still unavailable after retry.");
            return false;
        }
    }

    try {
        rabbitChannel.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(userData)), { persistent: true });
        console.log("📤 User registration request queued:", userData.user_name);
        return true;
    } catch (error) {
        console.error("❌ Failed to send message:", error.message);
        return false;
    }
}

// 📌 **Register User API**
router.post("/register", async (req, res) => {
    try {
        const { user_name, password, name } = req.body;

        // ✅ Check Redis Cache First
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

        // ✅ Check if User Exists in DB Before Queuing
        const existingUser = await User.findOne({ user_name }).maxTimeMS(10000);
        if (existingUser) {
            try {
                await redisClient.set(`user:${user_name}`, "exists", "EX", 300);
            } catch (redisError) {
                console.error("⚠️ Redis Set Failed:", redisError.message);
            }
            return res.status(400).json({ success: false, error: "User already exists" });
        }

        // ✅ Queue the User Registration (Instead of Processing Immediately)
        const queued = await sendToQueue({ user_name, password, name });
        if (!queued) return res.status(500).json({ success: false, error: "Queueing failed" });

        return res.status(202).json({ success: true, message: "User registration in progress" });

    } catch (error) {
        console.error("❌ Registration Error:", error);
        return res.status(500).json({ success: false, error: "Server error" });
    }
});

async function processQueue() {
    try {
        console.log("🔄 Connecting Worker to RabbitMQ...");
        const connection = await amqp.connect("amqp://rabbitmq");
        const channel = await connection.createChannel();
        await channel.assertQueue(QUEUE_NAME, { durable: true });

        console.log("✅ RabbitMQ Worker Started: Listening for user registrations...");

        const NUM_WORKERS = 4; // ✅ Scale to multiple consumers
        channel.prefetch(NUM_WORKERS); // ✅ Process multiple messages in parallel

        channel.consume(
            QUEUE_NAME,
            async (msg) => {
                if (!msg) return;
                
                const { user_name, password, name } = JSON.parse(msg.content.toString());
                console.log(`👤 Processing user registration: ${user_name}`);

                try {
                    const hashedPassword = await bcrypt.hash(password, 10);
                    await new User({ user_name, password: hashedPassword, name }).save();
                    console.log(`✅ User ${user_name} registered successfully`);
                    channel.ack(msg); // ✅ Acknowledge message after processing
                } catch (error) {
                    console.error(`❌ Error registering user ${user_name}:`, error.message);
                    channel.nack(msg, false, true); // ❌ Retry failed messages
                }
            },
            { noAck: false }
        );
    } catch (error) {
        console.error("❌ RabbitMQ Worker Error:", error.message);
        setTimeout(processQueue, 5000); // Retry worker after 5s if it crashes
    }
}

// ✅ Start the Worker in Background
processQueue();

// 📌 **Login User API**
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
