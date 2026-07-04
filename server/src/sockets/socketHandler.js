const jwt = require("jsonwebtoken");
const User = require("../models/User");
const registerChatHandlers = require("./chatSocket");
const registerNotificationHandlers = require("./notificationSocket");

// userId -> Set of socket ids (a user can have multiple tabs/devices)
const onlineUsers = new Map();

function addOnlineSocket(userId, socketId) {
  if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
  onlineUsers.get(userId).add(socketId);
}

function removeOnlineSocket(userId, socketId) {
  const set = onlineUsers.get(userId);
  if (!set) return false;
  set.delete(socketId);
  if (set.size === 0) {
    onlineUsers.delete(userId);
    return true;
  }
  return false;
}

function isUserOnline(userId) {
  return onlineUsers.has(String(userId));
}

function initSocket(io) {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(" ")[1];
      if (!token) return next(new Error("Authentication token missing."));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (!user) return next(new Error("User not found."));

      socket.userId = String(user._id);
      socket.userName = user.name;
      next();
    } catch (err) {
      next(new Error("Invalid or expired token."));
    }
  });

  io.on("connection", async (socket) => {
    const userId = socket.userId;
    console.log(`Socket connected: ${socket.userName} (${userId}) [${socket.id}]`);

    addOnlineSocket(userId, socket.id);
    socket.join(`user:${userId}`);

    await User.findByIdAndUpdate(userId, { isOnline: true, lastActive: new Date() });
    socket.broadcast.emit("presence:update", { userId, isOnline: true });

    registerChatHandlers(io, socket);
    registerNotificationHandlers(io, socket);

    socket.on("disconnect", async () => {
      console.log(`Socket disconnected: ${socket.userName} (${userId}) [${socket.id}]`);
      const fullyOffline = removeOnlineSocket(userId, socket.id);
      if (fullyOffline) {
        await User.findByIdAndUpdate(userId, { isOnline: false, lastActive: new Date() });
        io.emit("presence:update", { userId, isOnline: false, lastActive: new Date() });
      }
    });
  });
}

module.exports = { initSocket, isUserOnline, onlineUsers };
