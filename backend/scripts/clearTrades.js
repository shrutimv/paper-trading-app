require("dotenv").config();
const mongoose = require("mongoose");
const Transaction = require("../models/Transaction");
const User = require("../models/User");

async function clearTrades() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("MONGO_URI not defined in .env");
    process.exit(1);
  }

  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB.");

    const txCount = await Transaction.countDocuments();
    console.log(`Found ${txCount} transactions in database.`);

    const res = await Transaction.deleteMany({});
    console.log(`Deleted ${res.deletedCount} transactions.`);

    // Reset all user balances back to ₹1,00,000 virtual cash
    const userRes = await User.updateMany({}, { $set: { balance: 100000 } });
    console.log(`Reset balances for ${userRes.modifiedCount} users to ₹1,00,000.`);

    console.log("All transactions cleared successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Error clearing transactions:", err);
    process.exit(1);
  }
}

clearTrades();
