// src/matchingEngine/matchingEngine.js
const OrderBook = require("../orderbook/orderBook");
const UserPortfolio = require("../models/UserPortfolio");

class MatchingEngine {
    constructor() {
        this.orderBook = new OrderBook();
        this.tradeHistory = [];
    }

    async placeOrder(order) {
        if (order.is_buy) {
            let bestSell = this.orderBook.getBestSell();
            while (bestSell && order.price >= bestSell.price && order.quantity > 0) {
                let matchQuantity = Math.min(order.quantity, bestSell.quantity);
                order.quantity -= matchQuantity;
                bestSell.quantity -= matchQuantity;

                this.tradeHistory.push({
                    buyOrderId: order.id,
                    sellOrderId: bestSell.id,
                    price: bestSell.price,
                    quantity: matchQuantity
                });

                if (bestSell.quantity === 0) {
                    this.orderBook.removeOrder(bestSell.id, false);
                }
                bestSell = this.orderBook.getBestSell();
            }
        } else {
            let bestBuy = this.orderBook.getBestBuy();
            while (bestBuy && order.price <= bestBuy.price && order.quantity > 0) {
                let matchQuantity = Math.min(order.quantity, bestBuy.quantity);
                order.quantity -= matchQuantity;
                bestBuy.quantity -= matchQuantity;

                this.tradeHistory.push({
                    buyOrderId: bestBuy.id,
                    sellOrderId: order.id,
                    price: bestBuy.price,
                    quantity: matchQuantity
                });

                if (bestBuy.quantity === 0) {
                    this.orderBook.removeOrder(bestBuy.id, true);
                }
                bestBuy = this.orderBook.getBestBuy();
            }
        }

        if (order.quantity > 0) {
            this.orderBook.addOrder(order);
            console.log(`✅ Order added to order book:`, order);

            // Remove stock from UserPortfolio
            try {
                const portfolio = await UserPortfolio.findOne({ userid: order.user_id, stock_id: order.stock_id });
                if (portfolio) {
                    if (portfolio.quantity_owned >= order.quantity) {
                        portfolio.quantity_owned -= order.quantity;
                    } else {
                        portfolio.quantity_owned = 0;
                    }
                    await portfolio.save();
                    console.log(`✅ Updated UserPortfolio: Removed ${order.quantity} stocks for user ${order.user_id}`);
                } else {
                    console.warn(`⚠️ UserPortfolio not found for user ${order.user_id} and stock ${order.stock_id}`);
                }
            } catch (error) {
                console.error(`❌ Error updating UserPortfolio:`, error);
            }
        }

        return { status: "Order placed", tradeHistory: this.tradeHistory };
    }

    async cancelOrder(orderId, userId, isBuy) {
        let order;
        if (isBuy) {
            order = this.orderBook.buyOrders.find(o => o.id === orderId);
            this.orderBook.buyOrders = this.orderBook.buyOrders.filter(o => o.id !== orderId);
        } else {
            order = this.orderBook.sellOrders.find(o => o.id === orderId);
            this.orderBook.sellOrders = this.orderBook.sellOrders.filter(o => o.id !== orderId);
        }

        if (!order) {
            return { status: "Error", message: "Order not found or already executed" };
        }

        console.log(`🛑 Order cancelled:`, order);

        // Restore stocks to UserPortfolio
        if (!isBuy) {
            try {
                const portfolio = await UserPortfolio.findOne({ userid: userId, stock_id: order.stock_id });
                if (portfolio) {
                    portfolio.quantity_owned += order.quantity;
                    await portfolio.save();
                    console.log(`✅ Restored ${order.quantity} stocks to user ${userId} after cancellation`);
                } else {
                    console.warn(`⚠️ No UserPortfolio found for user ${userId}. Creating new entry.`);
                    const newPortfolio = new UserPortfolio({
                        userid: userId,
                        stock_id: order.stock_id,
                        quantity_owned: order.quantity
                    });
                    await newPortfolio.save();
                }
            } catch (error) {
                console.error(`❌ Error restoring UserPortfolio:`, error);
            }
        }

        return { status: "Order cancelled", order };
    }

	// ✅ Add this function to return the full order book
    getOrderBook() {
        return this.orderBook;
    }
}

const engineInstance = new MatchingEngine(); // ✅ Singleton instance

module.exports = MatchingEngine;
