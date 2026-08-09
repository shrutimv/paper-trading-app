const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose").default;

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    balance: {
      type: Number,
      default: 100000, // ₹1,00,000 Starting virtual cash
    },
    xp: {
      type: Number,
      default: 0,
    },
    streak: {
      type: Number,
      default: 1,
    },
    puzzlesCompleted: {
      type: Number,
      default: 0,
    },
    coursesCompleted: [
      {
        type: String,
      },
    ],
    watchlist: [
      {
        symbol: String,
        shortname: String,
        exchange: String,
      },
    ],
    role: {
      type: String,
      default: "user",
    },
  },
  {
    timestamps: true,
  }
);

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User", userSchema);

module.exports = User;