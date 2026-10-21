const Post = require("../models/Post");
const Comment = require("../models/Comment");

// GET /api/forum/posts
// Fetch community feed with optional category, stockTag, or keyword search
module.exports.getPosts = async (req, res) => {
  try {
    const { category, stockTag, search, page = 1, limit = 20 } = req.query;
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

    // Map likes into count and userLiked boolean
    const formatted = posts.map((post) => ({
      ...post,
      likesCount: post.likes ? post.likes.length : 0,
      isLiked: currentUserId && post.likes
        ? post.likes.some((id) => id.toString() === currentUserId)
        : false,
    }));

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
    const post = await Post.findById(id).lean();

    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found." });
    }

    const comments = await Comment.find({ post: id })
      .sort({ createdAt: 1 })
      .lean();

    const currentUserId = req.user?._id?.toString();

    res.status(200).json({
      success: true,
      post: {
        ...post,
        likesCount: post.likes ? post.likes.length : 0,
        isLiked: currentUserId && post.likes
          ? post.likes.some((uId) => uId.toString() === currentUserId)
          : false,
      },
      comments: comments.map((c) => ({
        ...c,
        likesCount: c.likes ? c.likes.length : 0,
        isLiked: currentUserId && c.likes
          ? c.likes.some((uId) => uId.toString() === currentUserId)
          : false,
      })),
    });
  } catch (err) {
    console.error("getPostById error:", err);
    res.status(500).json({ success: false, message: "Failed to load post details." });
  }
};

// POST /api/forum/posts
// Create a new post
module.exports.createPost = async (req, res) => {
  try {
    const { title, content, category = "GENERAL", stockTag = "" } = req.body;

    if (!title || !title.trim() || !content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: "Title and content are required.",
      });
    }

    const cleanTag = stockTag.replace(/[^A-Za-z0-9]/g, "").toUpperCase();

    const post = await Post.create({
      author: req.user._id,
      authorUsername: req.user.username || "Trader",
      title: title.trim(),
      content: content.trim(),
      category: ["GENERAL", "ANALYSIS", "NEWS", "QUESTION", "STRATEGY"].includes(category.toUpperCase())
        ? category.toUpperCase()
        : "GENERAL",
      stockTag: cleanTag,
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
    res.status(500).json({ success: false, message: "Failed to create post." });
  }
};

// POST /api/forum/posts/:id/like
// Toggle like on a post
module.exports.toggleLike = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found." });
    }

    const currentUserId = req.user._id;
    const hasLiked = post.likes.some((uid) => uid.equals(currentUserId));

    if (hasLiked) {
      post.likes.pull(currentUserId);
    } else {
      post.likes.push(currentUserId);
    }

    await post.save();

    res.status(200).json({
      success: true,
      isLiked: !hasLiked,
      likesCount: post.likes.length,
    });
  } catch (err) {
    console.error("toggleLike error:", err);
    res.status(500).json({ success: false, message: "Failed to update like." });
  }
};

// POST /api/forum/posts/:id/comment
// Add a comment to a post
module.exports.addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: "Comment text cannot be empty.",
      });
    }

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found." });
    }

    const comment = await Comment.create({
      post: id,
      author: req.user._id,
      authorUsername: req.user.username || "Trader",
      text: text.trim(),
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
    res.status(500).json({ success: false, message: "Failed to post comment." });
  }
};

// DELETE /api/forum/posts/:id
// Delete post (author only)
module.exports.deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found." });
    }

    // Only author or admin can delete
    if (!post.author.equals(req.user._id) && req.user.role !== "admin") {
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
