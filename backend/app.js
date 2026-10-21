require("dotenv").config();
const express = require("express");
const app = express();
app.set("trust proxy", 1);
const cors = require("cors");
const connectDB = require("./config/db");
const User = require("./models/User");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require("connect-mongo").default;
const passport = require("passport");
const LocalStrategy = require("passport-local");

const rateLimit = require("express-rate-limit");

const authRoutes = require("./routes/authRoutes");
const tradeRoutes = require("./routes/tradeRoutes");
const userRoutes = require("./routes/userRoutes");
const forumRoutes = require("./routes/forumRoutes");

connectDB();

// DoS Protection: Rate Limiters
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // Limit each IP to 200 requests per 15 minutes
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many requests from this IP. Please slow down." }
});

const authLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // Max 10 attempts per minute (prevents brute-force)
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many authentication attempts. Please wait 1 minute." }
});

// Middleware
app.use(cors({
    origin: true,
    credentials: true,
}));
app.use(express.json({ limit: "25kb" })); // DoS Protection: Restrict payload size
app.use(express.urlencoded({ extended: true, limit: "25kb" }));

// Apply Rate Limiters
app.use("/api/", globalLimiter);
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/signup", authLimiter);



//mongostore config
const store = MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    crypto: {
        secret: process.env.SESSION_SECRET,
    },
    touchAfter: 24 * 3600,
});

// session

const sessionConfig = {
    store,
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 30, 
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        secure: process.env.NODE_ENV === "production",
    },
};

app.use(session(sessionConfig));

//passport
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


//auth
app.use("/api/auth", authRoutes);

//buy
app.use("/api/trade", tradeRoutes);

//user profile & preferences
app.use("/api/user", userRoutes);

//community forum
app.use("/api/forum", forumRoutes);


app.get("/",(req,res)=>{
    res.send("backend running")
});

const PORT = process.env.PORT

app.listen(PORT,()=>{
    console.log(`Server running on port ${PORT}`)
});