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
const usersRoute = require("./routes/users");
app.use("/authentication", usersRoute);

app.get("/", (req, res) => res.send("User Service is running!"));

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`User Service running on port ${PORT}`));
