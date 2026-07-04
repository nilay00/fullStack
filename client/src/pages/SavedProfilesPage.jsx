import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/browse.css";
import "../styles/pages.css";
import { getSavedProfiles, toggleSaveProfile } from "../services/userService";
import ProfileCard from "../components/profile/ProfileCard";
import Spinner from "../components/shared/Spinner";
import Icon from "../components/shared/Icon";
import ToastContainer from "../components/shared/ToastContainer";
import { useNotifications } from "../hooks/useNotifications";

export default function SavedProfilesPage() {
  const navigate = useNavigate();
  const { pushToast } = useNotifications();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSavedProfiles()
      .then(data => setProfiles(data.profiles))
      .catch(() => pushToast("Could not load saved profiles."))
      .finally(() => setLoading(false));
  }, []);

  const handleUnsave = async (id) => {
    try {
      await toggleSaveProfile(id);
      setProfiles(prev => prev.filter(p => p._id !== id));
      pushToast("Profile removed from saved.");
    } catch {
      pushToast("Could not unsave profile.");
    }
  };

  return (
    <div className="fade-in home-section">
      <div className="browse-main-header">
        <div>
          <h1 className="browse-main-title">
            <Icon name="bookmark" /> Saved profiles
          </h1>
          <span className="browse-main-count">{profiles.length} saved</span>
        </div>
        <button onClick={() => navigate("/browse")} className="sort-pill">
          <Icon name="magnifying-glass" /> Browse more
        </button>
      </div>

      {loading ? (
        <Spinner label="Loading saved profiles…" />
      ) : profiles.length === 0 ? (
        <div className="browse-empty-state">
          <Icon name="bookmark" size="2x" style={{ opacity: 0.3, marginBottom: 12 }} />
          <div>You haven't saved any profiles yet.</div>
          <button className="sort-pill" onClick={() => navigate("/browse")} style={{ marginTop: 12 }}>
            Start browsing
          </button>
        </div>
      ) : (
        <div className="profile-grid">
          {profiles.map(p => (
            <div key={p._id} style={{ position: "relative" }}>
              <ProfileCard profile={p} onToast={pushToast} />
              <button
                onClick={() => handleUnsave(p._id)}
                className="profile-card-save-btn saved"
                style={{ position: "absolute", top: 10, right: 10 }}
                title="Remove from saved"
              >
                <Icon name="bookmark" />
              </button>
            </div>
          ))}
        </div>
      )}
      <ToastContainer />
    </div>
  );
}
