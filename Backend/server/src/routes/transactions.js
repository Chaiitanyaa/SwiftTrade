// src/routes/transactions.js
const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const MatchingEngine = require("../matchingEngine/matchingEngine");
const Transaction = require("../models/Transaction");
const { v4: uuidv4 } = require("uuid");
const Stock = require("../models/Stock"); 
const router = express.Router();
const Wallet = require("../models/Wallet");
const UserPortfolio = require("../models/UserPortfolio");
const User = require("../models/User");
const engine = require("../matchingEngine/matchingEngine.js");
const client = require("../config/redis"); 

router.post("/placeStockOrder", authMiddleware, async (req, res) => {
    console.log("Received order:", req.body);

    const user_id = req.user.id;
    const current_user_id = user_id;
    let { stock_id, is_buy, order_type, quantity, price } = req.body;

    if (!stock_id || typeof is_buy !== "boolean" || !order_type || !quantity) {
        console.error("Missing required fields:", { stock_id, user_id, is_buy, order_type, quantity, price });
        return res.status(400).json({ error: "Missing required fields" });
    }

    try {
        const stock = await Stock.findOne({ stock_id: stock_id.toString() });
        if (!stock) {
            return res.status(404).json({ success: false, data: { error: "Stock not found" } });
        }

        const user = await User.findOne({ _id: user_id });
        if (!user) {
            return res.status(404).json({ success: false, data: { error: "User not found" } });
        }

        let allTransactions = [];

        // --- SELL ORDER Handling (Deduct stocks from UserPortfolio) ---
        if (!is_buy) {
            console.log("Processing SELL Order...");

            const userPortfolio = await UserPortfolio.findOne({ userid: user_id, stock_id: stock_id.toString() });

            console.log(`Checking UserPortfolio for user: ${user_id}, stock: ${stock_id}`);
            console.log(`User Portfolio Data:`, userPortfolio);

            if (!userPortfolio || userPortfolio.quantity_owned < quantity) {
                console.error(`Not enough stocks to sell. Owned: ${userPortfolio ? userPortfolio.quantity_owned : 0}, Required: ${quantity}`);
                return res.status(400).json({ success: false, data: { error: "Not enough stocks to sell" } });
            }

            // Log Sell Order in Transactions
            const initialSellTransaction = new Transaction({
                stock_tx_id: uuidv4(),
                stock_id,
                wallet_tx_id: null,
                order_status: "IN_PROGRESS",
                parent_stock_tx_id: null,
                is_buy: false,
                order_type,
                stock_price: order_type === "MARKET" ? 0 : price,
                quantity,
                time_stamp: new Date(),
                buyer_id: null,
                seller_id: user_id,
            });

            await initialSellTransaction.save();
            allTransactions.push(initialSellTransaction);
            console.log("Initial Sell Order logged in Transactions DB:", initialSellTransaction);

            // Send Sell Order to Redis-backed Matching Engine
            const sellOrder = {
                id: initialSellTransaction.stock_tx_id,
                stock_id,
                user_id,
                is_buy: false,
                order_type,
                quantity,
                price: order_type === "MARKET" ? 0 : price,
            };

            await engine.placeOrder(sellOrder);
        }

        // --- BUY ORDER Handling ---
        if (is_buy) {
            console.log("Processing MARKET Buy Order...");

            let sellOrders = engine.orderBook.sellOrders.filter(order => 
                order.stock_id === stock_id && order.user_id !== user_id
            );

            if (!sellOrders.length) {
                console.warn("No sell orders available for this stock.");
                return res.status(400).json({ success: false, data: { error: "No available sell orders for this stock." } });
            }

            // Check if total available quantity is enough
            let totalAvailable = sellOrders.reduce((sum, order) => sum + order.quantity, 0);
            if (totalAvailable < quantity) {
                console.warn(`Not enough stocks available for this buy order. Requested: ${quantity}, Available: ${totalAvailable}`);
                return res.status(400).json({ success: false, data: { error: "Not enough stocks available for this order." } });
            }

            let remainingQuantity = quantity;
            let totalCost = 0;

            let user = await User.findById(user_id);
            if (!user) {
                console.error(`User not found: ${user_id}`);
                return res.status(400).json({ success: false, data: { error: "User not found" } });
            }

            console.log(`User found: ${user.user_name} (Balance: ${user.wallet_balance})`);

            for (const sellOrder of sellOrders) {
                if (remainingQuantity <= 0) break;

                const matchQuantity = Math.min(remainingQuantity, sellOrder.quantity);
                const matchPrice = sellOrder.price;
                totalCost += matchQuantity * matchPrice;

                if (user.wallet_balance < totalCost) {
                    console.error("Insufficient funds.");
                    return res.status(400).json({ success: false, data: { error: "Insufficient funds in wallet." } });
                }

                user.wallet_balance -= matchQuantity * matchPrice;
                await user.save();
                console.log(`Wallet Updated: New Balance: ${user.wallet_balance}`);

                // Create BUY Transaction
                const buyTransaction = new Transaction({
                    stock_tx_id: uuidv4(),
                    stock_id,
                    wallet_tx_id: uuidv4(),
                    order_status: "COMPLETED",
                    parent_stock_tx_id: sellOrder.id,
                    is_buy: true,
                    order_type,
                    stock_price: matchPrice,
                    quantity: matchQuantity,
                    time_stamp: new Date(),
                    buyer_id: user_id,
                    seller_id: sellOrder.user_id,
                });

                await buyTransaction.save();
                allTransactions.push(buyTransaction);

                // Create SELL Transaction
                const sellTransaction = new Transaction({
                    stock_tx_id: uuidv4(),
                    stock_id,
                    wallet_tx_id: uuidv4(),
                    order_status: "COMPLETED",
                    parent_stock_tx_id: buyTransaction.parent_stock_tx_id,
                    is_buy: false,
                    order_type,
                    stock_price: matchPrice,
                    quantity: matchQuantity,
                    time_stamp: new Date(),
                    buyer_id: user_id,
                    seller_id: sellOrder.user_id,
                });

                await sellTransaction.save();

                const sellerWalletTransaction = new Wallet({
                    wallet_tx_id: sellTransaction.wallet_tx_id,
                    user_id: buyTransaction.seller_id,
                    stock_tx_id: sellTransaction.stock_tx_id,
                    is_debit: false,
                    amount: matchQuantity * matchPrice,
                    timestamp: new Date(),
                });

                await sellerWalletTransaction.save();
                console.log(`Wallet Transaction Logged (Credit) for seller:`, sellerWalletTransaction);

                // Log Debit Transaction in Wallet
                const walletTransaction = new Wallet({
                    wallet_tx_id: buyTransaction.wallet_tx_id,
                    user_id: current_user_id,
                    stock_tx_id: buyTransaction.stock_tx_id,
                    is_debit: true,
                    amount: matchQuantity * matchPrice,
                    timestamp: new Date(),
                });

                await walletTransaction.save();
                console.log(`Wallet Transaction Logged (Debit) for buyer:`, walletTransaction);

                // Seller Updates
                const sellerUser = await User.findById(sellOrder.user_id);
                if (sellerUser) {
                    sellerUser.wallet_balance += matchQuantity * matchPrice;
                    await sellerUser.save();
                }

                // Sell Order Updates
                sellOrder.quantity -= matchQuantity;
                if (sellOrder.quantity === 0) {
                    console.log(`Removing sell order ${sellOrder.id} as quantity is now zero`);
                    await engine.cancelOrder(sellOrder.id, sellOrder.user_id, false);
                }

                remainingQuantity -= matchQuantity;
            }

            let buyerPortfolio = await UserPortfolio.findOne({ userid: user_id, stock_id });
            if (!buyerPortfolio) {
                buyerPortfolio = new UserPortfolio({ userid: user_id, stock_id, quantity_owned: quantity });
            } else {
                buyerPortfolio.quantity_owned += quantity;
            }
            await buyerPortfolio.save();
            console.log(`Buyer's Portfolio Updated: ${quantity} stocks added.`);
        }

        return res.json({ success: true, data: allTransactions });

    } catch (error) {
        console.error("Error placing order:", error);
        return res.status(500).json({ success: false, data: { error: error.message } });
    }
});

