const express = require("express");
const router = express.Router();
const isLoggedIn = require("../middleware/isLoggedIn");
const chatController = require("../controllers/chatController");

// List active conversations
router.get("/conversations", isLoggedIn, chatController.getConversations);

// Fetch messages with a friend
router.get("/messages/:friendId", isLoggedIn, chatController.getMessages);

// Send message to a friend
router.post("/messages/:friendId", isLoggedIn, chatController.sendMessage);

// Mark messages as read
router.post("/messages/:friendId/read", isLoggedIn, chatController.markRead);

module.exports = router;
