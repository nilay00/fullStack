const mongoose = require("mongoose");

// Self-hosted MongoDB — Community Edition, running on your own machine/server.
// This is free forever; no Atlas account or subscription needed. Set
// MONGO_URI in .env if your local Mongo runs somewhere other than the default
// (e.g. a Docker container, or a real server once you deploy).
async function connectDB() {
  const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/nikahconnect";
  try {
    await mongoose.connect(uri);
    console.log(`MongoDB connected -> ${uri}`);
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    console.error("Is MongoDB running? Start it locally with `mongod` or `docker run -d -p 27017:27017 mongo`.");
    process.exit(1);
  }
}

module.exports = connectDB;
