const axios = require("axios");
const User = require("../models/User");
const Transaction = require("../models/Transaction");

// Helper to fetch live or last close price from FastAPI
async function getStockPrice(symbol) {
  try {
    const fastApiUrl = process.env.FASTAPI_URL || "http://localhost:8000";
    const response = await axios.get(`${fastApiUrl}/stock`, {
      params: { symbol },
      timeout: 5000,
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
    const { symbol, quantity, productType = "cnc", stopLoss } = req.body;
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

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (user.balance < requiredMargin) {
      return res.status(400).json({ message: "Insufficient balance for this order." });
    }

    // Create Buy Transaction
    const transaction = await Transaction.create({
      user: user._id,
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

    // Deduct margin from user balance
    user.balance -= requiredMargin;
    await user.save();

    res.status(200).json({
      success: true,
      message: `Successfully bought ${qty} shares of ${symbol} (${productType.toUpperCase()})`,
      balance: user.balance,
      transaction,
    });
  } catch (err) {
    console.error("buyStock error:", err);
    res.status(500).json({ message: "Server error executing buy order." });
  }
};

module.exports.sellStock = async (req, res) => {
  try {
    const { symbol, quantity, productType = "cnc" } = req.body;
    let clientPrice = req.body.price ? Number(req.body.price) : null;
    const qty = Number(quantity);

    if (!symbol || isNaN(qty) || qty <= 0) {
      return res.status(400).json({ message: "Invalid stock symbol or quantity." });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Calculate current user holdings for this stock & productType
    const transactions = await Transaction.find({
      user: user._id,
      symbol,
      productType,
    }).sort({ createdAt: 1 });

    let availableQty = 0;
    let totalInvestedCost = 0;

    for (const tx of transactions) {
      if (tx.type === "BUY") {
        availableQty += tx.quantity;
        totalInvestedCost += tx.totalAmount;
      } else if (tx.type === "SELL") {
        availableQty -= tx.quantity;
      }
    }

    if (availableQty < qty) {
      return res.status(400).json({
        message: `Insufficient shares. You only own ${availableQty} shares of ${symbol}.`,
      });
    }

    const avgPrice = availableQty > 0 ? totalInvestedCost / availableQty : 0;

    // Resolve price: live FastAPI -> client fallback -> holding average price
    const { price: fetchedPrice, companyName } = await getStockPrice(symbol);
    const executionPrice = fetchedPrice || clientPrice || avgPrice;

    if (!executionPrice || executionPrice <= 0) {
      return res.status(400).json({ message: "Unable to determine selling price." });
    }

    let revenue = executionPrice * qty;
    if (productType === "mis") {
      // MIS returns margin + / - full P&L
      revenue = (executionPrice * qty) - (avgPrice * qty * 0.8);
    }

    // Create Sell Transaction
    const transaction = await Transaction.create({
      user: user._id,
      symbol,
      companyName: companyName || symbol,
      type: "SELL",
      productType,
      quantity: qty,
      price: executionPrice,
      totalAmount: executionPrice * qty,
      status: "EXECUTED",
    });

    // Credit revenue to user balance
    user.balance += revenue;
    await user.save();

    res.status(200).json({
      success: true,
      message: `Successfully sold ${qty} shares of ${symbol}`,
      balance: user.balance,
      revenue,
      transaction,
    });
  } catch (err) {
    console.error("sellStock error:", err);
    res.status(500).json({ message: "Server error executing sell order." });
  }
};

module.exports.getHoldings = async (req, res) => {
  try {
    const transactions = await Transaction.find({
      user: req.user._id,
    }).sort({ createdAt: 1 });

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
    const transactions = await Transaction.find({
      user: req.user._id,
    }).sort({ createdAt: -1 });

    res.status(200).json({ success: true, transactions });
  } catch (err) {
    console.error("getTransactionHistory error:", err);
    res.status(500).json({ message: "Unable to fetch transaction history." });
  }
};

