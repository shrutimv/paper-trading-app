const express = require("express");
const router = express.Router();

const isLoggedIn = require("../middleware/isLoggedIn");
const tradeController = require("../controllers/tradeController");

router.post("/buy", isLoggedIn, tradeController.buyStock);
router.post("/sell", isLoggedIn, tradeController.sellStock);
router.get("/holdings", isLoggedIn, tradeController.getHoldings);

module.exports = router;