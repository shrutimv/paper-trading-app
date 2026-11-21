const User = require("../models/User");
const mongoose = require("mongoose");

module.exports = async (req, res, next) => {
    if (req.isAuthenticated && req.isAuthenticated()) {
        return next();
    }

    const userId = req.headers["x-user-id"];
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
        try {
            const user = await User.findById(userId);
            if (user) {
                req.user = user;
                return next();
            }
        } catch (e) {
            console.error("isLoggedIn header fallback error:", e);
        }
    }

    return res.status(401).json({
        message: "Please login first."
    });
};