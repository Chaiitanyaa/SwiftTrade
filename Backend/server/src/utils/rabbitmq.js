const amqp = require("amqplib");

let channel, connection;
const RABBITMQ_URL = "amqp://rabbitmq"; // ✅ Use service name from Docker Compose

const connectRabbitMQ = async () => {
    try {
        connection = await amqp.connect(RABBITMQ_URL);
        channel = await connection.createChannel();
        console.log("✅ Connected to RabbitMQ");

        await channel.assertQueue("user_registration", { durable: true });
        await channel.assertQueue("user_login", { durable: true });
    } catch (error) {
        console.error("❌ RabbitMQ Connection Error:", error);
        setTimeout(connectRabbitMQ, 5000); // ✅ Retry connection every 5 sec
    }
};

const getChannel = () => channel;

connectRabbitMQ(); // ✅ Auto-start connection

module.exports = { getChannel };
