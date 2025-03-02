const express = require("express");
const bodyParser = require("body-parser");
const matchingEngine = require("./matchingEngine");

const app = express();
app.use(bodyParser.json());

app.get("/", (req, res) => {
    res.json({ message: "Matching Engine is running!" });
});

app.post("/processOrder", async (req, res) => {
    try {
        const order = req.body;
        if (!order || !order.stock_id || !order.user_id || !order.quantity) {
            return res.status(400).json({ message: "Invalid order format" });
        }

        const result = matchingEngine.processOrder(order);
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: "Error processing order", error: error.message });
    }
});

const PORT = process.env.PORT || 3006;
app.listen(PORT, () => {
    console.log(`Matching Engine running on port ${PORT}`);
});
