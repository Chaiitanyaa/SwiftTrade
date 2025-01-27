const app = require("./app"); //points to app.js
const connectDB = require("./config/db");

require("dotenv").config(); //loads environment variables

connectDB();

// Port setup
const PORT = process.env.PORT || 5000;

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});