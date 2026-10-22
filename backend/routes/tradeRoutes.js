const express = require("express");
const router = express.Router();
const tradeController = require("../controllers/tradeController");

// Trade execution & history - accessible to both authenticated users and guest sessions
router.post("/buy", tradeController.buyStock);
router.post("/sell", tradeController.sellStock);
router.get("/holdings", tradeController.getHoldings);
router.get("/history", tradeController.getTransactionHistory);
router.post("/reset", tradeController.resetAccount);

module.exports = router;