router.get("/getOrderBook", async (req, res) => {
    try {
        const buyOrders = engine.orderBook.buyOrders;
        const sellOrders = engine.orderBook.sellOrders;

        return res.json({
            success: true,
            data: {
                buy_orders: buyOrders.map(order => ({
                    stock_id: order.stock_id,
                    price: order.price,
                    quantity: order.quantity
                })),
                sell_orders: sellOrders.map(order => ({
                    stock_id: order.stock_id,
					user_id: order.user_id,
                    price: order.price,
                    quantity: order.quantity
                }))
            }
        });
    } catch (error) {
        console.error("Error fetching order book:", error);
        return res.status(500).json({ success: false, data: { error: error.message } });
    }
}); 

router.get("/getStockTransactions", authMiddleware, async (req, res) => {
    try {
        const user_id = req.user.id; // Get user ID from JWT token
        console.log(`Fetching transactions for user: ${user_id}`);

        // Find transactions where the user is either the buyer or seller
        const transactions = await Transaction.find({
            $or: [{ buyer_id: user_id }, { seller_id: user_id }]
        });

        if (!transactions || transactions.length === 0) {
            console.log("No transactions found for user.");
            return res.json({ success: true, data: [] });
        }

        //Filter transactions based on user role
        const filteredTransactions = transactions.filter(tx => {
            if (tx.buyer_id === user_id && tx.is_buy === true) {
                return true;  //Buyer should only see buy transactions
            } else if (tx.seller_id === user_id && tx.is_buy === false) {
                return true;  // Seller should only see sell transactions
            }
            return false; // Should never happen, but safe fallback
        });

        //Format the response correctly
        const formattedTransactions = filteredTransactions.map(tx => ({
            stock_tx_id: tx.stock_tx_id,  // Correct transaction ID for each user
            parent_stock_tx_id: tx.buyer_id === user_id ? null : tx.parent_stock_tx_id, //Null for buyers, actual for sellers
            stock_id: tx.stock_id,
            wallet_tx_id: tx.wallet_tx_id || null,
            order_status: tx.order_status,
            is_buy: tx.is_buy,
            order_type: tx.order_type,
            stock_price: tx.stock_price,
            quantity: tx.quantity,
            time_stamp: tx.time_stamp
        }));

        console.log(`Transactions found: ${formattedTransactions.length}`);

        return res.json({ success: true, data: formattedTransactions });

    } catch (error) {
        console.error("Error fetching stock transactions:", error);
        return res.status(500).json({ success: false, data: { error: error.message } });
    }
});

