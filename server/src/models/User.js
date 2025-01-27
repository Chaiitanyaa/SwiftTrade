const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  user_id: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  portfolio: [
    {
      stock_id: { type: String },
      quantity: { type: Number },
      average_price: { type: Number },
    },
  ],
});

module.exports = mongoose.model("User", UserSchema);
