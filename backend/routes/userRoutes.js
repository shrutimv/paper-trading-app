const express = require("express");
const router = express.Router();
const isLoggedIn = require("../middleware/isLoggedIn");
const userController = require("../controllers/userController");

// All user routes require authentication
router.use(isLoggedIn);

router.get("/profile", userController.getProfile);
router.put("/risk-profile", userController.updateRiskProfile);
router.put("/watchlist", userController.syncWatchlist);
router.post("/track-view", userController.trackViewedStock);
router.put("/gamification", userController.syncGamification);

module.exports = router;
