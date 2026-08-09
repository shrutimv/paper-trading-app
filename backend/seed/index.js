const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const mongoose = require("mongoose");
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const users = require("./data");

async function seedDatabase() {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      console.error("Error: MONGO_URI is not set in .env");
      process.exit(1);
    }

    console.log("Connecting to MongoDB Atlas...");
    await mongoose.connect(uri);
    console.log("MongoDB Connected Successfully! ✅");

    // Clean wipe old collections
    await User.deleteMany({});
    await Transaction.deleteMany({});
    console.log("Wiped old User and Transaction collections.");

    // Register each sample user with upgraded schema fields and ₹1,00,000 balance
    for (const u of users) {
      const newUser = new User({
        username: u.username,
        email: u.email,
        balance: 100000,
        xp: 0,
        streak: 1,
        puzzlesCompleted: 0,
        coursesCompleted: [],
        watchlist: [
          { symbol: "RELIANCE.NS", shortname: "Reliance Industries", exchange: "NSE" },
          { symbol: "TCS.NS", shortname: "Tata Consultancy Services", exchange: "NSE" },
          { symbol: "HDFCBANK.NS", shortname: "HDFC Bank", exchange: "NSE" },
          { symbol: "INFY.NS", shortname: "Infosys Ltd", exchange: "NSE" },
          { symbol: "ITC.NS", shortname: "ITC Limited", exchange: "NSE" },
        ],
      });
      await User.register(newUser, u.password);
      console.log(`Registered user: ${u.username} (${u.email}) with ₹1,00,000`);
    }

    console.log("Database successfully upgraded and seeded! 🎉");
    await mongoose.connection.close();
  } catch (err) {
    console.error("Seeding Error:", err);
  }
}

seedDatabase();