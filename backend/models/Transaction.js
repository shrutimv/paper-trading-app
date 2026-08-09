const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    symbol: {
      type: String,
      required: true,
    },
    companyName: {
      type: String,
      default: "",
    },
    type: {
      type: String,
      enum: ["BUY", "SELL"],
      required: true,
    },
    productType: {
      type: String,
      enum: ["cnc", "mis"],
      default: "cnc",
    },
    quantity: {
      type: Number,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    stopLoss: {
      type: Number,
    },
    status: {
      type: String,
      enum: ["EXECUTED", "PENDING", "CANCELLED"],
      default: "EXECUTED",
    },
  },
  {
    timestamps: true,
  }
);

const Transaction = mongoose.model("Transaction", transactionSchema);

module.exports = Transaction;