const mongoose = require("mongoose");

const PendingRequestSchema = new mongoose.Schema({
    user_name: { type: String, required: true, unique: true },
    status: { type: String, enum: ["pending", "completed", "failed"], default: "pending" }
});

module.exports = mongoose.model("PendingRequest", PendingRequestSchema);
