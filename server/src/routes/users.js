const express = require("express");
const User = require("../models/User");
const router = express.Router();

// Fetch all users
router.get("/", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a new user
// router.post("/", async (req, res) => {
//     try {
//         const { user_id, username, email, password } = req.body;

//     // Check for missing fields
//     if (!user_id || !username || !email || !password) {
//       return res.status(400).json({
//         error: "Missing required fields: user_id, username, email, password",
//       });
//     }
//       const newUser = new User(req.body);
//       const savedUser = await newUser.save();
//       res.status(201).json(savedUser);
//     } catch (err) {
//       res.status(500).json({ error: err.message });
//     }
//   });

  // Create a new user with portfolio
router.post("/", async (req, res) => {
    const { user_id, username, email, password, portfolio } = req.body;
  
    // Validate required fields
    if (!user_id || !username || !email || !password) {
      return res.status(400).json({
        error: "Missing required fields: user_id, username, email, password",
      });
    }
    // Validate portfolio structure if provided
  if (portfolio) {
    const isPortfolioValid = portfolio.every((stock) =>
      stock.stock_id && stock.quantity && stock.average_price
    );
    if (!isPortfolioValid) {
      return res.status(400).json({
        error: "Invalid portfolio data. Each stock must have stock_id, quantity, and average_price.",
      });
    }
  }

  try {
    const newUser = new User({
      user_id,
      username,
      email,
      password,
      portfolio, // Optional: If no portfolio is provided, it defaults to an empty array
    });

    const savedUser = await newUser.save();
    res.status(201).json(savedUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
  

module.exports = router;
