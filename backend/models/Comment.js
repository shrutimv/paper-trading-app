const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
      index: true,
    },
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
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 800,
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
  },
  {
    timestamps: true,
  }
);

commentSchema.index({ post: 1, createdAt: 1 });

const Comment = mongoose.model("Comment", commentSchema);

module.exports = Comment;
