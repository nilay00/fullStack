const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }],
    lastMessage: { type: String, default: "" },
    lastMessageAt: { type: Date, default: Date.now },
    lastMessageSender: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    // userId (string) -> unread count
    unreadCounts: { type: Map, of: Number, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Conversation", conversationSchema);
