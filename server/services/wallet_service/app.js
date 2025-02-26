const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

dotenv.config();
const app = express();

app.use(express.json());
app.use(cors());

// Connect to MongoDB
connectDB();

// Routes
const walletRoutes = require("./routes/wallets");
app.use("/wallet", walletRoutes);

app.get("/", (req, res) => res.send("Wallet Service is running!"));

const PORT = process.env.PORT || 5004;
app.listen(PORT, () => console.log(`Wallet Service running on port ${PORT}`));