router.post("/cancelStockTransaction", authMiddleware, async (req, res) => {
    try {
        const { stock_tx_id } = req.body;
        const user_id = req.user.id; // Extract user ID from JWT token

        if (!stock_tx_id) {
            return res.status(400).json({ success: false, error: "Missing stock transaction ID." });
        }

        console.log(`Searching for transaction with stock_tx_id: ${stock_tx_id}`);

        //Find the exact transaction using `stock_tx_id`
        const transaction = await Transaction.findOne({ stock_tx_id });

        if (!transaction) {
            console.log(`Transaction with stock_tx_id: ${stock_tx_id} not found.`);
            return res.status(404).json({ success: false, error: "Transaction not found." });
        }

        console.log(`Found transaction:`, transaction);

        //Ensure that the order is NOT completed
        if (transaction.order_status === "COMPLETED") {
            console.log(`Cannot cancel COMPLETED transaction.`);
            return res.status(400).json({ success: false, error: "Cannot cancel a completed transaction." });
        }

        //Mark the transaction as canceled
        transaction.order_status = "CANCELLED";
        await transaction.save();
        console.log(`Transaction ${stock_tx_id} has been canceled.`);
		
		// Find all child transactions where parent_stock_tx_id matches the canceled stock_tx_id
		const childTransactions = await Transaction.find({
			parent_stock_tx_id: stock_tx_id,
			is_buy: true
		});
		
		engine.orderBook.sellOrders = engine.orderBook.sellOrders.filter(order => {
		    return !(order.stock_id === transaction.stock_id && order.user_id === transaction.seller_id);
		});

		let matchedQuantity = 0;

		// Sum up all completed buy transactions that originated from the canceled sell transaction
		childTransactions.forEach(tx => {
			matchedQuantity += tx.quantity;
		});

		// Calculate the amount that needs to be refunded
		const refundQuantity = transaction.quantity - matchedQuantity;

		if (refundQuantity > 0) {
			console.log(`Refunding ${refundQuantity} stocks back to the user's portfolio.`);

			// Find the user's portfolio entry for this stock
			let userPortfolio = await UserPortfolio.findOne({
				userid: transaction.seller_id,
				stock_id: transaction.stock_id
			});

			if (!userPortfolio) {
				console.log(`No portfolio found, creating a new one for user ${transaction.seller_id}.`);
				userPortfolio = new UserPortfolio({
					userid: transaction.seller_id,
					stock_id: transaction.stock_id,
					quantity_owned: refundQuantity
				});
			} else {
				userPortfolio.quantity_owned += refundQuantity;
			}

			await userPortfolio.save();
			console.log(`Updated user portfolio. New quantity: ${userPortfolio.quantity_owned}`);
		}
			
		return res.json({ success: true, message: "Order canceled successfully.", transaction });

	} 
    catch (error) {
	    console.error("Error canceling order:", error);
		return res.status(500).json({ success: false, error: error.message });
	}
});

