const express = require("express");
const router = express.Router();
const socialController = require("../controllers/socialController");

router.get("/leaderboard", socialController.getLeaderboard);
router.get("/friends", socialController.getFriends);
router.post("/friends/request", socialController.sendFriendRequest);
router.post("/friends/respond", socialController.respondFriendRequest);
router.post("/friends/remove", socialController.removeFriend);
router.get("/users/search", socialController.searchUsers);

module.exports = router;
