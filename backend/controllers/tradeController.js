const axios = require("axios");
const User = require("../models/User");
const Transaction = require("../models/Transaction");

// Helper to fetch live or last close price from FastAPI
async function getStockPrice(symbol) {
  try {
    const fastApiUrl = process.env.FASTAPI_URL || "https://paper-trading-fastapi.onrender.com";
    const response = await axios.get(`${fastApiUrl}/stock`, {
      params: { symbol },
      timeout: 12000,
    });
    const stock = response.data;
    const price =
      stock?.meta?.regularMarketPrice ||
      stock?.meta?.previousClose ||
      stock?.history?.[stock.history.length - 1]?.close;
    const companyName =
      stock?.meta?.resolved_name ||
      stock?.meta?.symbol ||
      symbol;
    return { price: price ? Number(price) : null, companyName };
  } catch (err) {
    console.error("FastAPI price fetch error:", err.message);
    return { price: null, companyName: symbol };
  }
}

module.exports.buyStock = async (req, res) => {
  try {
    const { symbol, quantity, productType = "cnc", stopLoss, guestId, currentBalance } = req.body;
    let clientPrice = req.body.price ? Number(req.body.price) : null;
    const qty = Number(quantity);

    if (!symbol || isNaN(qty) || qty <= 0) {
      return res.status(400).json({ message: "Invalid stock symbol or quantity." });
    }

    // Resolve price
    const { price: fetchedPrice, companyName } = await getStockPrice(symbol);
    const executionPrice = fetchedPrice || clientPrice;

    if (!executionPrice || executionPrice <= 0) {
      return res.status(400).json({ message: "Unable to retrieve stock price for purchase." });
    }

    const totalValue = executionPrice * qty;
    // MIS (Intraday) uses 20% margin (5x leverage)
    const requiredMargin = productType === "mis" ? totalValue * 0.2 : totalValue;

    let userId = req.user?._id || null;
    let finalBalance = 100000;

    if (userId) {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }
      if (user.balance < requiredMargin) {
        return res.status(400).json({ message: "Insufficient balance for this order." });
      }
      user.balance -= requiredMargin;
      await user.save();
      finalBalance = user.balance;
    } else {
      // Guest balance
      const baseBal = currentBalance !== undefined ? Number(currentBalance) : 100000;
      finalBalance = Math.max(0, baseBal - requiredMargin);
    }

    const finalGuestId = userId ? "" : (guestId || "guest_default");

    // Create Buy Transaction in MongoDB
    const transaction = await Transaction.create({
      user: userId,
      guestId: finalGuestId,
      symbol,
      companyName: companyName || symbol,
      type: "BUY",
      productType,
      quantity: qty,
      price: executionPrice,
      totalAmount: totalValue,
      stopLoss: stopLoss ? Number(stopLoss) : undefined,
      status: "EXECUTED",
    });

    res.status(200).json({
      success: true,
      message: `Successfully bought ${qty} shares of ${symbol} (${productType.toUpperCase()})`,
      balance: finalBalance,
      transaction,
    });
  } catch (err) {
    console.error("buyStock error:", err);
    res.status(500).json({ message: "Server error executing buy order: " + err.message });
  }
};

