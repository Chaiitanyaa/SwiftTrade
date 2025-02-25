const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const router = express.Router();

// Register a new user
router.post("/register", async (req, res) => {
    try {
        const { user_name, password, name } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ user_name });
        if (existingUser) {
            return res.status(400).json({ success: false, error: "User already exists" });
        }

        // Hash password before storing
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ user_name, password: hashedPassword, name });

        await newUser.save();
        return res.status(201).json({ success: true, data: null });

    } catch (error) {
        console.error("Registration Error:", error);
        return res.status(500).json({ success: false, error: "Server error" });
    }
});

// Login user
router.post("/login", async (req, res) => {
    try {
        const { user_name, password } = req.body;
        const user = await User.findOne({ user_name });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ success: false, error: "Invalid credentials" });
        }

        const token = jwt.sign(
            { id: user._id.toString(), user_name: user.user_name },
            process.env.JWT_SECRET || "your_secret",
            { expiresIn: "1h" }
        );

        user.jwt_token = token;
        await user.save();

        return res.json({ 
            success: true, 
            data: { token }  
        });

    } catch (error) {
        console.error("Login Error:", error);
        return res.status(500).json({ success: false, error: "Server error" });
    }
});

// Get current user profile
router.get("/profile", async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res.status(400).json({ success: false, error: "Unauthorized" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || "your_secret");
        const user = await User.findById(decoded.id).select("-password");

        if (!user || user.jwt_token !== token) {
            return res.status(404).json({ success: false, error: "User not found/Invaliv or expired token" });
        }

        return res.json({ success: true, user });
    } catch (error) {
        return res.status(500).json({ success: false, error: "Server error" });
    }
});

// router.post("/logout", async (req, res) => {
//     try {
//         const token = req.headers.authorization?.split(" ")[1];
//         if (!token) {
//             return res.status(401).json({ success: false, error: "Unauthorized" });
//         }

//         // Decode token
//         const decoded = jwt.verify(token, process.env.JWT_SECRET || "your_secret");

//         // Find user and remove their stored token
//         const user = await User.findById(decoded.id);
//         if (!user) {
//             return res.status(404).json({ success: false, error: "User not found" });
//         }

//         user.jwt_token = ""; // Remove stored token
//         await user.save();

//         return res.json({ success: true, message: "User logged out successfully" });
//     } catch (error) {
//         return res.status(500).json({ success: false, error: "Server error" });
//     }
// });


module.exports = router;


