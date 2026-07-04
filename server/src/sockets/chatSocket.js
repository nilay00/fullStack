const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const Notification = require("../models/Notification");
const User = require("../models/User");

function registerChatHandlers(io, socket) {
  const userId = socket.userId;

  socket.on("chat:join", ({ conversationId }) => {
    if (!conversationId) return;
    socket.join(`conversation:${conversationId}`);
    _markDelivered(conversationId, userId, io);
  });

  socket.on("chat:leave", ({ conversationId }) => {
    if (!conversationId) return;
    socket.leave(`conversation:${conversationId}`);
  });

  socket.on("chat:typing", ({ conversationId, isTyping }) => {
    if (!conversationId) return;
    socket.to(`conversation:${conversationId}`).emit("chat:typing", {
      conversationId, userId, isTyping: !!isTyping,
    });
  });

  // Send a message (text or media)
  socket.on("chat:send", async ({ conversationId, text, mediaType, mediaUrl }, callback) => {
    try {
      if (!conversationId) {
        if (callback) callback({ error: "conversationId is required." });
        return;
      }
      if (!text?.trim() && !mediaUrl) {
        if (callback) callback({ error: "text or media is required." });
        return;
      }

      const conversation = await Conversation.findById(conversationId);
      if (!conversation) { if (callback) callback({ error: "Conversation not found." }); return; }
      if (!conversation.participants.some(p => String(p) === userId)) {
        if (callback) callback({ error: "Not authorized." }); return;
      }

      const recipientId = conversation.participants.find(p => String(p) !== userId);

      const roomSockets = await io.in(`conversation:${conversationId}`).fetchSockets();
      const recipientInRoom = roomSockets.some(s => s.userId === String(recipientId));
      const initialStatus = recipientInRoom ? "delivered" : "sent";

      // Media (images) sent in chat are base64 data URLs from the client;
      // persist them as real files rather than bloating the database.
      let storedMediaUrl = mediaUrl || "";
      if (storedMediaUrl && storedMediaUrl.startsWith("data:")) {
        const { saveBase64Image } = require("../utils/imageStorage");
        try {
          storedMediaUrl = saveBase64Image(storedMediaUrl, "chat");
        } catch (err) {
          if (callback) callback({ error: err.message });
          return;
        }
      }

      const message = await Message.create({
        conversation: conversationId,
        sender: userId,
        text: text?.trim() || "",
        mediaType: mediaType || "none",
        mediaUrl: storedMediaUrl,
        status: initialStatus,
        readBy: [userId],
        deliveredTo: recipientInRoom ? [userId, recipientId] : [userId],
      });

      const preview = mediaType === "image" ? "📷 Photo" : (text?.trim() || "");
      conversation.lastMessage = preview;
      conversation.lastMessageAt = new Date();
      conversation.lastMessageSender = userId;
      const currentUnread = conversation.unreadCounts.get(String(recipientId)) || 0;
      conversation.unreadCounts.set(String(recipientId), currentUnread + 1);
      await conversation.save();

      const sender = await User.findById(userId);

      const payload = {
        id: message._id,
        conversationId,
        sender: { id: userId, name: sender.name, avatar: sender.avatar },
        text: message.text,
        mediaType: message.mediaType,
        mediaUrl: message.mediaUrl,
        status: message.status,
        createdAt: message.createdAt,
      };

      io.to(`conversation:${conversationId}`).emit("chat:message", payload);
      io.to(`user:${recipientId}`).emit("chat:message", payload);

      const notif = await Notification.create({
        user: recipientId,
        type: "new_message",
        fromUser: userId,
        text: `${sender.name} sent you a message.`,
        link: `/messages`,
      });
      io.to(`user:${recipientId}`).emit("notification:new", {
        id: notif._id, type: "new_message",
        fromUser: { id: userId, name: sender.name, avatar: sender.avatar },
        text: notif.text, link: notif.link, createdAt: notif.createdAt,
      });

      if (callback) callback({ success: true, message: payload });
    } catch (err) {
      console.error("chat:send error:", err.message);
      if (callback) callback({ error: "Failed to send message." });
    }
  });

  // Mark as seen (user actively looking at chat)
  socket.on("chat:seen", async ({ conversationId }) => {
    try {
      if (!conversationId) return;
      await Message.updateMany(
        { conversation: conversationId, readBy: { $ne: userId } },
        { $addToSet: { readBy: userId }, $set: { status: "seen" } }
      );
      const conversation = await Conversation.findById(conversationId);
      if (conversation) {
        conversation.unreadCounts.set(userId, 0);
        await conversation.save();
      }
      socket.to(`conversation:${conversationId}`).emit("chat:seen", { conversationId, seenBy: userId });
    } catch (err) {
      console.error("chat:seen error:", err.message);
    }
  });

  // Legacy read handler alias
  socket.on("chat:read", async ({ conversationId }) => {
    try {
      if (!conversationId) return;
      const conversation = await Conversation.findById(conversationId);
      if (conversation) {
        conversation.unreadCounts.set(userId, 0);
        await conversation.save();
      }
      socket.to(`conversation:${conversationId}`).emit("chat:read", { conversationId, readerId: userId });
    } catch (err) { /* silent */ }
  });
}

async function _markDelivered(conversationId, userId, io) {
  try {
    const result = await Message.updateMany(
      { conversation: conversationId, deliveredTo: { $ne: userId }, sender: { $ne: userId } },
      { $addToSet: { deliveredTo: userId }, $set: { status: "delivered" } }
    );
    if (result.modifiedCount > 0) {
      io.to(`conversation:${conversationId}`).emit("chat:delivered", { conversationId, deliveredTo: userId });
    }
  } catch (err) { /* silent */ }
}

module.exports = registerChatHandlers;
