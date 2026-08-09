const axios = require("axios");
const User = require("../models/User");
const Transaction = require("../models/Transaction");

module.exports.buyStock = async (req, res) => {
    try {
        const { symbol, quantity } = req.body;

        // Basic validation
        if (!symbol || !quantity || quantity <= 0) {
            return res.status(400).json({
                message: "Invalid stock details."
            });
        }

        // Fetch latest stock price from FastAPI
        const response = await axios.get(
            `${process.env.FASTAPI_URL}/stock`,
            {
                params: {
                    symbol
                }
            }
        );

        const stock = response.data;

        const currentPrice = stock.meta.regularMarketPrice;
        const companyName = stock.meta.resolved_name;

        const totalAmount = currentPrice * quantity;

        // Get latest user document
        const user = await User.findById(req.user._id);

        // Check balance
        if (user.balance < totalAmount) {
            return res.status(400).json({
                message: "Insufficient balance."
            });
        }

        // Create transaction
        const transaction = await Transaction.create({
            user: user._id,
            symbol,
            companyName,
            type: "BUY",
            quantity,
            price: currentPrice,
            totalAmount
        });

        // Deduct balance
        user.balance -= totalAmount;
        await user.save();

        res.status(200).json({
            message: "Stock purchased successfully.",
            balance: user.balance,
            transaction
        });

    } catch (err) {
        console.error(err);

        res.status(500).json({
            message: "Something went wrong."
        });
    }
};

module.exports.getHoldings = async (req, res) => {
  try {
    const transactions = await Transaction.find({
      user: req.user._id,
    }).sort({ createdAt: 1 });

    const holdingsMap = {};

    for (const tx of transactions) {
      if (!holdingsMap[tx.symbol]) {
        holdingsMap[tx.symbol] = {
          symbol: tx.symbol,
          companyName: tx.companyName,
          quantity: 0,
          totalCost: 0,
        };
      }

      const holding = holdingsMap[tx.symbol];

      if (tx.type === "BUY") {
        holding.quantity += tx.quantity;
        holding.totalCost += tx.totalAmount;
      } else {
        holding.quantity -= tx.quantity;
      }
    }

    const holdings = Object.values(holdingsMap)
      .filter(h => h.quantity > 0)
      .map(h => ({
        symbol: h.symbol,
        companyName: h.companyName,
        quantity: h.quantity,
        averagePrice: h.totalCost / h.quantity,
        investedAmount: h.totalCost,
      }));

    res.json(holdings);

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Unable to fetch holdings.",
    });
  }
};

