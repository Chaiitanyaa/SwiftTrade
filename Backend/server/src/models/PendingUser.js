const mongoose = require("mongoose");

const PendingUserSchema = new mongoose.Schema({
    user_name: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
});

module.exports = mongoose.model("PendingUser", PendingUserSchema);
