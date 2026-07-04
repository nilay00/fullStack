const bcrypt = require("bcryptjs");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const { validateRegisterInput } = require("../utils/validators");
const { saveBase64Image } = require("../utils/imageStorage");

function publicUser(user) {
  if (!user) return user;
  const obj = typeof user.toObject === "function" ? user.toObject() : { ...user };
  delete obj.password;
  return obj;
}

async function register(req, res, next) {
  try {
    const errors = validateRegisterInput(req.body);
    if (errors.length) return res.status(400).json({ message: errors.join(" ") });

    const { name, email, password, gender, dob, country, city, photo } = req.body;

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ message: "An account with this email already exists." });

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    // Real profile photo, uploaded at sign-up — no cartoon-avatar fallback.
    // `photo` is a base64 data URL from the registration form; we persist it
    // as an actual file on disk and store only its URL path in MongoDB.
    let avatarUrl = "";
    if (photo) {
      try {
        avatarUrl = saveBase64Image(photo, "avatars");
      } catch (err) {
        return res.status(400).json({ message: err.message });
      }
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashed,
      gender,
      dob,
      country: country || "",
      city: city || "",
      avatar: avatarUrl,
    });

    const token = generateToken(user._id);
    res.status(201).json({ token, user: publicUser(user) });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password are required." });

    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    if (!user) return res.status(401).json({ message: "Invalid email or password." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid email or password." });

    user.isOnline = true;
    user.lastActive = new Date();
    await user.save();

    const token = generateToken(user._id);
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    next(err);
  }
}

async function getMe(req, res, next) {
  try {
    res.json({ user: publicUser(req.user) });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    req.user.isOnline = false;
    req.user.lastActive = new Date();
    await req.user.save();
    res.json({ message: "Logged out successfully." });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, getMe, logout, publicUser };
