const amqp = require("amqplib");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/User");
const PendingRequest = require("../models/PendingRequest");

const RABBITMQ_URL = "amqp://rabbitmq";
const MONGO_URI = "mongodb://mongo:27017/tradingDB"; 

const connectMongoDB = async () => {
    try {
        await mongoose.connect(MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("✅ Worker connected to MongoDB");
    } catch (error) {
        console.error("❌ MongoDB Connection Error:", error);
        setTimeout(connectMongoDB, 5000);
    }
};

connectMongoDB();

const connectRabbitMQ = async () => {
    try {
        const connection = await amqp.connect(RABBITMQ_URL);
        const channel = await connection.createChannel();

        await channel.assertQueue("user_registration", { durable: true });
        await channel.assertQueue("user_login", { durable: true });

        console.log("🔄 Worker listening for messages...");

        channel.consume("user_registration", async (msg) => {
            const { user_name, password, name } = JSON.parse(msg.content.toString());
            try {
                const existingUser = await User.findOne({ user_name }).exec();
                if (existingUser) {
                    await PendingRequest.findOneAndUpdate({ user_name }, { status: "failed" });
                    return;
                }

                const hashedPassword = await bcrypt.hash(password, 10);
                await new User({ user_name, password: hashedPassword, name }).save();
                await PendingRequest.findOneAndUpdate({ user_name }, { status: "completed" });

            } catch (error) {
                console.error("❌ Registration Error:", error);
                await PendingRequest.findOneAndUpdate({ user_name }, { status: "failed" });
            }

            channel.ack(msg);
        });

        channel.consume("user_login", async (msg) => {
            const { user_name, password } = JSON.parse(msg.content.toString());
            try {
                const user = await User.findOne({ user_name }).exec();
                if (!user || !(await bcrypt.compare(password, user.password))) {
                    await PendingRequest.findOneAndUpdate({ user_name }, { status: "failed" });
                    return;
                }

                user.jwt_token = jwt.sign({ id: user._id }, "secret", { expiresIn: "1h" });
                await user.save();
                await PendingRequest.findOneAndUpdate({ user_name }, { status: "completed" });

            } catch (error) {
                await PendingRequest.findOneAndUpdate({ user_name }, { status: "failed" });
            }

            channel.ack(msg);
        });

    } catch (error) {
        setTimeout(connectRabbitMQ, 5000);
    }
};

connectRabbitMQ();
