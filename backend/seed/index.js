require("dotenv").config({ path: "../.env" });

const mongoose = require("mongoose");

const User = require("../models/User");
const users = require("./data");

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB Connected");

    // Remove old data
    await User.deleteMany({});

    // Insert new data
    await User.insertMany(users);

    console.log("Database seeded successfully!");

    mongoose.connection.close();
  } catch (err) {
    console.error(err);
  }
}

seedDatabase();