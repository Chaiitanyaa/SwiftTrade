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
const stocksRoute = require("./routes/stocks");
app.use("/setup", stocksRoute);

app.get("/", (req, res) => res.send("Stock Service is running!"));

const PORT = process.env.PORT || 5005;
app.listen(PORT, () => console.log(`Stock Service running on port ${PORT}`));
