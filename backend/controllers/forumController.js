const mongoose = require("mongoose");
const Post = require("../models/Post");
const Comment = require("../models/Comment");

// GET /api/forum/posts
// Fetch community feed with optional category, stockTag, or keyword search
module.exports.getPosts = async (req, res) => {
  try {
    const { category, stockTag, search, guestId, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (category && category !== "ALL") {
      filter.category = category.toUpperCase();
    }
    if (stockTag) {
      filter.stockTag = stockTag.toUpperCase().replace("$", "");
    }
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
        { stockTag: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
    const posts = await Post.find(filter)
      .sort({ isPinned: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const currentUserId = req.user?._id?.toString();

    // Map likes into count and userLiked boolean (handles both authenticated users & guests)
    const formatted = posts.map((post) => {
      const regLikesCount = post.likes ? post.likes.length : 0;
      const guestLikesCount = post.guestLikes ? post.guestLikes.length : 0;
      const isLikedByUser = currentUserId && post.likes
        ? post.likes.some((id) => id.toString() === currentUserId)
        : false;
      const isLikedByGuest = guestId && post.guestLikes
        ? post.guestLikes.includes(guestId)
        : false;

      return {
        ...post,
        likesCount: regLikesCount + guestLikesCount,
        isLiked: isLikedByUser || isLikedByGuest,
      };
    });

    const total = await Post.countDocuments(filter);

    res.status(200).json({
      success: true,
      posts: formatted,
      total,
      page: parseInt(page),
      hasMore: skip + posts.length < total,
    });
  } catch (err) {
    console.error("getPosts error:", err);
    res.status(500).json({ success: false, message: "Failed to load forum posts." });
  }
};

// GET /api/forum/posts/:id
// Fetch single post and its comments
module.exports.getPostById = async (req, res) => {
  try {
    const { id } = req.params;
    const { guestId } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ success: false, message: "Invalid post ID." });
    }

    const post = await Post.findById(id).lean();

    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found." });
    }

    const comments = await Comment.find({ post: id })
      .sort({ createdAt: 1 })
      .lean();

    const currentUserId = req.user?._id?.toString();

    const postRegLikes = post.likes ? post.likes.length : 0;
    const postGuestLikes = post.guestLikes ? post.guestLikes.length : 0;
    const postLikedByUser = currentUserId && post.likes
      ? post.likes.some((uId) => uId.toString() === currentUserId)
      : false;
    const postLikedByGuest = guestId && post.guestLikes
      ? post.guestLikes.includes(guestId)
      : false;

    res.status(200).json({
      success: true,
      post: {
        ...post,
        likesCount: postRegLikes + postGuestLikes,
        isLiked: postLikedByUser || postLikedByGuest,
      },
      comments: comments.map((c) => {
        const cRegLikes = c.likes ? c.likes.length : 0;
        const cGuestLikes = c.guestLikes ? c.guestLikes.length : 0;
        const cLikedByUser = currentUserId && c.likes
          ? c.likes.some((uId) => uId.toString() === currentUserId)
          : false;
        const cLikedByGuest = guestId && c.guestLikes
          ? c.guestLikes.includes(guestId)
          : false;

        return {
          ...c,
          likesCount: cRegLikes + cGuestLikes,
          isLiked: cLikedByUser || cLikedByGuest,
        };
      }),
    });
  } catch (err) {
    console.error("getPostById error:", err);
    res.status(500).json({ success: false, message: "Failed to load post details." });
  }
};

// POST /api/forum/posts
// Create a new post (Works for both logged in users AND guests)
module.exports.createPost = async (req, res) => {
  try {
    const { title, content, category = "GENERAL", stockTag = "", authorUsername, guestId } = req.body;

    if (!title || !title.trim() || !content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: "Title and content are required.",
      });
    }

    const cleanTag = stockTag.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    const finalAuthorId = req.user?._id || null;
    const finalUsername = (req.user?.username || authorUsername || "Guest Trader").trim();
    const finalGuestId = req.user ? "" : (guestId || "guest_" + Math.random().toString(36).substring(2, 9));

    const post = await Post.create({
      author: finalAuthorId,
      guestId: finalGuestId,
      authorUsername: finalUsername,
      title: title.trim(),
      content: content.trim(),
      category: ["GENERAL", "ANALYSIS", "NEWS", "QUESTION", "STRATEGY"].includes(category.toUpperCase())
        ? category.toUpperCase()
        : "GENERAL",
      stockTag: cleanTag,
      likes: [],
      guestLikes: [],
      commentsCount: 0,
    });

    res.status(201).json({
      success: true,
      message: "Post created successfully.",
      post: {
        ...post.toObject(),
        likesCount: 0,
        isLiked: false,
      },
    });
  } catch (err) {
    console.error("createPost error:", err);
    res.status(500).json({ success: false, message: "Failed to create post: " + err.message });
  }
};

// POST /api/forum/posts/:id/like
// Toggle like on a post (Works for both registered users & guests)
module.exports.toggleLike = async (req, res) => {
  try {
    const { id } = req.params;
    const { guestId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ success: false, message: "Invalid post ID." });
    }

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found." });
    }

    let isLikedNow = false;

    if (req.user?._id) {
      const currentUserId = req.user._id;
      const hasLiked = post.likes && post.likes.some((uid) => uid.equals(currentUserId));
      if (hasLiked) {
        post.likes.pull(currentUserId);
        isLikedNow = false;
      } else {
        post.likes.push(currentUserId);
        isLikedNow = true;
      }
    } else {
      // Guest like tracking
      const gId = guestId || "guest_anon";
      if (!post.guestLikes) post.guestLikes = [];
      const hasGuestLiked = post.guestLikes.includes(gId);
      if (hasGuestLiked) {
        post.guestLikes = post.guestLikes.filter((g) => g !== gId);
        isLikedNow = false;
      } else {
        post.guestLikes.push(gId);
        isLikedNow = true;
      }
    }

    await post.save();

    const totalLikes = (post.likes?.length || 0) + (post.guestLikes?.length || 0);

    res.status(200).json({
      success: true,
      isLiked: isLikedNow,
      likesCount: totalLikes,
    });
  } catch (err) {
    console.error("toggleLike error:", err);
    res.status(500).json({ success: false, message: "Failed to update like." });
  }
};

