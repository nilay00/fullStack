import "../../styles/messages.css";
import { formatMessageTime } from "../../utils/dateHelpers";
import Icon from "../shared/Icon";

export default function MessageBubble({ message, isMe, contact, isMobile }) {
  const who = isMe ? "me" : "them";

  const StatusIcon = () => {
    if (!isMe) return null;
    if (message.status === "seen") return <Icon name="check-double" className="msg-status-icon seen" />;
    if (message.status === "delivered") return <Icon name="check-double" className="msg-status-icon delivered" />;
    return <Icon name="check" className="msg-status-icon sent" />;
  };

  return (
    <div className={`msg-row ${who}`}>
      {!isMe && (
        <div className="msg-avatar-wrap">
          {contact.avatar
            ? <img src={`${import.meta.env.VITE_SOCKET_URL}${contact.avatar}`} alt={contact.name} className="msg-avatar" />
            : <div className="msg-avatar msg-avatar-fallback">{contact.name?.[0] || "?"}</div>
          }
        </div>
      )}
      <div className="msg-bubble-col" style={{ "--bubble-max-width": isMobile ? "80%" : "65%" }}>
        {/* Media */}
        {message.mediaType === "image" && message.mediaUrl && (
          <div className={`msg-media-wrap ${who}`}>
            <img
              src={message.mediaUrl}
              alt="shared"
              className="msg-media-img"
              onClick={() => window.open(message.mediaUrl, "_blank")}
            />
          </div>
        )}
        {/* Text */}
        {message.text && (
          <div className={`msg-bubble ${who}`}>{message.text}</div>
        )}
        <div className={`msg-meta ${who}`}>
          <span className="msg-time">{formatMessageTime(message.createdAt)}</span>
          <StatusIcon />
        </div>
      </div>
      {isMe && (
        message.senderAvatar
          ? <img src={`${import.meta.env.VITE_SOCKET_URL}${message.senderAvatar}`} alt="me" className="msg-avatar" />
          : <div className="msg-avatar msg-avatar-fallback">Me</div>
      )}
    </div>
  );
}
