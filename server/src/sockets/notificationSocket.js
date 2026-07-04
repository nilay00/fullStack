const Notification = require("../models/Notification");

function registerNotificationHandlers(io, socket) {
  const userId = socket.userId;

  socket.on("notification:markRead", async ({ notificationId }) => {
    try {
      if (!notificationId) return;
      await Notification.findOneAndUpdate({ _id: notificationId, user: userId }, { read: true });
      socket.emit("notification:updated", { id: notificationId, read: true });
    } catch (err) {
      console.error("notification:markRead error:", err.message);
    }
  });
}

module.exports = registerNotificationHandlers;
