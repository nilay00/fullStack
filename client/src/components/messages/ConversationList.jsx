import { useState, useMemo } from "react";
import "../../styles/messages.css";
import Avatar from "../shared/Avatar";
import Icon from "../shared/Icon";
import { formatMessageTime } from "../../utils/dateHelpers";
import { useSocket } from "../../hooks/useSocket";

export default function ConversationList({ conversations, activeId, onSelect, isMobile }) {
  const { isOnline } = useSocket();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) =>
      c.contact.name?.toLowerCase().includes(q) ||
      c.lastMessage?.toLowerCase().includes(q)
    );
  }, [conversations, query]);

  return (
    <aside
      className={`conv-list${isMobile ? " mobile" : ""}`}
      style={{
        "--conv-list-width": isMobile ? "100%" : "300px",
        "--conv-list-height": isMobile ? "calc(100vh - 60px)" : "100%",
      }}
    >
      <div className="conv-list-header">
        <h2 className="conv-list-title">Messages</h2>
        <div className="conv-search-wrap">
          <Icon name="magnifying-glass" className="conv-search-icon" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search conversations…"
            className="conv-search-input"
          />
          {query && (
            <button className="conv-search-clear" onClick={() => setQuery("")} aria-label="Clear search">
              <Icon name="xmark" />
            </button>
          )}
        </div>
      </div>

      <div className="conv-list-scroll">
        {conversations.length === 0 ? (
          <div className="conv-list-empty">
            No conversations yet. Send an interest and start chatting once it's accepted!
          </div>
        ) : filtered.length === 0 ? (
          <div className="conv-list-empty">No conversations match "{query}".</div>
        ) : (
          filtered.map((c) => {
            const online = isOnline(c.contact._id) || c.contact.isOnline;
            return (
              <div
                key={c.id}
                onClick={() => onSelect(c.id)}
                className={`conv-item hover-row${!isMobile && c.id === activeId ? " active" : ""}`}
              >
                <Avatar src={c.contact.avatar} name={c.contact.name} size={46} online={online} />
                <div className="conv-item-info">
                  <div className="conv-item-top-row">
                    <span className={`conv-item-name${c.unread ? " unread" : ""}`}>{c.contact.name}</span>
                    <span className="conv-item-time">{formatMessageTime(c.lastMessageAt)}</span>
                  </div>
                  <div className="conv-item-preview">{c.lastMessage || "Say hello!"}</div>
                </div>
                <div className="conv-item-right">
                  {c.unread > 0 && <div className="conv-item-unread-badge">{c.unread}</div>}
                  {isMobile && <span className="conv-item-chevron">›</span>}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="conv-privacy-notice">
        <div className="conv-privacy-title"><Icon name="lock" /> Privacy notice</div>
        <div className="conv-privacy-text">Conversations are kept confidential between matched members.</div>
      </div>
    </aside>
  );
}
