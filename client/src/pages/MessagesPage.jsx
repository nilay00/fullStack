import { useState, useEffect, useCallback } from "react";
import "../styles/messages.css";
import { getConversations } from "../services/messageService";
import { useLocation } from "react-router-dom";
import { useSocket } from "../hooks/useSocket";
import ConversationList from "../components/messages/ConversationList";
import ChatWindow from "../components/messages/ChatWindow";
import Spinner from "../components/shared/Spinner";

export default function MessagesPage() {
  const { on, off, clearUnread } = useSocket();
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const location = useLocation();
  const targetUserId = location.state?.targetUserId;

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getConversations();
      setConversations(data.conversations);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    clearUnread(); // clear nav badge when user visits messages page
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handler = (msg) => {
      setConversations((prev) => {
        const idx = prev.findIndex((c) => c.id === msg.conversationId);
        if (idx === -1) {
          load();
          return prev;
        }
        const updated = [...prev];
        const isActive = msg.conversationId === activeId;
        updated[idx] = {
          ...updated[idx],
          lastMessage: msg.text,
          lastMessageAt: msg.createdAt,
          unread: isActive ? 0 : (updated[idx].unread || 0) + 1,
        };
        const [moved] = updated.splice(idx, 1);
        return [moved, ...updated];
      });
    };
    const unsubscribe = on("chat:message", handler);
    return () => off("chat:message", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [on, off, activeId]);

useEffect(() => {
  if (!targetUserId || conversations.length === 0) return;

  const targetConversation = conversations.find(
    c => c.contact._id === targetUserId
  );

  if (targetConversation) {
    setActiveId(targetConversation.id);
  }
}, [targetUserId, conversations]);
useEffect(() => {
  if (targetUserId) return;

  if (!isMobile && conversations.length > 0 && !activeId) {
    setActiveId(conversations[0].id);
  }
}, [targetUserId, isMobile, conversations, activeId]);

  const handleSelect = (id) => {
    setActiveId(id);
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, unread: 0 } : c)));
  };

  const activeConv = conversations.find((c) => c.id === activeId);
  const showList = isMobile && !activeId;
  const showChat = !isMobile || !!activeId;


  if (loading) {
    return (
      <div className="messages-loading-wrap">
        <Spinner label="Loading messages…" />
      </div>
    );
  }

  return (
    <div className="fade-in messages-page-root">
      {(!isMobile || showList) && (
        <ConversationList
          conversations={conversations}
          activeId={activeId}
          onSelect={handleSelect}
          isMobile={isMobile}
        />
      )}
      {(!isMobile || showChat) && activeConv && (
        <ChatWindow conversation={activeConv} onBack={() => setActiveId(null)} isMobile={isMobile} />
      )}
      {!isMobile && !activeConv && conversations.length > 0 && (
        <div className="chat-empty-state">Select a conversation to start chatting</div>
      )}
      {conversations.length === 0 && !isMobile && (
        <div className="chat-empty-state">No conversations yet. Visit a profile and click "Message" to start one.</div>
      )}
    </div>
  );
}
