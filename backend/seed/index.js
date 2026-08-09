const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const mongoose = require("mongoose");
const User = require("../models/User");
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

    // Remove old data
    await User.deleteMany({});
    console.log("Cleared old users.");

    // Register each sample user with passport hashing
    for (const u of users) {
      const newUser = new User({
        username: u.username,
        email: u.email,
        balance: u.balance,
      });
      await User.register(newUser, u.password);
      console.log(`Registered user: ${u.username} (${u.email}) with ₹${u.balance}`);
    }

    console.log("Database seeded successfully! 🎉");
    await mongoose.connection.close();
  } catch (err) {
    console.error("Seeding Error:", err);
  }
}

seedDatabase();