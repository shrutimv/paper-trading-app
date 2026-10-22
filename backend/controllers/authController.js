const User = require("../models/User");
const OTP = require("../models/OTP");
const { sendVerificationEmail } = require("../services/emailService");


/**
 * Step 1: Send OTP to verify real email & defeat bot registrations
 */
module.exports.sendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.includes("@")) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Prevent duplicate registration early
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "An account with this email address already exists. Please log in.",
      });
    }

    // Generate 6-digit random code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Clear any previous OTPs for this email and save new one
    await OTP.deleteMany({ email: cleanEmail });
    await OTP.create({ email: cleanEmail, otp });

    // Send email via email service
    const emailResult = await sendVerificationEmail(cleanEmail, otp);

    res.status(200).json({
      success: true,
      message: `A 6-digit verification code has been sent to ${cleanEmail}. Valid for 10 minutes.`,
      devMode: emailResult.devMode,
      ...(emailResult.devMode ? { devOtp: emailResult.devOtp } : {}),
    });
  } catch (err) {
    console.error("sendOtp error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to send verification code. Please try again.",
    });
  }
};

/**
 * Step 2: Register user with verified OTP, unique username, and friendCode
 */
module.exports.signup = async (req, res) => {
  try {
    const { username, email, password, otp } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Username, email, and password are all required.",
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanUsername = username.trim();

    // OTP Verification Check
    if (!otp) {
      return res.status(400).json({
        success: false,
        message: "Please enter the 6-digit verification code sent to your email.",
      });
    }

    const validOtp = await OTP.findOne({ email: cleanEmail, otp: otp.trim() });
    if (!validOtp) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification code. Please request a new code.",
      });
    }

    // Check for duplicate email
    const existingEmail = await User.findOne({ email: cleanEmail });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: "A user with this email address already exists. Please log in.",
      });
    }

    const user = new User({
      username: cleanUsername,
      email: cleanEmail,
    });

    const registeredUser = await User.register(user, password);

    // Consume the OTP so it cannot be reused
    await OTP.deleteMany({ email: cleanEmail });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: registeredUser._id,
        username: registeredUser.username,
        email: registeredUser.email,
        balance: registeredUser.balance,
      },
    });
  } catch (err) {
    let errorMsg = err.message || "Registration failed.";
    if (err.name === "UserExistsError" || err.code === 11000) {
      errorMsg = "A user with this username is already registered. Please choose a different username.";
    }
    res.status(400).json({
      success: false,
      message: errorMsg,
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
      xp: req.user.xp || 0,
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
      balance: user.balance,
      xp: user.xp || 0,
      friendsCount: user.friends ? user.friends.length : 0,
    },
  });
};