// POST /api/forum/posts/:id/comment
// Add a comment to a post (Works for both registered users & guests)
module.exports.addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { text, authorUsername, guestId } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: "Comment text cannot be empty.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ success: false, message: "Invalid post ID." });
    }

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found." });
    }

    const finalAuthorId = req.user?._id || null;
    const finalUsername = (req.user?.username || authorUsername || "Guest Trader").trim();
    const finalGuestId = req.user ? "" : (guestId || "guest_" + Math.random().toString(36).substring(2, 9));

    const comment = await Comment.create({
      post: id,
      author: finalAuthorId,
      guestId: finalGuestId,
      authorUsername: finalUsername,
      text: text.trim(),
      likes: [],
      guestLikes: [],
    });

    // Increment comment count on parent post
    post.commentsCount = (post.commentsCount || 0) + 1;
    await post.save();

    res.status(201).json({
      success: true,
      message: "Comment added.",
      comment: {
        ...comment.toObject(),
        likesCount: 0,
        isLiked: false,
      },
    });
  } catch (err) {
    console.error("addComment error:", err);
    res.status(500).json({ success: false, message: "Failed to post comment: " + err.message });
  }
};

// GET /api/forum/activity
// Fetch activity (My Posts & My Comments) for profile
module.exports.getUserActivity = async (req, res) => {
  try {
    const { userId, username, guestId } = req.query;
    const currentUserId = req.user?._id?.toString() || userId;
    const finalUsername = req.user?.username || username;

    const queryFilters = [];

    if (currentUserId && mongoose.Types.ObjectId.isValid(currentUserId)) {
      queryFilters.push({ author: currentUserId });
    }
    if (finalUsername && finalUsername !== "Trader" && finalUsername !== "Guest User") {
      queryFilters.push({ authorUsername: new RegExp("^" + finalUsername + "$", "i") });
    }
    if (guestId) {
      queryFilters.push({ guestId: guestId });
    }

    if (queryFilters.length === 0) {
      return res.status(200).json({ success: true, posts: [], comments: [] });
    }

    const orCondition = { $or: queryFilters };

    const posts = await Post.find(orCondition).sort({ createdAt: -1 }).lean();
    const comments = await Comment.find(orCondition)
      .populate("post", "title category stockTag")
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      posts: posts.map((p) => ({
        ...p,
        likesCount: (p.likes?.length || 0) + (p.guestLikes?.length || 0),
      })),
      comments: comments.map((c) => ({
        ...c,
        likesCount: (c.likes?.length || 0) + (c.guestLikes?.length || 0),
      })),
    });
  } catch (err) {
    console.error("getUserActivity error:", err);
    res.status(500).json({ success: false, message: "Failed to load activity." });
  }
};

// DELETE /api/forum/posts/:id
// Delete post (author only or admin)
module.exports.deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { guestId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ success: false, message: "Invalid post ID." });
    }

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found." });
    }

    const isUserAuthor = req.user?._id && post.author && post.author.equals(req.user._id);
    const isGuestAuthor = guestId && post.guestId && post.guestId === guestId;
    const isAdmin = req.user?.role === "admin";

    if (!isUserAuthor && !isGuestAuthor && !isAdmin) {
      return res.status(403).json({ success: false, message: "Unauthorized to delete this post." });
    }

    await Comment.deleteMany({ post: id });
    await Post.findByIdAndDelete(id);

    res.status(200).json({ success: true, message: "Post and its comments deleted." });
  } catch (err) {
    console.error("deletePost error:", err);
    res.status(500).json({ success: false, message: "Failed to delete post." });
  }
};

// POST /api/forum/comments/:commentId/like
// Toggle like on a comment (supports registered users & guests)
module.exports.toggleCommentLike = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { guestId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(404).json({ success: false, message: "Invalid comment ID." });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: "Comment not found." });
    }

    const isRegistered = !!req.user;
    let isLiked = false;

    if (isRegistered) {
      const uId = req.user._id;
      const index = (comment.likes || []).findIndex((id) => id.toString() === uId.toString());
      if (index > -1) {
        comment.likes.splice(index, 1);
        isLiked = false;
      } else {
        comment.likes.push(uId);
        isLiked = true;
      }
    } else {
      const finalGuestId = guestId || req.headers["x-guest-id"] || "";
      if (!finalGuestId) {
        return res.status(400).json({ success: false, message: "Guest identifier required." });
      }
      const index = (comment.guestLikes || []).indexOf(finalGuestId);
      if (index > -1) {
        comment.guestLikes.splice(index, 1);
        isLiked = false;
      } else {
        comment.guestLikes.push(finalGuestId);
        isLiked = true;
      }
    }

    await comment.save();

    const regLikes = comment.likes ? comment.likes.length : 0;
    const guestLikes = comment.guestLikes ? comment.guestLikes.length : 0;

    res.status(200).json({
      success: true,
      message: isLiked ? "Liked comment" : "Unliked comment",
      likesCount: regLikes + guestLikes,
      isLiked,
    });
  } catch (err) {
    console.error("toggleCommentLike error:", err);
    res.status(500).json({ success: false, message: "Failed to update comment like." });
  }
};
