const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid"); //Import UUID to generate unique IDs

const UserSchema = new mongoose.Schema({
  user_id: { type: String, unique: true, default: uuidv4 }, // Ensures a unique user_id
  user_name: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true, default: "unknown user" },
  jwt_token: { type: String, default: "" },
  wallet_balance: { type: Number, default: 0 }
});

module.exports = mongoose.model("User", UserSchema);
