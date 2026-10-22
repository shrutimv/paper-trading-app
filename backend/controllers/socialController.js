const User = require("../models/User");

/**
 * GET /api/social/leaderboard
 * Returns Global Top 50 traders and (if logged in) Friends-only leaderboard
 */
module.exports.getLeaderboard = async (req, res) => {
  try {
    // 1. Fetch Top 50 Global users by XP and Balance
    const globalUsers = await User.find({})
      .select("username xp balance avatarUrl badges portfolioReturn")
      .sort({ xp: -1, balance: -1 })
      .limit(50)
      .lean();

    const formattedGlobal = globalUsers.map((u, idx) => ({
      rank: idx + 1,
      id: u._id,
      username: u.username,
      xp: u.xp || 0,
      balance: u.balance || 100000,
      portfolioReturn: u.portfolioReturn || 0,
      avatarUrl: u.avatarUrl || "",
      badgesCount: u.badges ? u.badges.length : 0,
    }));

    let friendsLeaderboard = [];
    let currentUserRank = null;

    if (req.user) {
      // Find current user's global rank
      const usersAhead = await User.countDocuments({
        $or: [
          { xp: { $gt: req.user.xp || 0 } },
          { xp: req.user.xp || 0, balance: { $gt: req.user.balance || 100000 } },
        ],
      });
      currentUserRank = usersAhead + 1;

      // Populate friends leaderboard (User + Friends)
      const currentUserDoc = await User.findById(req.user._id)
        .populate("friends", "username xp balance avatarUrl badges portfolioReturn")
        .lean();

      if (currentUserDoc) {
        const circle = [
          {
            id: currentUserDoc._id,
            username: currentUserDoc.username,
            xp: currentUserDoc.xp || 0,
            balance: currentUserDoc.balance || 100000,
            portfolioReturn: currentUserDoc.portfolioReturn || 0,
            avatarUrl: currentUserDoc.avatarUrl || "",
            isCurrentUser: true,
          },
          ...(currentUserDoc.friends || []).map((f) => ({
            id: f._id,
            username: f.username,
            xp: f.xp || 0,
            balance: f.balance || 100000,
            portfolioReturn: f.portfolioReturn || 0,
            avatarUrl: f.avatarUrl || "",
            isCurrentUser: false,
          })),
        ];

        circle.sort((a, b) => b.xp - a.xp || b.balance - a.balance);
        friendsLeaderboard = circle.map((item, idx) => ({
          ...item,
          rank: idx + 1,
        }));
      }
    }

    res.status(200).json({
      success: true,
      global: formattedGlobal,
      friends: friendsLeaderboard,
      currentUserRank,
    });
  } catch (err) {
    console.error("getLeaderboard error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to load leaderboard.",
    });
  }
};

/**
 * GET /api/social/friends
 * Returns current user's friends list and pending requests
 */
module.exports.getFriends = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(200).json({
        success: true,
        friends: [],
        incomingRequests: [],
      });
    }

    const user = await User.findById(req.user._id)
      .populate("friends", "username xp balance avatarUrl bio badges")
      .populate("friendRequests.from", "username xp avatarUrl bio")
      .lean();

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      myUsername: user.username,
      friends: (user.friends || []).map((f) => ({
        id: f._id,
        username: f.username,
        xp: f.xp || 0,
        balance: f.balance || 100000,
        avatarUrl: f.avatarUrl || "",
        bio: f.bio || "",
      })),
      incomingRequests: (user.friendRequests || [])
        .filter((r) => r.from)
        .map((r) => ({
          requestId: r._id,
          fromUser: {
            id: r.from._id,
            username: r.from.username,
            xp: r.from.xp || 0,
            avatarUrl: r.from.avatarUrl || "",
          },
          createdAt: r.createdAt,
        })),
    });
  } catch (err) {
    console.error("getFriends error:", err);
    res.status(500).json({ success: false, message: "Failed to load friends." });
  }
};

/**
 * GET /api/social/users/search?q=...
 * Live autocomplete/search matching usernames with friendship status
 */
