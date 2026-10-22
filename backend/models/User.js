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
    // ML Recommendation Engine Profile
    riskProfile: {
      type: String,
      enum: ["CONSERVATIVE", "MODERATE", "AGGRESSIVE"],
      default: "MODERATE",
    },
    preferredSectors: [
      {
        type: String,
      },
    ],
    viewedStocks: [
      {
        symbol: String,
        viewedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // Profile & Community Metadata
    bio: {
      type: String,
      default: "Trading enthusiast & market learner",
      trim: true,
    },
    avatarUrl: {
      type: String,
      default: "",
    },
    badges: [
      {
        id: String,
        title: String,
        icon: String,
        unlockedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // Social, Leaderboard & Friends
    friendCode: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
      trim: true,
    },
    friends: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    friendRequests: [
      {
        from: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    portfolioReturn: {
      type: Number,
      default: 0,
    },
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