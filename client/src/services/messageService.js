import api from "./api";

export async function getConversations() {
  const res = await api.get("/messages/conversations");
  return res.data;
}

export async function getOrCreateConversation(recipientId) {
  const res = await api.post("/messages/conversations", { recipientId });
  return res.data;
}

export async function getMessages(conversationId) {
  const res = await api.get(`/messages/conversations/${conversationId}`);
  return res.data;
}
