import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/dashboard.css";
import { useAuth } from "../hooks/useAuth";
import { getReceivedInterests, getSentInterests } from "../services/interestService";
import Avatar from "../components/shared/Avatar";
import Btn from "../components/shared/Btn";
import Spinner from "../components/shared/Spinner";
import ToastContainer from "../components/shared/ToastContainer";
import StatsCard from "../components/dashboard/StatsCard";
import InterestsReceived from "../components/dashboard/InterestsReceived";
import ActivityFeed from "../components/dashboard/ActivityFeed";
import { useNotifications } from "../hooks/useNotifications";
import { useSocket } from "../hooks/useSocket";

export default function DashboardPage() {
  const { user } = useAuth();
  const { pushToast } = useNotifications();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const [received, setReceived] = useState([]);
  const [sent, setSent] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [r, s] = await Promise.all([getReceivedInterests(), getSentInterests()]);
      setReceived(r.interests);
      setSent(s.interests);
    } catch (err) {
      pushToast("Could not load dashboard data.");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => load();
    socket.on("interest:update", handleUpdate);
    return () => socket.off("interest:update", handleUpdate);
  }, [socket, load]);

  const handleInterestUpdate = (id, status) => {
    setReceived((prev) => prev.map((i) => (i._id === id ? { ...i, status } : i)));
  };

  const pendingCount = received.filter((i) => i.status === "pending").length;

  return (
    <div className="fade-in dashboard-page">
      <div className="dashboard-stats-row">
        <StatsCard icon="💌" label="Interests received" value={received.length} />
        <StatsCard icon="⏳" label="Pending responses" value={pendingCount} />
        <StatsCard icon="📤" label="Interests sent" value={sent.length} />
        <StatsCard icon="✅" label="Profile complete" value={`${user?.profileCompletion || 0}%`} />
      </div>

      <div className="dashboard-grid">
        <div>
          <div className="dashboard-section">
            <div className="dashboard-section-header">
              <span className="dashboard-section-title">Interests received</span>
            </div>
            {loading ? <Spinner label="Loading…" /> : (
              <InterestsReceived interests={received} onUpdate={handleInterestUpdate} onToast={pushToast} />
            )}
          </div>

          <div className="dashboard-section">
            <div className="dashboard-section-header">
              <span className="dashboard-section-title">Interests sent</span>
            </div>
            {loading ? <Spinner label="Loading…" /> : (
              <SentInterestsList sent={sent} />
            )}
          </div>
        </div>

        <div>
          <div className="dashboard-profile-card">
            <div className="dashboard-profile-header">
              <Avatar src={user?.avatar} name={user?.name} size={56} online />
              <div>
                <div className="dashboard-profile-name">{user?.name}</div>
                <div className="dashboard-profile-sub">{user?.city ? `${user.city}, ` : ""}{user?.country}</div>
              </div>
            </div>
            <div className="completion-bar-track">
              <div className="completion-bar-fill" style={{ "--fill-pct": `${user?.profileCompletion || 0}%` }} />
            </div>
            <div className="completion-bar-label">{user?.profileCompletion || 0}% complete</div>
            <div className="dashboard-edit-btn-row">
              <Btn variant="primary" full size="sm" onClick={() => navigate("/profile/edit")}>
                ✏️ Edit profile
              </Btn>
            </div>
          </div>

          <div className="dashboard-sidebar-gap">
            <ActivityFeed />
          </div>
        </div>
      </div>

      <ToastContainer />
    </div>
  );
}

function SentInterestsList({ sent }) {
  const navigate = useNavigate();
  if (!sent.length) return <div className="interests-empty">No interests sent yet.</div>;
  return (
    <div className="interests-list">
      {sent.map((i) => (
        <div key={i._id} className="interest-row" onClick={() => navigate(`/profile/${i.to._id}`)}>
          <Avatar src={i.to.avatar} name={i.to.name} size={40} />
          <div className="interest-row-info">
            <div className="interest-row-name">{i.to.name}</div>
            <div className="interest-row-sub">{i.to.country}</div>
          </div>
          <span className={`interest-status-pill ${i.status}`}>
            {i.status === "pending" ? "⏳ Pending" : i.status === "accepted" ? "✓ Accepted" : "✕ Declined"}
          </span>
        </div>
      ))}
    </div>
  );
}
