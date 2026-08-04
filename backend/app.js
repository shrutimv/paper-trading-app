require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const connectDB = require("./config/db");
const User = require("./models/User");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require("connect-mongo").default;
const passport = require("passport");
const LocalStrategy = require("passport-local");

const authRoutes = require("./routes/authRoutes");

connectDB();

// Middleware
app.use(cors({
    origin: true,
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 30, 
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


app.get("/",(req,res)=>{
    res.send("backend running")
});

const PORT = process.env.PORT

app.listen(PORT,()=>{
    console.log(`Server running on port ${PORT}`)
});