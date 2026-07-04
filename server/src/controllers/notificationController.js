const Notification = require("../models/Notification");
const User = require("../models/User");

async function withFromUser(n) {
  const obj = n.toObject();
  if (!obj.fromUser) return obj;
  const u = await User.findById(obj.fromUser);
  if (!u) return obj;
  obj.fromUser = { _id: u._id, name: u.name, avatar: u.avatar };
  return obj;
}

// GET /api/notifications
async function getNotifications(req, res, next) {
  try {
    const raw = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50);
    const notifications = await Promise.all(raw.map(withFromUser));
    const unreadCount = await Notification.countDocuments({ user: req.user._id, read: false });
    res.json({ notifications, unreadCount });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/notifications/:id/read
async function markAsRead(req, res, next) {
  try {
    const notif = await Notification.findOne({ _id: req.params.id, user: req.user._id });
    if (!notif) return res.status(404).json({ message: "Notification not found." });
    notif.read = true;
    await notif.save();
    res.json({ notification: notif });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/notifications/read-all
async function markAllAsRead(req, res, next) {
  try {
    await Notification.updateMany({ user: req.user._id, read: false }, { $set: { read: true } });
    res.json({ message: "All notifications marked as read." });
  } catch (err) {
    next(err);
  }
}

module.exports = { getNotifications, markAsRead, markAllAsRead };
