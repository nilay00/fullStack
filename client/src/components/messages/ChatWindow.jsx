import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/messages.css";
import { formatMessageDate } from "../../utils/dateHelpers";
import { getMessages } from "../../services/messageService";
import { useSocket } from "../../hooks/useSocket";
import { useAuth } from "../../hooks/useAuth";
import { useTypingIndicator } from "../../hooks/useTypingIndicator";
import Spinner from "../shared/Spinner";
import Icon from "../shared/Icon";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";

const EMOJI_LIST = ["😊","😂","❤️","🥰","😍","🤔","😢","😭","🙏","✨","🎉","👍","🤲","☝️","🌙","⭐","🌹","💐","🕊️","🤍"];

export default function ChatWindow({ conversation, onBack, isMobile }) {
  const { user } = useAuth();
  const { emit, on, off, isOnline } = useSocket();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [showEmoji, setShowEmoji] = useState(false);
  const [mediaPreview, setMediaPreview] = useState(null); // { url, file }
  const chatRef = useRef(null);
  const fileInputRef = useRef(null);
  const emojiRef = useRef(null);

  const contact = conversation.contact;
  const conversationId = conversation.id;
  const online = isOnline(contact._id) || contact.isOnline;

  const { remoteIsTyping, notifyTyping, stopTyping } = useTypingIndicator(conversationId, contact._id);

  const scrollToBottom = useCallback((smooth = true) => {
    setTimeout(() => {
      chatRef.current?.scrollTo({ top: 999999, behavior: smooth ? "smooth" : "auto" });
    }, 50);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getMessages(conversationId)
      .then(data => {
        if (cancelled) return;
        setMessages(data.messages);
        scrollToBottom(false);
      })
      .finally(() => setLoading(false));

    emit("chat:join", { conversationId });
    emit("chat:seen", { conversationId });

    return () => {
      cancelled = true;
      emit("chat:leave", { conversationId });
      stopTyping();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  useEffect(() => {
    const handler = (msg) => {
      if (msg.conversationId !== conversationId) return;
      setMessages(prev => {
        if (prev.some(m => String(m._id || m.id) === String(msg.id))) return prev;
        return [...prev, { _id: msg.id, sender: msg.sender, text: msg.text, mediaType: msg.mediaType, mediaUrl: msg.mediaUrl, status: msg.status, createdAt: msg.createdAt }];
      });
      scrollToBottom();
      if (String(msg.sender?.id) !== String(user._id)) {
        emit("chat:seen", { conversationId });
      }
    };
    on("chat:message", handler);
    return () => off("chat:message", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, on, off, emit, user._id]);

  // Update status of our messages when they're seen
  useEffect(() => {
    const handler = ({ conversationId: cid, seenBy }) => {
      if (cid !== conversationId) return;
      setMessages(prev => prev.map(m =>
        String(m.sender?.id || m.sender) === String(user._id) ? { ...m, status: "seen" } : m
      ));
    };
    on("chat:seen", handler);
    return () => off("chat:seen", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, on, off, user._id]);

  // Update status when delivered
  useEffect(() => {
    const handler = ({ conversationId: cid }) => {
      if (cid !== conversationId) return;
      setMessages(prev => prev.map(m =>
        String(m.sender?.id || m.sender) === String(user._id) && m.status === "sent"
          ? { ...m, status: "delivered" } : m
      ));
    };
    on("chat:delivered", handler);
    return () => off("chat:delivered", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, on, off, user._id]);

  // Close the emoji picker when clicking anywhere outside it.
  useEffect(() => {
    if (!showEmoji) return;
    const handler = (e) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target)) setShowEmoji(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showEmoji]);

  const handleMediaSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setMediaPreview({ url: ev.target.result, file });
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text && !mediaPreview) return;

    emit("chat:send", {
      conversationId,
      text,
      mediaType: mediaPreview ? "image" : "none",
      mediaUrl: mediaPreview?.url || "",
    }, (res) => {
      if (res?.error) console.error("Send failed:", res.error);
    });

    setInput("");
    setMediaPreview(null);
    setShowEmoji(false);
    stopTyping();
    scrollToBottom();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleInputChange = (e) => { setInput(e.target.value); notifyTyping(); };

  let lastDate = null;

  return (
    <main className="chat-window" style={{ "--chat-window-height": isMobile ? "calc(100vh - 60px)" : "100%" }}>
      {/* Header */}
      <div className="chat-header">
        {isMobile && (
          <button onClick={onBack} className="chat-back-btn">
            <Icon name="arrow-left" />
          </button>
        )}
        {contact.avatar
          ? <img src={`${import.meta.env.VITE_SOCKET_URL}${contact.avatar}`} alt={contact.name} className="chat-header-avatar" />
          : <div className="chat-header-avatar chat-header-avatar-fallback">{contact.name?.[0] || "?"}</div>
        }
        <div className="chat-header-info">
          <div className="chat-header-name chat-header-name-link" onClick={() => navigate(`/profile/${contact._id}`)}>
            {contact.name}
          </div>
          <div className={`chat-header-status${online ? " online" : ""}`}>
            {remoteIsTyping
              ? <><Icon name="ellipsis" /> typing…</>
              : online
                ? <><Icon name="circle" style={{ "--notif-color": "#22c55e", fontSize: 8 }} /> Online now</>
                : <><Icon name="clock" prefix="far" /> Offline</>
            }
          </div>
        </div>
        <div className="chat-header-actions">
          <button className="chat-report-btn" onClick={() => navigate(`/profile/${contact._id}?report=1`)} title="Report">
            <Icon name="flag" /> Report
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={chatRef} className="chat-scroll-area">
        {loading ? (
          <Spinner label="Loading conversation…" />
        ) : (
          <>
            <div className="chat-system-notice">
              <span className="chat-system-notice-pill">
                <Icon name="shield-halved" /> Messages are moderated for community safety
              </span>
            </div>

            {messages.map((m) => {
              const isMe = String(m.sender?.id || m.sender?._id || m.sender) === String(user._id);
              const dateLabel = formatMessageDate(m.createdAt);
              const showDate = dateLabel !== lastDate;
              lastDate = dateLabel;
              return (
                <div key={m._id || m.id}>
                  {showDate && (
                    <div className="chat-date-separator">
                      <span className="chat-date-pill">{dateLabel}</span>
                    </div>
                  )}
                  <MessageBubble
                    message={{ ...m, senderAvatar: isMe ? user.avatar : contact.avatar }}
                    isMe={isMe}
                    contact={contact}
                    isMobile={isMobile}
                  />
                </div>
              );
            })}

            {remoteIsTyping && (
              <div className="msg-row them">
                {contact.avatar
                  ? <img src={`${import.meta.env.VITE_SOCKET_URL}${contact.avatar}`} alt={contact.name} className="msg-avatar" />
                  : <div className="msg-avatar msg-avatar-fallback">{contact.name?.[0] || "?"}</div>
                }
                <TypingIndicator />
              </div>
            )}
          </>
        )}
      </div>

      {/* Media preview */}
      {mediaPreview && (
        <div className="chat-media-preview">
          <img src={mediaPreview.url} alt="preview" className="chat-media-preview-img" />
          <button className="chat-media-remove" onClick={() => setMediaPreview(null)}>
            <Icon name="xmark" />
          </button>
        </div>
      )}

      {/* Emoji picker */}
      {showEmoji && (
        <div className="chat-emoji-picker" ref={emojiRef}>
          {EMOJI_LIST.map(emoji => (
            <button key={emoji} className="emoji-btn" onClick={() => { setInput(p => p + emoji); setShowEmoji(false); }}>
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div className="chat-input-bar">
        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleMediaSelect} style={{ display: "none" }} />
        <button type="button" className="chat-tool-btn" onClick={() => fileInputRef.current?.click()} title="Send image">
          <Icon name="image" />
        </button>
        <button type="button" className={`chat-tool-btn${showEmoji ? " active" : ""}`} onClick={() => setShowEmoji(o => !o)} title="Emoji">
          <Icon name="face-smile" prefix="far" />
        </button>
        <input
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={stopTyping}
          placeholder="Type a message…"
          className="chat-text-input"
        />
        <button type="button" onClick={handleSend} className="chat-send-btn" title="Send" disabled={!input.trim() && !mediaPreview}>
          <Icon name="paper-plane" />
        </button>
      </div>
    </main>
  );
}
