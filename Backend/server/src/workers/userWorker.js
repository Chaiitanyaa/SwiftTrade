const amqp = require("amqplib");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/User");
const PendingRequest = require("../models/PendingRequest");

const RABBITMQ_URL = "amqp://rabbitmq";
const MONGO_URI = "mongodb://mongo:27017/tradingDB";
const JWT_SECRET = "your_secret"; // ✅ Ensure consistency

// Connect to MongoDB
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

// Connect to RabbitMQ
const connectRabbitMQ = async () => {
    try {
        const connection = await amqp.connect(RABBITMQ_URL);
        const channel = await connection.createChannel();

        await channel.assertQueue("user_registration", { durable: true });
        await channel.assertQueue("user_login", { durable: true });

        console.log("🔄 Worker listening for messages...");
        channel.prefetch(5); // ✅ Process multiple messages in parallel

        // ✅ Registration handling
        channel.consume("user_registration", async (msg) => {
            if (!msg || !msg.content) {
                console.error("⚠️ Received empty registration message, skipping...");
                return channel.ack(msg);
            }

            let users;
            try {
                users = JSON.parse(msg.content.toString());
                if (!Array.isArray(users)) users = [users]; // Convert to array if needed
            } catch (error) {
                console.error("❌ Error parsing registration message:", error);
                return channel.ack(msg);
            }

            try {
                // Convert users into bulk operations
                const bulkOps = users.map(user => ({
                    updateOne: {
                        filter: { user_name: user.user_name },
                        update: { 
                            $setOnInsert: { 
                                user_name: user.user_name, 
                                password: bcrypt.hashSync(user.password, 10), 
                                name: user.name 
                            } 
                        },
                        upsert: true,
                    }
                }));

                // Execute bulk write
                const result = await User.bulkWrite(bulkOps);
                console.log(`✅ Bulk inserted ${result.nUpserted} users`);

                // ✅ Mark pending requests as completed
                await PendingRequest.updateMany(
                    { user_name: { $in: users.map(user => user.user_name) } }, 
                    { status: "completed" }
                );

            } catch (error) {
                console.error("❌ Bulk Registration Error:", error);
                await PendingRequest.updateMany(
                    { user_name: { $in: users.map(user => user.user_name) } }, 
                    { status: "failed" }
                );
            }

            channel.ack(msg);
        });

        // ✅ Login handling
        channel.consume("user_login", async (msg) => {
            if (!msg || !msg.content) {
                console.error("⚠️ Received empty login message, skipping...");
                return channel.ack(msg);
            }

            let userLogin;
            try {
                userLogin = JSON.parse(msg.content.toString());
            } catch (error) {
                console.error("❌ Error parsing login message:", error);
                return channel.ack(msg);
            }

            try {
                const user = await User.findOne({ user_name: userLogin.user_name });
                if (!user || !(await bcrypt.compare(userLogin.password, user.password))) {
                    await PendingRequest.findOneAndUpdate({ user_name: userLogin.user_name }, { status: "failed" });
                    return channel.ack(msg);
                }

                const token = jwt.sign({ id: user._id, user_name: user.user_name }, JWT_SECRET, { expiresIn: "1h" });
                await User.updateOne({ user_name: userLogin.user_name }, { jwt_token: token });

                await PendingRequest.findOneAndUpdate({ user_name: userLogin.user_name }, { status: "completed" });

            } catch (error) {
                console.error("❌ Login Error:", error);
                await PendingRequest.findOneAndUpdate({ user_name: userLogin.user_name }, { status: "failed" });
            }

            channel.ack(msg);
        });

    } catch (error) {
        console.error("❌ RabbitMQ Connection Error:", error);
        setTimeout(connectRabbitMQ, 5000);
    }
};
connectRabbitMQ();