router.get("/getStockPrices", async (req, res) => {
    try {
        console.log("Fetching stock prices from Order Book...");

        // Get order book data
        const buyOrders = engine.orderBook.buyOrders;
        const sellOrders = engine.orderBook.sellOrders;

        if (!sellOrders || sellOrders.length === 0) {
            console.log("No sell orders found.");
            return res.json({ success: true, data: [] });
        }

        // Create an array of unique stock_ids from sell orders
        const stockIds = [...new Set(sellOrders.map(order => order.stock_id))];

        // Check Redis for cached stock prices
        const cacheKey = `stock_prices_${stockIds.join("_")}`;
        const cachedData = await client.get(cacheKey);

        if (cachedData) {
            console.log("📌 Fetching stock prices from Redis cache...");
            return res.json({ success: true, data: JSON.parse(cachedData) });
        }

        // Fetch stock names from MongoDB
        const stockData = await Stock.find({ stock_id: { $in: stockIds } });
        const stockMap = stockData.reduce((map, stock) => {
            map[stock.stock_id] = stock.stock_name;
            return map;
        }, {});

        // Find the lowest price for each stock and attach the stock name
        const stockPrices = {};
        sellOrders.forEach(order => {
            if (!stockPrices[order.stock_id] || order.price < stockPrices[order.stock_id].current_price) {
                stockPrices[order.stock_id] = {
                    stock_id: order.stock_id,
                    stock_name: stockMap[order.stock_id] || "Unknown", // Get stock_name from DB
                    current_price: order.price
                };
            }
        });

        // Cache the stock prices in Redis for 1 hour
        await client.setEx(cacheKey, 3600, JSON.stringify(Object.values(stockPrices)));

        return res.json({ success: true, data: Object.values(stockPrices) });

    } catch (error) {
        console.error("Error fetching stock prices:", error);
        return res.status(500).json({ success: false, data: { error: error.message } });
    }
});

module.exports = router;