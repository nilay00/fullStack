import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/dashboard.css";
import { getNotifications, markAllNotificationsRead } from "../services/notificationService";
import { timeAgo } from "../utils/dateHelpers";
import Avatar from "../components/shared/Avatar";
import Btn from "../components/shared/Btn";
import Spinner from "../components/shared/Spinner";
import Icon from "../components/shared/Icon";

const TYPE_ICONS = {
  interest_received: "heart",
  interest_accepted: "circle-check",
  interest_declined: "circle-xmark",
  new_message: "message",
  profile_view: "eye",
  system: "bell",
};
const TYPE_LABELS = {
  interest_received: "Interest received",
  interest_accepted: "Interest accepted",
  interest_declined: "Interest declined",
  new_message: "New message",
  profile_view: "Profile view",
  system: "System",
};

export default function ActivityPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getNotifications()
      .then(data => setNotifications(data.notifications))
      .finally(() => setLoading(false));
  }, []);

  const handleMarkAll = async () => {
    await markAllNotificationsRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  if (loading) return (
    <div className="dashboard-page">
      <Spinner label="Loading activity…" />
    </div>
  );

  return (
    <div className="fade-in dashboard-page">
      <div className="browse-main-header">
        <h1 className="browse-main-title">
          <Icon name="bell" /> All activity
        </h1>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn variant="outline" size="sm" onClick={handleMarkAll}>Mark all read</Btn>
          <Btn variant="outline" size="sm" onClick={() => navigate("/dashboard")}>
            <Icon name="arrow-left" /> Back
          </Btn>
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="browse-empty-state">No activity yet.</div>
      ) : (
        <div className="dashboard-section">
          {notifications.map(n => (
            <div
              key={n._id}
              className={`activity-feed-item hover-row${n.read ? "" : " activity-unread"}`}
              onClick={() => n.link && navigate(n.link)}
              style={{ cursor: n.link ? "pointer" : "default", padding: "12px 0", borderBottom: "1px solid var(--border)" }}
            >
              <div className="activity-type-icon">
                <Icon name={TYPE_ICONS[n.type] || "bell"} />
              </div>
              {n.fromUser && <Avatar src={n.fromUser.avatar} name={n.fromUser.name} size={36} />}
              <div className="activity-feed-item-body">
                <div className="activity-feed-item-text">{n.text}</div>
                <div className="activity-feed-item-time">
                  <Icon name="clock" prefix="far" /> {timeAgo(n.createdAt)} · {TYPE_LABELS[n.type] || "Notification"}
                </div>
              </div>
              {!n.read && <span className="activity-unread-dot" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