module.exports.sellStock = async (req, res) => {
  try {
    const { symbol, quantity, productType = "cnc", guestId, currentBalance } = req.body;
    let clientPrice = req.body.price ? Number(req.body.price) : null;
    const qty = Number(quantity);

    if (!symbol || isNaN(qty) || qty <= 0) {
      return res.status(400).json({ message: "Invalid stock symbol or quantity." });
    }

    let userId = req.user?._id || null;
    const finalGuestId = userId ? "" : (guestId || "guest_default");

    // Resolve price
    const { price: fetchedPrice, companyName } = await getStockPrice(symbol);
    const executionPrice = fetchedPrice || clientPrice || 100;

    let revenue = executionPrice * qty;
    if (productType === "mis") {
      revenue = executionPrice * qty * 0.2; // Return margin + PnL approximate
    }

    let finalBalance = 100000;

    if (userId) {
      const user = await User.findById(userId);
      if (user) {
        user.balance += revenue;
        await user.save();
        finalBalance = user.balance;
      }
    } else {
      const baseBal = currentBalance !== undefined ? Number(currentBalance) : 100000;
      finalBalance = baseBal + revenue;
    }

    // Create Sell Transaction in MongoDB
    const transaction = await Transaction.create({
      user: userId,
      guestId: finalGuestId,
      symbol,
      companyName: companyName || symbol,
      type: "SELL",
      productType,
      quantity: qty,
      price: executionPrice,
      totalAmount: executionPrice * qty,
      status: "EXECUTED",
    });

    res.status(200).json({
      success: true,
      message: `Successfully sold ${qty} shares of ${symbol}`,
      balance: finalBalance,
      revenue,
      transaction,
    });
  } catch (err) {
    console.error("sellStock error:", err);
    res.status(500).json({ message: "Server error executing sell order: " + err.message });
  }
};

module.exports.getHoldings = async (req, res) => {
  try {
    const { guestId } = req.query;
    const userId = req.user?._id;

    const queryFilters = [];
    if (userId) queryFilters.push({ user: userId });
    if (guestId) queryFilters.push({ guestId: guestId });

    if (queryFilters.length === 0) {
      return res.status(200).json({ success: true, holdings: [] });
    }

    const transactions = await Transaction.find({ $or: queryFilters }).sort({ createdAt: 1 });

    const holdingsMap = {};

    for (const tx of transactions) {
      const key = `${tx.symbol}_${tx.productType || "cnc"}`;
      if (!holdingsMap[key]) {
        holdingsMap[key] = {
          symbol: tx.symbol,
          name: tx.companyName || tx.symbol,
          productType: tx.productType || "cnc",
          quantity: 0,
          totalCost: 0,
          stopLoss: tx.stopLoss,
        };
      }

      const holding = holdingsMap[key];

      if (tx.type === "BUY") {
        holding.quantity += tx.quantity;
        holding.totalCost += tx.totalAmount;
        if (tx.stopLoss) holding.stopLoss = tx.stopLoss;
      } else if (tx.type === "SELL") {
        holding.quantity -= tx.quantity;
      }
    }

    const holdings = Object.values(holdingsMap)
      .filter((h) => h.quantity > 0)
      .map((h) => ({
        symbol: h.symbol,
        name: h.name,
        productType: h.productType,
        quantity: h.quantity,
        averagePrice: h.quantity > 0 ? h.totalCost / h.quantity : 0,
        stopLoss: h.stopLoss,
      }));

    res.status(200).json({ success: true, holdings });
  } catch (err) {
    console.error("getHoldings error:", err);
    res.status(500).json({ message: "Unable to fetch holdings." });
  }
};

module.exports.getTransactionHistory = async (req, res) => {
  try {
    const { guestId } = req.query;
    const userId = req.user?._id;

    const queryFilters = [];
    if (userId) queryFilters.push({ user: userId });
    if (guestId) queryFilters.push({ guestId: guestId });

    const filter = queryFilters.length > 0 ? { $or: queryFilters } : {};
    const transactions = await Transaction.find(filter).sort({ createdAt: -1 }).limit(100);

    res.status(200).json({ success: true, transactions });
  } catch (err) {
    console.error("getTransactionHistory error:", err);
    res.status(500).json({ message: "Unable to fetch transaction history." });
  }
};

module.exports.resetAccount = async (req, res) => {
  try {
    const { guestId } = req.body;
    const userId = req.user?._id;

    if (userId) {
      await Transaction.deleteMany({ user: userId });
      const user = await User.findById(userId);
      if (user) {
        user.balance = 100000;
        await user.save();
      }
    }
    if (guestId) {
      await Transaction.deleteMany({ guestId: guestId });
    }

    res.status(200).json({
      success: true,
      message: "Trading account reset successfully. Balance restored to ₹1,00,000.",
      balance: 100000,
    });
  } catch (err) {
    console.error("resetAccount error:", err);
    res.status(500).json({ success: false, message: "Failed to reset trading account." });
  }
};
