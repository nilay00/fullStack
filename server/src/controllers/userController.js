const User = require("../models/User");
const Notification = require("../models/Notification");
const Interest = require("../models/Interest");
const { publicUser } = require("./authController");
const { applyPrivacySync, getConnectedIds, applyPrivacy } = require("../utils/privacy");
const { saveBase64Image, deleteLocalImage } = require("../utils/imageStorage");

// Given a viewer and a list of other user ids, returns a map keyed by the other user's id:
//   { sentStatus, sentInterestId, receivedStatus, receivedInterestId }
async function buildInterestMap(viewerId, otherUserIds) {
  const ids = otherUserIds.map((id) => String(id));
  if (ids.length === 0) return {};

  const [sentByMe, sentToMe] = await Promise.all([
    Interest.find({ from: viewerId, to: { $in: otherUserIds } }),
    Interest.find({ to: viewerId, from: { $in: otherUserIds } }),
  ]);

  const map = {};
  ids.forEach((id) => {
    map[id] = { sentStatus: null, sentInterestId: null, receivedStatus: null, receivedInterestId: null };
  });
  sentByMe.forEach((i) => {
    map[String(i.to)].sentStatus = i.status;
    map[String(i.to)].sentInterestId = i._id;
  });
  sentToMe.forEach((i) => {
    map[String(i.from)].receivedStatus = i.status;
    map[String(i.from)].receivedInterestId = i._id;
  });
  return map;
}

function calcCompletion(u) {
  const fields = [
    u.bio, u.education, u.profession, u.aboutFamily, u.familyValues,
    u.waliName, u.avatar, u.city, u.prayerFrequency,
  ];
  const filled = fields.filter(f => f && String(f).trim().length > 0).length;
  const hasGalleryPhoto = Array.isArray(u.gallery) && u.gallery.length > 0;
  const baseScore = (filled / fields.length) * 80;
  const galleryScore = hasGalleryPhoto ? 10 : 0;
  return Math.round(10 + baseScore + galleryScore);
}

function calcMatchPct(me, other) {
  let score = 50;
  if (!me.partnerPrefs) return score;
  const p = me.partnerPrefs;
  if (p.sect === "Any" || p.sect === other.sect) score += 15;
  if (p.country === "Any" || p.country === other.country) score += 10;
  if (p.education === "Any" || p.education === other.education) score += 10;
  if (p.maritalStatus === "Any" || p.maritalStatus === other.maritalStatus) score += 10;
  const age = other.age;
  if (age != null && age >= (p.ageMin || 18) && age <= (p.ageMax || 99)) score += 15;
  return Math.min(99, score);
}

// GET /api/users/browse  (filterable list, opposite gender, excludes self)
async function browseUsers(req, res, next) {
  try {
    const { sect, country, education, maritalStatus, ageMin, ageMax, sort } = req.query;
    const oppositeGender = req.user.gender === "male" ? "female" : "male";

    const query = {
      _id: { $ne: req.user._id, $nin: req.user.blockedUsers || [] },
      gender: oppositeGender,
      blockedUsers: { $ne: req.user._id },
    };
    if (sect && sect !== "Any") query.sect = sect;
    if (country && country !== "Any") query.country = country;
    if (education && education !== "Any") query.education = education;
    if (maritalStatus && maritalStatus !== "Any") query.maritalStatus = maritalStatus;

    let users = await User.find(query).limit(200);

    const min = ageMin ? parseInt(ageMin, 10) : 18;
    const max = ageMax ? parseInt(ageMax, 10) : 99;
    users = users.filter((u) => {
      const age = u.age;
      return age == null || (age >= min && age <= max);
    });

    const [interestMap, connectedIds] = await Promise.all([
      buildInterestMap(req.user._id, users.map((u) => u._id)),
      getConnectedIds(req.user._id),
    ]);

    let results = users.map((u) => ({
      ...applyPrivacySync(publicUser(u), req.user._id, connectedIds),
      matchPct: calcMatchPct(req.user, u),
      ...interestMap[String(u._id)],
    }));

    if (sort === "age") results.sort((a, b) => (a.age || 0) - (b.age || 0));
    else if (sort === "active") results.sort((a, b) => (b.isOnline ? 1 : 0) - (a.isOnline ? 1 : 0));
    else results.sort((a, b) => b.matchPct - a.matchPct);

    res.json({ count: results.length, profiles: results });
  } catch (err) {
    next(err);
  }
}

// GET /api/users/:id
async function getUserById(req, res, next) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "Profile not found." });

    // Record a profile view notification — skip self-views, throttle to once per hour per viewer
    if (String(user._id) !== String(req.user._id)) {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentView = await Notification.findOne({
        user: user._id,
        type: "profile_view",
        fromUser: req.user._id,
        createdAt: { $gte: oneHourAgo },
      });

      if (!recentView) {
        const notif = await Notification.create({
          user: user._id,
          type: "profile_view",
          fromUser: req.user._id,
          text: `${req.user.name} viewed your profile.`,
          link: `/profile/${req.user._id}`,
        });
        const io = req.app.get("io");
        if (io) {
          io.to(`user:${String(user._id)}`).emit("notification:new", {
            id: notif._id,
            _id: notif._id,
            type: "profile_view",
            fromUser: { id: req.user._id, name: req.user.name, avatar: req.user.avatar },
            text: notif.text,
            link: notif.link,
            read: false,
            createdAt: notif.createdAt,
          });
        }
      }
    }

    const data = await applyPrivacy(publicUser(user), req.user._id);
    data.matchPct = calcMatchPct(req.user, user);
    if (String(user._id) !== String(req.user._id)) {
      const interestMap = await buildInterestMap(req.user._id, [user._id]);
      Object.assign(data, interestMap[String(user._id)]);
    }
    res.json({ profile: data });
  } catch (err) {
    next(err);
  }
}

