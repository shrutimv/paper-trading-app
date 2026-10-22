const express = require("express");
const router = express.Router();
const forumController = require("../controllers/forumController");

// User activity for Profile Screen (must be before :id to prevent matching)
router.get("/activity", forumController.getUserActivity);

// Public browsing of forum posts & comments
router.get("/posts", forumController.getPosts);
router.get("/posts/:id", forumController.getPostById);

// Post, Like, Comment - open to all traders including guest mode!
router.post("/posts", forumController.createPost);
router.post("/posts/:id/like", forumController.toggleLike);
router.post("/posts/:id/comment", forumController.addComment);
router.delete("/posts/:id", forumController.deletePost);

module.exports = router;
