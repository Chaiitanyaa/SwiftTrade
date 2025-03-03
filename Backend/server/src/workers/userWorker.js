const amqp = require("amqplib");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/User"); // ✅ Ensure correct import

const RABBITMQ_URL = "amqp://rabbitmq";
const MONGO_URI = "mongodb://mongo:27017/tradingDB"; // ✅ Ensure MongoDB connection

const connectMongoDB = async () => {
    try {
        await mongoose.connect(MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("✅ Worker connected to MongoDB");
    } catch (error) {
        console.error("❌ MongoDB Connection Error:", error);
        setTimeout(connectMongoDB, 5000); // ✅ Retry connection every 5 sec
    }
};

// Start MongoDB connection before processing messages
connectMongoDB();

const connectRabbitMQ = async () => {
    try {
        const connection = await amqp.connect(RABBITMQ_URL);
        const channel = await connection.createChannel();

        await channel.assertQueue("user_registration", { durable: true });
        await channel.assertQueue("user_login", { durable: true });

        console.log("🔄 Worker listening for messages...");

        // Process Registration
        channel.consume("user_registration", async (msg) => {
            if (mongoose.connection.readyState !== 1) {
                console.error("❌ MongoDB is not connected, skipping user registration");
                return;
            }

            const { user_name, password, name } = JSON.parse(msg.content.toString());

            try {
                const existingUser = await User.findOne({ user_name }).exec();
                if (existingUser) {
                    console.log("⚠️ User already exists:", user_name);
                    return; // ❌ Stop processing if user already exists
                }

                const hashedPassword = await bcrypt.hash(password, 10);
                const newUser = new User({ user_name, password: hashedPassword, name });

                await newUser.save();
                console.log("✅ User Registered:", user_name);

            } catch (error) {
                console.error("❌ Registration Error:", error);
            }

            channel.ack(msg);
        });

        // Process Login
        channel.consume("user_login", async (msg) => {
            if (mongoose.connection.readyState !== 1) {
                console.error("❌ MongoDB is not connected, skipping user login");
                return;
            }

            const { user_name, password } = JSON.parse(msg.content.toString());

            try {
                const user = await User.findOne({ user_name }).exec();

                if (!user || !(await bcrypt.compare(password, user.password))) {
                    console.log("⚠️ Invalid credentials for:", user_name);
                    return; // ❌ Stop processing if login fails
                }

                const token = jwt.sign(
                    { id: user._id.toString(), user_name: user.user_name },
                    process.env.JWT_SECRET || "your_secret",
                    { expiresIn: "1h" }
                );

                user.jwt_token = token;
                await user.save();
                console.log("✅ User Logged In:", user_name, "Token:", token);

            } catch (error) {
                console.error("❌ Login Error:", error);
            }

            channel.ack(msg);
        });

    } catch (error) {
        console.error("❌ RabbitMQ Connection Error:", error);
        setTimeout(connectRabbitMQ, 5000); // ✅ Retry connection every 5 seconds
    }
};

connectRabbitMQ();
