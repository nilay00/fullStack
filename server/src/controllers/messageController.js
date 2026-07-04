const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const User = require("../models/User");
const { areConnected } = require("../utils/privacy");

async function contactView(userId, viewerId) {
  const u = await User.findById(userId);
  if (!u) return { _id: userId, name: "Unknown", avatar: "" };
  const avatarOk = String(u._id) === String(viewerId) || u.avatarPrivacy !== "private";
  return { _id: u._id, name: u.name, avatar: avatarOk ? u.avatar : "", isOnline: u.isOnline, lastActive: u.lastActive };
}

// GET /api/messages/conversations
async function getConversations(req, res, next) {
  try {
    const conversations = await Conversation.find({ participants: req.user._id }).sort({ lastMessageAt: -1 });

    const result = await Promise.all(conversations.map(async (c) => {
      const otherId = c.participants.find((p) => String(p) !== String(req.user._id));
      return {
        id: c._id,
        contact: await contactView(otherId, req.user._id),
        lastMessage: c.lastMessage,
        lastMessageAt: c.lastMessageAt,
        unread: c.unreadCounts.get(String(req.user._id)) || 0,
      };
    }));

    res.json({ conversations: result });
  } catch (err) {
    next(err);
  }
}

// GET /api/messages/conversations/:id
async function getMessages(req, res, next) {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) return res.status(404).json({ message: "Conversation not found." });
    if (!conversation.participants.some((p) => String(p) === String(req.user._id))) {
      return res.status(403).json({ message: "Not authorized to view this conversation." });
    }

    const messages = await Message.find({ conversation: conversation._id }).sort({ createdAt: 1 });

    conversation.unreadCounts.set(String(req.user._id), 0);
    await conversation.save();

    const populatedParticipants = await Promise.all(
      conversation.participants.map((p) => contactView(p, req.user._id))
    );

    const conversationObj = conversation.toObject();
    conversationObj.participants = populatedParticipants;

    res.json({ conversation: conversationObj, messages });
  } catch (err) {
    next(err);
  }
}

// POST /api/messages/conversations  { recipientId }  -> get or create conversation
// Messaging is only allowed between members whose interest has been mutually
// accepted — a standard, expected safety guarantee on a matrimonial site.
async function getOrCreateConversation(req, res, next) {
  try {
    const { recipientId } = req.body;
    if (!recipientId) return res.status(400).json({ message: "recipientId is required." });
    if (String(recipientId) === String(req.user._id)) {
      return res.status(400).json({ message: "You cannot message yourself." });
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) return res.status(404).json({ message: "User not found." });

    if (!(await areConnected(req.user._id, recipientId))) {
      return res.status(403).json({ message: "You can only message members once your interest has been accepted." });
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [req.user._id, recipientId], $size: 2 },
    });

    if (!conversation) {
      conversation = await Conversation.create({ participants: [req.user._id, recipientId] });
    }

    const populatedParticipants = await Promise.all(
      conversation.participants.map((p) => contactView(p, req.user._id))
    );
    const conversationObj = conversation.toObject();
    conversationObj.participants = populatedParticipants;

    res.json({ conversation: conversationObj });
  } catch (err) {
    next(err);
  }
}

module.exports = { getConversations, getMessages, getOrCreateConversation };
