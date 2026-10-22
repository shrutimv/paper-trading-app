const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    guestId: {
      type: String,
      default: "",
    },
    authorUsername: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    category: {
      type: String,
      enum: ["GENERAL", "ANALYSIS", "NEWS", "QUESTION", "STRATEGY"],
      default: "GENERAL",
    },
    stockTag: {
      type: String,
      default: "",
      trim: true,
      uppercase: true,
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    guestLikes: [
      {
        type: String,
      },
    ],
    commentsCount: {
      type: Number,
      default: 0,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast feed queries
postSchema.index({ createdAt: -1 });
postSchema.index({ category: 1, createdAt: -1 });
postSchema.index({ stockTag: 1 });

const Post = mongoose.model("Post", postSchema);

module.exports = Post;
