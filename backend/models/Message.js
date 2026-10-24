const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    read: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// High performance compound indexes:
// 1. Fetch conversation messages in chronological order in sub-millisecond time
messageSchema.index({ conversationId: 1, createdAt: 1 });
// 2. Fetch unread messages for a recipient instantly
messageSchema.index({ recipient: 1, read: 1 });

module.exports = mongoose.model("Message", messageSchema);
