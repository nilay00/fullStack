const mongoose = require("mongoose");

const gallerySchema = new mongoose.Schema(
  { url: { type: String, default: "" }, caption: { type: String, default: "" } },
  { _id: true }
);

const partnerPrefsSchema = new mongoose.Schema(
  {
    ageMin: { type: Number, default: 18 },
    ageMax: { type: Number, default: 40 },
    sect: { type: String, default: "Any" },
    country: { type: String, default: "Any" },
    education: { type: String, default: "Any" },
    maritalStatus: { type: String, default: "Any" },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    gender: { type: String, enum: ["male", "female"], required: true },
    dob: { type: Date, required: true },

    // Photos — stored as real files on disk (backend/uploads/), only the
    // public URL path is saved here, never a base64 blob.
    avatar: { type: String, default: "" },
    avatarPrivacy: { type: String, enum: ["public", "connections", "private"], default: "public" },
    gallery: { type: [gallerySchema], default: [] },
    // Gallery privacy is a single, whole-gallery setting (not per photo).
    galleryPrivacy: { type: String, enum: ["public", "connections", "private"], default: "connections" },

    savedProfiles: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    sect: { type: String, default: "Sunni" },
    prayerFrequency: { type: String, default: "" },
    hijabBeard: { type: String, default: "" },
    country: { type: String, default: "" },
    city: { type: String, default: "" },
    education: { type: String, default: "" },
    profession: { type: String, default: "" },
    maritalStatus: { type: String, default: "Never married" },
    familyValues: { type: String, default: "" },
    aboutFamily: { type: String, default: "" },
    bio: { type: String, default: "" },
    partnerPrefs: { type: partnerPrefsSchema, default: () => ({}) },
    waliName: { type: String, default: "" },
    waliContact: { type: String, default: "" },
    waliSharesMessages: { type: Boolean, default: true },

    profileCompletion: { type: Number, default: 20 },
    isOnline: { type: Boolean, default: false },
    lastActive: { type: Date, default: Date.now },
    verified: { type: Boolean, default: false },
    role: { type: String, enum: ["user", "admin"], default: "user" },
  },
  { timestamps: true }
);

userSchema.virtual("age").get(function () {
  if (!this.dob) return null;
  const diff = Date.now() - this.dob.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
});

userSchema.set("toObject", { virtuals: true });
userSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("User", userSchema);
