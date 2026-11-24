require("dotenv").config();

const express    = require("express");
const mongoose   = require("mongoose");
const cors       = require("cors");
const bcrypt     = require("bcrypt");
const jwt        = require("jsonwebtoken");
const helmet     = require("helmet");
const morgan     = require("morgan");
const rateLimit  = require("express-rate-limit");

const path           = require("path");
const authMiddleware = require("./middleware/auth");
const User           = require("./models/User");

const app = express();

// ============================================================
// 🛡️  GLOBAL MIDDLEWARE
// ============================================================

// Security headers
app.use(helmet());

// HTTP request logger
app.use(morgan("dev"));

// CORS – allow frontend origin (adjust in production)
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================================
// 🚦 RATE LIMITERS
// ============================================================

/** General API limiter – 100 req / 15 min */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, please slow down." }
});

/** Auth limiter – 10 attempts / 15 min (brute-force protection) */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many login attempts, try again after 15 minutes." }
});

app.use("/api/", apiLimiter);

// ============================================================
// 🗄️  DATABASE
// ============================================================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => {
    console.warn("⚠️  MongoDB connection failed (auth routes will not work):", err.message);
    // Don't crash — server still starts so static/job routes work
  });

// ============================================================
// 🔑 AUTH ROUTES  (public)
// ============================================================

/** POST /api/signup */
app.post("/api/signup", authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "All fields are required." });
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: "Invalid email format." });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters." });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ success: false, message: "Email already registered." });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = new User({
      email: email.toLowerCase(),
      password: hashedPassword
    });

    await newUser.save();

    // Issue token right after signup (auto-login)
    const token = jwt.sign(
      { id: newUser._id, email: newUser.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      success: true,
      message: "Account created successfully! 🎉",
      token,
      user: { id: newUser._id, email: newUser.email }
    });

  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ success: false, message: "Server error. Please try again." });
  }
});

/** POST /api/login */
app.post("/api/login", authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "All fields are required." });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      message: "Welcome back! 👋",
      token,
      user: { id: user._id, email: user.email }
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: "Server error. Please try again." });
  }
});

// ============================================================
// 🔒 PROTECTED ROUTES  (require valid JWT)
// ============================================================

/** GET /api/me – returns logged-in user info */
app.get("/api/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error." });
  }
});

/** GET /api/jobs – protected job list endpoint */
app.get("/api/jobs", authMiddleware, (req, res) => {
  const jobs = [
    { title: "Frontend Developer",         skills: ["html","css","javascript","react"] },
    { title: "Backend Developer",           skills: ["nodejs","mongodb","express"] },
    { title: "Full Stack Developer",        skills: ["html","css","javascript","nodejs"] },
    { title: "Android Developer",           skills: ["java","kotlin","android"] },
    { title: "iOS Developer",               skills: ["swift","ios"] },
    { title: "Flutter Developer",           skills: ["flutter","dart"] },
    { title: "Data Analyst",               skills: ["sql","excel","python"] },
    { title: "Data Scientist",             skills: ["python","pandas","machine learning"] },
    { title: "Machine Learning Engineer",  skills: ["python","tensorflow","pytorch"] },
    { title: "Cloud Engineer",             skills: ["aws","azure","gcp"] },
    { title: "Cybersecurity Analyst",      skills: ["networking","security","linux"] },
    { title: "UI/UX Designer",             skills: ["figma","design","prototyping"] },
    { title: "QA Engineer",               skills: ["testing","selenium","automation"] },
    { title: "AI Engineer",               skills: ["python","ai","nlp"] },
    { title: "Blockchain Developer",       skills: ["solidity","web3","ethereum"] },
    { title: "DevOps Engineer",            skills: ["docker","kubernetes","aws"] }
  ];
  res.json({ success: true, jobs });
});

// ============================================================
// ❌ 404 & Error Handlers
// ============================================================
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found." });
});

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ success: false, message: "Internal server error." });
});

// ============================================================
// 🚀 START SERVER
// ============================================================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`\n🚀 RoleFinder API running on http://localhost:${PORT}`);
  console.log(`📋 Routes:`);
  console.log(`   POST /api/signup   – Register`);
  console.log(`   POST /api/login    – Login`);
  console.log(`   GET  /api/me       – Profile (🔒 JWT)`);
  console.log(`   GET  /api/jobs     – Job list (🔒 JWT)\n`);
});
