const app = require("./app");
const connectDB = require("./config/db");

require("dotenv").config(); // Load environment variables

connectDB();

const PORT = process.env.PORT || 3001; // Changed from default 5000 to 3001

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
