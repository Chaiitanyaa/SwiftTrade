const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || "mongodb://mongo:27017/tradingDB", {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            maxPoolSize: 50,
            socketTimeoutMS: 45000,
            serverSelectionTimeoutMS: 5000,
        });
        console.log("✅ MongoDB Connected");
    } catch (err) {
        console.error("❌ MongoDB Connection Error:", err.message);
        setTimeout(connectDB, 5000); // Retry every 5 seconds
    }
};

module.exports = connectDB;
