const express = require("express");
const {
  getConversations,
  getMessages,
  getOrCreateConversation,
} = require("../controllers/messageController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.use(protect);

router.get("/conversations", getConversations);
router.post("/conversations", getOrCreateConversation);
router.get("/conversations/:id", getMessages);

module.exports = router;