// PUT /api/users/me
async function updateMyProfile(req, res, next) {
  try {
    const allowed = [
      "name", "sect", "prayerFrequency", "hijabBeard", "country", "city",
      "education", "profession", "maritalStatus", "familyValues", "aboutFamily",
      "bio", "partnerPrefs", "waliName", "waliContact", "waliSharesMessages",
    ];
    const user = req.user;
    for (const key of allowed) {
      if (req.body[key] !== undefined) user[key] = req.body[key];
    }

    // Avatar: accept either a fresh base64 upload or leave untouched.
    if (req.body.avatar !== undefined) {
      try {
        user.avatar = saveBase64Image(req.body.avatar, "avatars");
      } catch (err) {
        return res.status(400).json({ message: err.message });
      }
    }

    // Gallery: array of { url, caption }. Each url may be a fresh base64 upload
    // or an existing "/uploads/..." path (left as-is).
    if (Array.isArray(req.body.gallery)) {
      try {
        user.gallery = req.body.gallery.slice(0, 6).map((g) => ({
          url: saveBase64Image(g.url, "gallery"),
          caption: g.caption || "",
        }));
      } catch (err) {
        return res.status(400).json({ message: err.message });
      }
    }

    user.profileCompletion = calcCompletion(user);
    await user.save();

    res.json({ user: publicUser(user) });
  } catch (err) {
    next(err);
  }
}

// PUT /api/users/me/privacy   { avatarPrivacy, galleryPrivacy }
async function updatePrivacySettings(req, res, next) {
  try {
    const { avatarPrivacy, galleryPrivacy } = req.body;
    const valid = ["public", "connections", "private"];
    if (avatarPrivacy !== undefined) {
      if (!valid.includes(avatarPrivacy)) return res.status(400).json({ message: "Invalid avatar privacy value." });
      req.user.avatarPrivacy = avatarPrivacy;
    }
    if (galleryPrivacy !== undefined) {
      if (!valid.includes(galleryPrivacy)) return res.status(400).json({ message: "Invalid gallery privacy value." });
      req.user.galleryPrivacy = galleryPrivacy;
    }
    await req.user.save();
    res.json({ user: publicUser(req.user) });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/users/me/gallery/:photoId
async function deleteGalleryPhoto(req, res, next) {
  try {
    const photo = req.user.gallery.id(req.params.photoId);
    if (photo) {
      deleteLocalImage(photo.url);
      photo.deleteOne();
    }
    await req.user.save();
    res.json({ user: publicUser(req.user) });
  } catch (err) {
    next(err);
  }
}

// POST /api/users/save/:id  — toggle save/unsave a profile
async function toggleSaveProfile(req, res, next) {
  try {
    const targetId = req.params.id;
    if (String(targetId) === String(req.user._id)) {
      return res.status(400).json({ message: "You cannot save your own profile." });
    }
    const alreadySaved = req.user.savedProfiles.some((id) => String(id) === String(targetId));
    if (alreadySaved) {
      req.user.savedProfiles = req.user.savedProfiles.filter((id) => String(id) !== String(targetId));
    } else {
      req.user.savedProfiles.push(targetId);
    }
    await req.user.save();
    res.json({ saved: !alreadySaved, savedProfiles: req.user.savedProfiles });
  } catch (err) {
    next(err);
  }
}

// GET /api/users/saved  — get all saved profiles
async function getSavedProfiles(req, res, next) {
  try {
    const ids = req.user.savedProfiles || [];
    const users = await User.find({ _id: { $in: ids } });
    const connectedIds = await getConnectedIds(req.user._id);
    const profiles = users.map((u) => applyPrivacySync(publicUser(u), req.user._id, connectedIds));
    res.json({ profiles });
  } catch (err) {
    next(err);
  }
}

// POST /api/users/block/:id — toggle block/unblock a user (stops them appearing
// in browse, and stops them being able to message you).
async function toggleBlockUser(req, res, next) {
  try {
    const targetId = req.params.id;
    if (String(targetId) === String(req.user._id)) {
      return res.status(400).json({ message: "You cannot block yourself." });
    }
    const alreadyBlocked = req.user.blockedUsers.some((id) => String(id) === String(targetId));
    if (alreadyBlocked) {
      req.user.blockedUsers = req.user.blockedUsers.filter((id) => String(id) !== String(targetId));
    } else {
      req.user.blockedUsers.push(targetId);
    }
    await req.user.save();
    res.json({ blocked: !alreadyBlocked, blockedUsers: req.user.blockedUsers });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  browseUsers, getUserById, updateMyProfile, calcMatchPct, toggleSaveProfile,
  getSavedProfiles, updatePrivacySettings, deleteGalleryPhoto, toggleBlockUser,
};
