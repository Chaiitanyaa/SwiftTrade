const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

app.get("/", (req, res) => res.send("Matching Engine Service is running!"));

// Order Matching Logic (FIFO)
const matchOrders = () => {
    console.log("🔄 Matching buy/sell orders...");
};
setInterval(matchOrders, 5000); // Runs every 5 seconds

const PORT = process.env.PORT || 5003;
app.listen(PORT, () => console.log(`Matching Engine running on port ${PORT}`));
