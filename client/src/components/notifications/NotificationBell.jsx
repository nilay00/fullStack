import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/layout.css";
import { timeAgo } from "../../utils/dateHelpers";
import { useNotifications } from "../../hooks/useNotifications";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Avatar from "../shared/Avatar";

const TYPE_ICON = {
  interest_received: ["fas", "heart"],
  interest_accepted: ["fas", "circle-check"],
  interest_declined: ["fas", "circle-xmark"],
  new_message: ["fas", "message"],
  profile_view: ["fas", "eye"],
  system: ["fas", "bell"],
};

export default function NotificationBell() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleClickNotif = (n) => {
    const id = n._id || n.id;
    if (!n.read) markRead(id);
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  return (
    <div ref={ref} className="notif-bell-wrap">
      <button onClick={() => setOpen((o) => !o)} className="notif-bell-btn">
        <FontAwesomeIcon icon={["fas", "bell"]} />
        {unreadCount > 0 && <span className="notif-bell-dot" />}
      </button>

      {open && (
        <div className="notif-dropdown">
          <div className="notif-dropdown-header">
            <span className="notif-dropdown-title">Notifications</span>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="notif-mark-all-btn">Mark all read</button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="notif-empty">No notifications yet</div>
          ) : (
            notifications.map((n) => (
              <div
                key={n._id || n.id}
                onClick={() => handleClickNotif(n)}
                className={`notif-item hover-row${n.read ? "" : " unread"}`}
              >
                {n.fromUser ? (
                  <Avatar src={n.fromUser.avatar} name={n.fromUser.name} size={34} />
                ) : (
                  <div className="notif-item-icon">
                    <FontAwesomeIcon icon={TYPE_ICON[n.type] || ["fas", "bell"]} />
                  </div>
                )}
                <div className="notif-item-body">
                  <div className="notif-item-text">{n.text}</div>
                  <div className="notif-item-time">{timeAgo(n.createdAt)}</div>
                </div>
                {!n.read && <span className="notif-item-unread-dot" />}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
