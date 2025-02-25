const mongoose = require("mongoose");
require("dotenv").config(); // Load environment variables from .env

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || "mongodb://mongo:27017/swifttrade", {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log("MongoDB connected successfully");
    } catch (error) {
        console.error("MongoDB connection error:", error);
        process.exit(1); // Exit process with failure
    }
};

module.exports = connectDB;
