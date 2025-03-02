const redis = require("redis");

const client = redis.createClient({
  socket: {
    host: process.env.REDIS_HOST || "redis", // 👈 Use 'redis' inside Docker
    port: process.env.REDIS_PORT || 6379,
  },
});

client.on("connect", () => console.log("✅ Redis Connected"));
client.on("error", (err) => console.error("❌ Redis Error:", err));

(async () => {
  try {
    await client.connect(); // Required for Redis v4+
  } catch (error) {
    console.error("❌ Redis Connection Failed:", error);
  }
})();

module.exports = client;