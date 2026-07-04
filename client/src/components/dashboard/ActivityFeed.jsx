import { useNavigate } from "react-router-dom";
import "../../styles/dashboard.css";
import { timeAgo } from "../../utils/dateHelpers";
import { useNotifications } from "../../hooks/useNotifications";
import Avatar from "../shared/Avatar";
import Icon from "../shared/Icon";

const LIMIT = 10;

export default function ActivityFeed() {
  const { notifications } = useNotifications();
  const navigate = useNavigate();
  const recent = notifications.slice(0, LIMIT);

  return (
    <div className="dashboard-section">
      <div className="dashboard-section-header">
        <h3 className="dashboard-section-title activity-feed-title">Recent activity</h3>
        {notifications.length > LIMIT && (
          <button
            className="filter-reset-btn"
            onClick={() => navigate("/activity")}
          >
            View all ({notifications.length}) <Icon name="arrow-right" />
          </button>
        )}
      </div>
      {recent.length === 0 ? (
        <div className="activity-feed-empty">No recent activity.</div>
      ) : (
        <div className="activity-feed-list">
          {recent.map((n) => (
            <div
              key={n._id || n.id}
              className="activity-feed-item"
              onClick={() => n.link && navigate(n.link)}
              style={{ cursor: n.link ? "pointer" : "default" }}
            >
              <Avatar src={n.fromUser?.avatar} name={n.fromUser?.name || "?"} size={28} />
              <div className="activity-feed-item-body">
                <div className="activity-feed-item-text">{n.text}</div>
                <div className="activity-feed-item-time">
                  <Icon name="clock" prefix="far" /> {timeAgo(n.createdAt)}
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
