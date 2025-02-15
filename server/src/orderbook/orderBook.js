const { v4: uuidv4 } = require("uuid");

class OrderBook {
    constructor() {
        this.orders = {}; // HashMap { stock_id: { buyOrders: [], sellOrders: [] } }
    }

    ensureStock(stock_id) {
        if (!this.orders[stock_id]) {
            this.orders[stock_id] = { buyOrders: [], sellOrders: [] };
        }
    }

    // ✅ Add order to order book (Buy/Sell)
    addOrder(order) {
        this.ensureStock(order.stock_id);

        order.order_id = uuidv4(); // Assign unique ID
        order.timestamp = Date.now(); // Assign timestamp

        if (order.is_buy) {
            this.orders[order.stock_id].buyOrders.push(order);
            this.orders[order.stock_id].buyOrders.sort((a, b) => b.price - a.price || a.timestamp - b.timestamp);
        } else {
            this.orders[order.stock_id].sellOrders.push(order);
            this.orders[order.stock_id].sellOrders.sort((a, b) => a.price - b.price || a.timestamp - b.timestamp);
        }
    }

    // ✅ Get Best Buy/Sell Order
    getBestBuyOrder(stock_id) {
        this.ensureStock(stock_id);
        return this.orders[stock_id].buyOrders.length ? this.orders[stock_id].buyOrders[0] : null;
    }

    getBestSellOrder(stock_id) {
        this.ensureStock(stock_id);
        return this.orders[stock_id].sellOrders.length ? this.orders[stock_id].sellOrders[0] : null;
    }

    // ✅ Remove completed order
    removeOrder(stock_id, order_id, is_buy) {
        this.ensureStock(stock_id);
        this.orders[stock_id][is_buy ? "buyOrders" : "sellOrders"] = 
            this.orders[stock_id][is_buy ? "buyOrders" : "sellOrders"]
                .filter(order => order.order_id !== order_id);
    }

    // ✅ Get all orders for debugging
    getOrders(stock_id) {
        this.ensureStock(stock_id);
        return this.orders[stock_id];
    }
}

module.exports = new OrderBook();