module.exports.searchUsers = async (req, res) => {
  try {
    const rawQuery = req.query.q ? req.query.q.trim().replace(/^@/, "") : "";
    if (!rawQuery || rawQuery.length < 1) {
      return res.status(200).json({ success: true, users: [] });
    }

    const excludeUser = (req.query.excludeUser || (req.user && req.user.username) || "").trim().replace(/^@/, "");

    const queryFilter = {
      username: { $regex: rawQuery, $options: "i" },
    };

    if (excludeUser) {
      queryFilter.username = {
        $regex: rawQuery,
        $options: "i",
        $nin: [new RegExp(`^${excludeUser}$`, "i")],
      };
    }

    if (req.user) {
      queryFilter._id = { $ne: req.user._id };
    }

    const matchedUsers = await User.find(queryFilter)
      .select("username xp avatarUrl friendRequests")
      .limit(10)
      .lean();

    let currentUserFriends = [];
    if (req.user) {
      const curUser = await User.findById(req.user._id).select("friends").lean();
      currentUserFriends = (curUser?.friends || []).map(String);
    }

    const formattedUsers = matchedUsers.map((u) => {
      const isFriend = currentUserFriends.includes(String(u._id));
      const hasSentRequest =
        req.user &&
        (u.friendRequests || []).some(
          (r) => String(r.from) === String(req.user._id)
        );

      return {
        id: u._id,
        username: u.username,
        xp: u.xp || 0,
        avatarUrl: u.avatarUrl || "",
        isFriend,
        isRequested: hasSentRequest,
      };
    });

    res.status(200).json({
      success: true,
      users: formattedUsers,
    });
  } catch (err) {
    console.error("searchUsers error:", err);
    res.status(500).json({ success: false, message: "Failed to search users." });
  }
};

/**
 * POST /api/social/friends/request
 * Send friend request using @username
 */
module.exports.sendFriendRequest = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Please log in to add friends." });
    }

    const { username } = req.body;
    if (!username || !username.trim()) {
      return res.status(400).json({ success: false, message: "Username is required." });
    }

    const cleanUsername = username.trim().replace(/^@/, "");

    const targetUser = await User.findOne({
      username: { $regex: new RegExp(`^${cleanUsername}$`, "i") },
    });

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: `No trader found matching "@${cleanUsername}".`,
      });
    }

    if (String(targetUser._id) === String(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: "You cannot add yourself as a friend!",
      });
    }

    // Check if already friends
    const currentUser = await User.findById(req.user._id);
    if (currentUser.friends && currentUser.friends.includes(targetUser._id)) {
      return res.status(400).json({
        success: false,
        message: `You and @${targetUser.username} are already friends!`,
      });
    }

    // Check if request already pending
    const existingReq = targetUser.friendRequests.find(
      (r) => String(r.from) === String(req.user._id)
    );
    if (existingReq) {
      return res.status(400).json({
        success: false,
        message: `Friend request already sent to @${targetUser.username}. Awaiting approval.`,
      });
    }

    // Push request
    targetUser.friendRequests.push({ from: req.user._id });
    await targetUser.save();

    res.status(200).json({
      success: true,
      message: `Friend request sent to @${targetUser.username}!`,
    });
  } catch (err) {
    console.error("sendFriendRequest error:", err);
    res.status(500).json({ success: false, message: "Failed to send friend request." });
  }
};

/**
 * POST /api/social/friends/respond
 * Accept or Reject incoming friend request
 */
module.exports.respondFriendRequest = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { requesterId, action } = req.body;
    if (!requesterId || !["ACCEPT", "REJECT"].includes(action)) {
      return res.status(400).json({ success: false, message: "Invalid action." });
    }

    const user = await User.findById(req.user._id);
    const requester = await User.findById(requesterId);

    if (!requester) {
      return res.status(404).json({ success: false, message: "Requester not found." });
    }

    // Remove from friendRequests
    user.friendRequests = user.friendRequests.filter(
      (r) => String(r.from) !== String(requesterId)
    );

    if (action === "ACCEPT") {
      if (!user.friends.includes(requesterId)) user.friends.push(requesterId);
      if (!requester.friends.includes(user._id)) requester.friends.push(user._id);
      await requester.save();
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: action === "ACCEPT" ? `You and @${requester.username} are now friends!` : "Friend request declined.",
    });
  } catch (err) {
    console.error("respondFriendRequest error:", err);
    res.status(500).json({ success: false, message: "Failed to respond to request." });
  }
};

/**
 * POST /api/social/friends/remove
 * Remove a friend
 */
module.exports.removeFriend = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { friendId } = req.body;
    if (!friendId) {
      return res.status(400).json({ success: false, message: "Friend ID required." });
    }

    await User.findByIdAndUpdate(req.user._id, { $pull: { friends: friendId } });
    await User.findByIdAndUpdate(friendId, { $pull: { friends: req.user._id } });

    res.status(200).json({
      success: true,
      message: "Friend removed.",
    });
  } catch (err) {
    console.error("removeFriend error:", err);
    res.status(500).json({ success: false, message: "Failed to remove friend." });
  }
};
