const User = require("../models/User");

module.exports.signup = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        const user = new User({
            username,
            email
        });

        const registeredUser = await User.register(user, password);

        res.status(201).json({
            success: true,
            message: "User registered successfully",
            user: {
                id: registeredUser._id,
                username: registeredUser.username,
                email: registeredUser.email,
                balance: registeredUser.balance
            }
        });

    } catch (err) {
        res.status(400).json({
            success: false,
            message: err.message
        });
    }
};

module.exports.login = (req, res) => {

    res.status(200).json({
        success: true,
        message: "Login successful",
        user: {
            id: req.user._id,
            username: req.user.username,
            email: req.user.email,
            balance: req.user.balance,
        },
    });

};

module.exports.logout = (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);

    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Logout failed",
        });
      }

      res.clearCookie("connect.sid");

      res.status(200).json({
        success: true,
        message: "Logged out successfully",
      });
    });
  });
};

module.exports.getCurrentUser = async (req, res) => {
    const user = await User.findById(req.user._id);

    res.status(200).json({
        user: {
            id: user._id,
            username: user.username,
            email: user.email,
            balance: user.balance
        }
    });
};