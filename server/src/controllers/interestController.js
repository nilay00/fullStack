const Interest = require("../models/Interest");
const Notification = require("../models/Notification");
const User = require("../models/User");
const { canViewSync, getConnectedIds } = require("../utils/privacy");

function emitNotification(req, toUserId, payload) {
  const io = req.app.get("io");
  if (io) io.to(`user:${String(toUserId)}`).emit("notification:new", {
    _id: payload.id,
    read: false,
    ...payload,
  });
}

function emitInterestUpdate(req, interest) {
  const io = req.app.get("io");
  if (!io) return;
  const payload = {
    _id: interest._id,
    from: interest.from,
    to: interest.to,
    status: interest.status,
    updatedAt: interest.updatedAt,
  };
  io.to(`user:${String(interest.from)}`).emit("interest:update", payload);
  io.to(`user:${String(interest.to)}`).emit("interest:update", payload);
}

async function attachUsers(interests, key, fields, viewerId) {
  const otherIds = interests.map((i) => i[key]);
  const users = await User.find({ _id: { $in: otherIds } });
  const byId = {};
  users.forEach((u) => (byId[String(u._id)] = u));
  const connectedIds = await getConnectedIds(viewerId);

  return interests.map((i) => {
    const obj = i.toObject();
    const user = byId[String(i[key])];
    if (!user) return obj;
    const picked = { _id: user._id };
    fields.forEach((f) => (picked[f] = user[f]));
    if (fields.includes("avatar") && !canViewSync(user.avatarPrivacy, user._id, viewerId, connectedIds)) {
      picked.avatar = "";
    }
    obj[key] = picked;
    return obj;
  });
}

// POST /api/interests   { to, message }
async function sendInterest(req, res, next) {
  try {
    const { to, message } = req.body;
    if (!to) return res.status(400).json({ message: "Recipient (to) is required." });
    if (String(to) === String(req.user._id)) return res.status(400).json({ message: "You cannot send interest to yourself." });

    const target = await User.findById(to);
    if (!target) return res.status(404).json({ message: "Target user not found." });

    const existing = await Interest.findOne({ from: req.user._id, to });

    let interest;
    if (existing) {
      if (existing.status === "pending") {
        return res.status(409).json({ message: "Interest already sent to this profile.", interest: existing });
      }
      if (existing.status === "accepted") {
        return res.status(409).json({ message: "This interest was already accepted.", interest: existing });
      }
      existing.status = "pending";
      existing.message = message || "";
      interest = await existing.save();
    } else {
      interest = await Interest.create({ from: req.user._id, to, message: message || "" });
    }

    const notif = await Notification.create({
      user: to,
      type: "interest_received",
      fromUser: req.user._id,
      text: `${req.user.name} sent you an interest.`,
      link: `/profile/${req.user._id}`,
    });

    emitNotification(req, to, {
      id: notif._id,
      type: "interest_received",
      fromUser: { id: req.user._id, name: req.user.name, avatar: req.user.avatar },
      text: notif.text,
      link: notif.link,
      createdAt: notif.createdAt,
    });

    emitInterestUpdate(req, interest);

    res.status(201).json({ interest });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/interests/:id   { status: 'accepted' | 'declined' }
async function respondToInterest(req, res, next) {
  try {
    const { status } = req.body;
    if (!["accepted", "declined"].includes(status)) {
      return res.status(400).json({ message: "Status must be 'accepted' or 'declined'." });
    }

    const interest = await Interest.findById(req.params.id);
    if (!interest) return res.status(404).json({ message: "Interest not found." });
    if (String(interest.to) !== String(req.user._id)) {
      return res.status(403).json({ message: "You are not authorized to respond to this interest." });
    }

    interest.status = status;
    await interest.save();

    const notif = await Notification.create({
      user: interest.from,
      type: status === "accepted" ? "interest_accepted" : "interest_declined",
      fromUser: req.user._id,
      text: `${req.user.name} ${status} your interest.`,
      link: `/profile/${req.user._id}`,
    });

    emitNotification(req, interest.from, {
      id: notif._id,
      type: notif.type,
      fromUser: { id: req.user._id, name: req.user.name, avatar: req.user.avatar },
      text: notif.text,
      link: notif.link,
      createdAt: notif.createdAt,
    });

    emitInterestUpdate(req, interest);

    res.json({ interest });
  } catch (err) {
    next(err);
  }
}

// GET /api/interests/received
async function getReceivedInterests(req, res, next) {
  try {
    const interests = await Interest.find({ to: req.user._id }).sort({ createdAt: -1 });
    const attached = await attachUsers(interests, "from", ["name", "avatar", "age", "country", "sect", "education"], req.user._id);
    res.json({ interests: attached });
  } catch (err) {
    next(err);
  }
}

// GET /api/interests/sent
async function getSentInterests(req, res, next) {
  try {
    const interests = await Interest.find({ from: req.user._id }).sort({ createdAt: -1 });
    const attached = await attachUsers(interests, "to", ["name", "avatar", "age", "country", "sect", "education"], req.user._id);
    res.json({ interests: attached });
  } catch (err) {
    next(err);
  }
}

// GET /api/interests/status/:userId
async function getInterestStatusWith(req, res, next) {
  try {
    const [sent, received] = await Promise.all([
      Interest.findOne({ from: req.user._id, to: req.params.userId }),
      Interest.findOne({ from: req.params.userId, to: req.user._id }),
    ]);
    res.json({
      interest: sent || null,
      sent: sent || null,
      received: received || null,
    });
  } catch (err) {
    next(err);
  }
}


module.exports = { sendInterest, respondToInterest, getReceivedInterests, getSentInterests, getInterestStatusWith };
