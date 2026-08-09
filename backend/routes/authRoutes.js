const express = require("express");
const router = express.Router();
const passport = require("passport");
const LocalStrategy = require("passport-local");
const isLoggedIn = require("../middleware/isLoggedIn");

const authController = require("../controllers/authController");

router.post("/signup", authController.signup);
router.post("/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {

        console.log(err);
        console.log(user);
        console.log(info);

        if (err) return next(err);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: info.message,
            });
        }

        req.login(user, (err) => {
            if (err) return next(err);

            return authController.login(req, res);
        });

    })(req, res, next);
});
router.get("/logout", authController.logout);
router.post("/logout", authController.logout);

router.get("/me", isLoggedIn, authController.getCurrentUser);

module.exports = router;