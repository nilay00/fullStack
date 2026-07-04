import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/browse.css";
import { sendInterest, respondToInterest } from "../../services/interestService";
import { toggleSaveProfile } from "../../services/userService";
import Card from "../shared/Card";
import Avatar from "../shared/Avatar";
import Btn from "../shared/Btn";
import Icon from "../shared/Icon";
import { useSocket } from "../../hooks/useSocket";

export default function ProfileCard({ profile, onToast, initialSaved = false }) {
  const navigate = useNavigate();
  const { isOnline } = useSocket();

  // Interest state is seeded from the server (profile.sentStatus / profile.receivedStatus),
  // which is refetched whenever the browse list loads, so refreshing the page always shows
  // the true state instead of resetting to a plain "Send interest" button.
  const [sentStatus, setSentStatus] = useState(profile.sentStatus || null); // null | pending | accepted | declined
  const [receivedStatus, setReceivedStatus] = useState(profile.receivedStatus || null);
  const [receivedInterestId] = useState(profile.receivedInterestId || null);
  const [saved, setSaved] = useState(initialSaved);
  const [sending, setSending] = useState(false);
  const [responding, setResponding] = useState(false);
  const [saving, setSaving] = useState(false);

  const online = isOnline(profile._id) || profile.isOnline;

  const handleSendInterest = async (e) => {
    e.stopPropagation();
    if (sending || sentStatus === "pending" || sentStatus === "accepted") return;
    setSending(true);
    try {
      await sendInterest(profile._id);
      setSentStatus("pending");
      onToast && onToast(`Interest sent to ${profile.name}`);
    } catch (err) {
      const msg = err.response?.data?.message || "Could not send interest.";
      onToast && onToast(msg);
      // Server says one already exists (e.g. another tab sent it first) — trust the server.
      if (err.response?.status === 409 && err.response?.data?.interest?.status) {
        setSentStatus(err.response.data.interest.status);
      }
    } finally {
      setSending(false);
    }
  };

  const handleRespond = async (e, status) => {
    e.stopPropagation();
    if (responding || !receivedInterestId) return;
    setResponding(true);
    try {
      await respondToInterest(receivedInterestId, status);
      setReceivedStatus(status);
      onToast && onToast(status === "accepted" ? `You accepted ${profile.name}'s interest` : `You declined ${profile.name}'s interest`);
    } catch (err) {
      onToast && onToast(err.response?.data?.message || "Action failed.");
    } finally {
      setResponding(false);
    }
  };

  const handleSave = async (e) => {
    e.stopPropagation();
    if (saving) return;
    setSaving(true);
    try {
      const data = await toggleSaveProfile(profile._id);
      setSaved(data.saved);
      onToast && onToast(data.saved ? `${profile.name} saved` : "Removed from saved");
    } catch {
      onToast && onToast("Could not save profile.");
    } finally {
      setSaving(false);
    }
  };

  const sendBtnLabel = () => {
    if (sending) return "Sending…";
    if (sentStatus === "accepted") return "Interest accepted";
    if (sentStatus === "pending") return "Interest sent";
    if (sentStatus === "declined") return "Resend interest";
    return "Send interest";
  };

  // Someone sent ME a pending interest and I haven't responded yet — this takes priority
  // over the generic "Send interest" action since it needs my decision first.
  const needsMyResponse = receivedStatus === "pending" && receivedInterestId;

  return (
    <Card className="hover-lift" onClick={() => navigate(`/profile/${profile._id}`)}>
      <div className="profile-card-body">
        <div className="profile-card-avatar-wrap">
          <Avatar src={profile.avatar} name={profile.name} size={64} online={online} locked={profile.avatarVisible === false} />
        </div>
        <div className="profile-card-info">
          <div className="profile-card-top-row">
            <div>
              <div className="profile-card-name">{profile.name}, {profile.age}</div>
              <div className="profile-card-location">
                {profile.city ? `${profile.city}, ` : ""}{profile.country}
              </div>
            </div>
            {profile.matchPct != null && (
              <div className="profile-card-match">{profile.matchPct}%</div>
            )}
          </div>
          <div className="profile-card-tags">
            {profile.sect && <span className="tag">{profile.sect}</span>}
            {profile.education && <span className="tag">{profile.education}</span>}
            {profile.profession && <span className="tag">{profile.profession}</span>}
          </div>
          {needsMyResponse && (
            <div className="profile-card-incoming-badge">
              <Icon name="heart" prefix="fas" /> Sent you an interest
            </div>
          )}
        </div>
      </div>

      <div className="profile-card-actions">
        {needsMyResponse ? (
          <>
            <Btn
              variant="primary" size="sm" className="btn-full-flex"
              disabled={responding}
              onClick={(e) => handleRespond(e, "accepted")}
            >
              <Icon name="check" /> {responding ? "…" : "Accept"}
            </Btn>
            <Btn
              variant="outline" size="sm" className="btn-full-flex"
              disabled={responding}
              onClick={(e) => handleRespond(e, "declined")}
            >
              <Icon name="xmark" /> {responding ? "…" : "Decline"}
            </Btn>
          </>
        ) : (
          <Btn
            variant="primary" size="sm" className="btn-full-flex"
            disabled={sentStatus === "pending" || sentStatus === "accepted" || sending}
            onClick={handleSendInterest}
          >
            <Icon name="heart" prefix={sentStatus === "pending" || sentStatus === "accepted" ? "fas" : "far"} />
            {sendBtnLabel()}
          </Btn>
        )}
        <button
          onClick={handleSave}
          className={`profile-card-save-btn${saved ? " saved" : ""}`}
          title={saved ? "Remove from saved" : "Save profile"}
          disabled={saving}
        >
          <Icon name="bookmark" prefix={saved ? "fas" : "far"} />
        </button>
      </div>
    </Card>
  );
}
