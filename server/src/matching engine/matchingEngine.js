const orderBook = require("../orderbook/orderBook");
const Transaction = require("../models/Transaction");
const Wallet = require("../models/Wallet");
const UserPortfolio = require("../models/UserPortfolio");

class MatchingEngine {
    async processOrders(stock_id) {
        while (true) {
            const bestBuyOrder = orderBook.getBestBuyOrder(stock_id);
            const bestSellOrder = orderBook.getBestSellOrder(stock_id);

            if (!bestBuyOrder || !bestSellOrder) break; // No matches available

            if (bestBuyOrder.price >= bestSellOrder.price) {
                const transactionQuantity = Math.min(bestBuyOrder.quantity, bestSellOrder.quantity);
                const transactionPrice = bestSellOrder.price;

                try {
                    // ✅ Hold Funds & Stocks Before Processing
                    const buyerWallet = await Wallet.findOne({ user_id: bestBuyOrder.user_id });
                    const sellerWallet = await Wallet.findOne({ user_id: bestSellOrder.user_id });
                    const sellerPortfolio = await UserPortfolio.findOne({ userid: bestSellOrder.user_id, stock_id });

                    if (!buyerWallet || !sellerWallet || !sellerPortfolio) throw new Error("Wallet/Portfolio not found");

                    // ✅ Execute transaction
                    buyerWallet.amount -= transactionQuantity * transactionPrice;
                    sellerWallet.amount += transactionQuantity * transactionPrice;
                    await buyerWallet.save();
                    await sellerWallet.save();

                    // ✅ Update stock portfolios
                    let buyerPortfolio = await UserPortfolio.findOne({ userid: bestBuyOrder.user_id, stock_id });
                    if (!buyerPortfolio) {
                        buyerPortfolio = new UserPortfolio({ userid: bestBuyOrder.user_id, stock_id, quantity_owned: 0 });
                    }
                    buyerPortfolio.quantity_owned += transactionQuantity;
                    sellerPortfolio.quantity_owned -= transactionQuantity;

                    await buyerPortfolio.save();
                    await sellerPortfolio.save();

                    // ✅ Log transaction
                    await Transaction.create({
                        stock_tx_id: bestBuyOrder.order_id,
                        stock_id,
                        order_status: "COMPLETED",
                        is_buy: true,
                        stock_price: transactionPrice,
                        quantity: transactionQuantity,
                        buyer_id: bestBuyOrder.user_id,
                        seller_id: bestSellOrder.user_id,
                    });

                    // ✅ Handle Partial Order Fulfillment
                    if (bestBuyOrder.quantity === transactionQuantity) {
                        orderBook.removeOrder(stock_id, bestBuyOrder.order_id, true);
                    } else {
                        bestBuyOrder.quantity -= transactionQuantity;
                    }

                    if (bestSellOrder.quantity === transactionQuantity) {
                        orderBook.removeOrder(stock_id, bestSellOrder.order_id, false);
                    } else {
                        bestSellOrder.quantity -= transactionQuantity;
                    }

                } catch (error) {
                    console.error("❌ Transaction Error:", error);
                    break; // Rollback if error occurs
                }
            } else {
                break; // No price match
            }
        }
    }
}

module.exports = new MatchingEngine();