const User = require("../models/User");

// GET /api/user/profile
module.exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-hash -salt");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }
    res.status(200).json({ success: true, user });
  } catch (err) {
    console.error("getProfile error:", err);
    res.status(500).json({ success: false, message: "Error loading profile." });
  }
};

// PUT /api/user/risk-profile
// Updates riskProfile and preferredSectors for the ML Recommendation Engine
module.exports.updateRiskProfile = async (req, res) => {
  try {
    const { riskProfile, preferredSectors } = req.body;
    const validProfiles = ["CONSERVATIVE", "MODERATE", "AGGRESSIVE"];

    const updateFields = {};
    if (riskProfile && validProfiles.includes(riskProfile.toUpperCase())) {
      updateFields.riskProfile = riskProfile.toUpperCase();
    }
    if (Array.isArray(preferredSectors)) {
      updateFields.preferredSectors = preferredSectors.map((s) => String(s).trim());
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select("riskProfile preferredSectors");

    res.status(200).json({
      success: true,
      message: "Risk profile & sector preferences updated.",
      riskProfile: user.riskProfile,
      preferredSectors: user.preferredSectors,
    });
  } catch (err) {
    console.error("updateRiskProfile error:", err);
    res.status(500).json({ success: false, message: "Failed to update risk profile." });
  }
};

// PUT /api/user/watchlist
// Syncs client watchlist to MongoDB
module.exports.syncWatchlist = async (req, res) => {
  try {
    const { watchlist } = req.body;
    if (!Array.isArray(watchlist)) {
      return res.status(400).json({ success: false, message: "Watchlist must be an array." });
    }

    const cleanWatchlist = watchlist.map((w) => ({
      symbol: String(w.symbol || "").trim().toUpperCase(),
      shortname: String(w.shortname || w.name || w.symbol || "").trim(),
      exchange: String(w.exchange || "NSE").trim(),
    }));

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { watchlist: cleanWatchlist } },
      { new: true }
    ).select("watchlist");

    res.status(200).json({
      success: true,
      message: "Watchlist synced with database.",
      watchlist: user.watchlist,
    });
  } catch (err) {
    console.error("syncWatchlist error:", err);
    res.status(500).json({ success: false, message: "Failed to sync watchlist." });
  }
};

// POST /api/user/track-view
// Tracks user browsing behavior (feeds into ML personalization)
module.exports.trackViewedStock = async (req, res) => {
  try {
    const { symbol } = req.body;
    if (!symbol) {
      return res.status(400).json({ success: false, message: "Symbol is required." });
    }

    const cleanSymbol = String(symbol).trim().toUpperCase();

    // Pull existing to avoid duplicates, then push to top, capped at 30
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { viewedStocks: { symbol: cleanSymbol } },
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $push: {
          viewedStocks: {
            $each: [{ symbol: cleanSymbol, viewedAt: new Date() }],
            $position: 0,
            $slice: 30, // Keep last 30 viewed stocks
          },
        },
      },
      { new: true }
    ).select("viewedStocks");

    res.status(200).json({
      success: true,
      viewedStocks: user.viewedStocks,
    });
  } catch (err) {
    console.error("trackViewedStock error:", err);
    res.status(500).json({ success: false, message: "Failed to track viewed stock." });
  }
};

// PUT /api/user/gamification
// Syncs XP, streak, and completed puzzles/courses
module.exports.syncGamification = async (req, res) => {
  try {
    const { xp, streak, puzzlesCompleted, coursesCompleted } = req.body;
    const update = {};

    if (typeof xp === "number") update.xp = xp;
    if (typeof streak === "number") update.streak = streak;
    if (typeof puzzlesCompleted === "number") update.puzzlesCompleted = puzzlesCompleted;
    if (Array.isArray(coursesCompleted)) update.coursesCompleted = coursesCompleted;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: update },
      { new: true }
    ).select("xp streak puzzlesCompleted coursesCompleted");

    res.status(200).json({
      success: true,
      message: "Gamification stats synced.",
      stats: user,
    });
  } catch (err) {
    console.error("syncGamification error:", err);
    res.status(500).json({ success: false, message: "Failed to sync gamification stats." });
  }
};
