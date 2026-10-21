const express = require("express");
const router = express.Router();
const isLoggedIn = require("../middleware/isLoggedIn");
const forumController = require("../controllers/forumController");

// Public browsing of forum posts & comments
router.get("/posts", forumController.getPosts);
router.get("/posts/:id", forumController.getPostById);

// Protected actions (Require login)
router.post("/posts", isLoggedIn, forumController.createPost);
router.post("/posts/:id/like", isLoggedIn, forumController.toggleLike);
router.post("/posts/:id/comment", isLoggedIn, forumController.addComment);
router.delete("/posts/:id", isLoggedIn, forumController.deletePost);

module.exports = router;
