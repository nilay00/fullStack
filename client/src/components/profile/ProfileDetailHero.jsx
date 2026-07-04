import "../../styles/profile.css";
import Avatar from "../shared/Avatar";
import Badge from "../shared/Badge";
import Btn from "../shared/Btn";
import Icon from "../shared/Icon";
import { useSocket } from "../../hooks/useSocket";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";

export default function ProfileDetailHero({
  profile, onBack, onMessage, onSendInterest, interestSent, interestBtnLabel, sending, onReport,
  needsMyResponse, onAccept, onDecline, responding, isConnected = false, onBlock, blocked = false, blocking = false,
}) {
  const { isOnline } = useSocket();
  const online = isOnline(profile._id) || profile.isOnline;
  const { user } = useContext(AuthContext);
  const isOwnProfile = user?._id === profile._id;

  return (
    <div className="detail-hero-card">
      <div className="detail-hero-banner" />
      <div className="detail-hero-inner">
        <div className="detail-hero-avatar-ring">
          <Avatar src={profile.avatar} name={profile.name} size={96} online={online} locked={profile.avatarVisible === false} />
        </div>

        <div className="detail-hero-info">
          <div className="detail-hero-top-row">
            <div>
              <h2 className="serif detail-hero-name">{profile.name}, {profile.age}</h2>
              <div className="detail-hero-sub">
                {profile.city ? `${profile.city}, ` : ""}{profile.country} {profile.profession ? `· ${profile.profession}` : ""}
              </div>
              <div className="detail-hero-badges">
                {profile.verified && <Badge color="brand">✓ Verified</Badge>}
                <Badge color="gray">{profile.sect}</Badge>
                <Badge color="gray">{profile.maritalStatus}</Badge>
                {online && <Badge color="brand">🟢 Online now</Badge>}
              </div>
            </div>
            <div className="detail-hero-actions">
              <Btn variant="outline" onClick={onBack}>← Back</Btn>
              {!isOwnProfile && (
                <>
                  {isConnected ? (
                    <Btn variant="secondary" onClick={onMessage}><Icon name="message" /> Message</Btn>
                  ) : (
                    <Btn variant="secondary" disabled title="You can message once your interest is accepted">
                      <Icon name="lock" /> Message
                    </Btn>
                  )}
                  {needsMyResponse ? (
                    <>
                      <Btn variant="primary" disabled={responding} onClick={onAccept}>
                        {responding ? "…" : "✓ Accept interest"}
                      </Btn>
                      <Btn variant="outline" disabled={responding} onClick={onDecline}>
                        {responding ? "…" : "✕ Decline"}
                      </Btn>
                    </>
                  ) : (
                    <Btn variant="primary" disabled={interestSent || sending} onClick={onSendInterest}>
                      {interestBtnLabel || (interestSent ? "✓ Interest sent" : sending ? "Sending…" : "Send interest")}
                    </Btn>
                  )}
                  <Btn variant="danger" size="sm" onClick={onReport}>🚩 Report</Btn>
                  <Btn variant="outline" size="sm" disabled={blocking} onClick={onBlock}>
                    <Icon name="user-slash" /> {blocked ? "Unblock" : "Block"}
                  </Btn>
                </>)}

            </div>
          </div>
          {needsMyResponse && (
            <div className="detail-hero-incoming-note">
              <Icon name="heart" prefix="fas" /> {profile.name} sent you an interest — respond above.
            </div>
          )}
        </div>
      </div>

      {profile.matchPct != null && (
        <div className="detail-stats-row">
          <Stat label="Compatibility" value={`${profile.matchPct}%`} />
          <Stat label="Age" value={profile.age} />
          <Stat label="Education" value={profile.education || "—"} />
          <Stat label="Status" value={profile.maritalStatus} />
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="detail-stat">
      <div className="detail-stat-value">{value}</div>
      <div className="detail-stat-label">{label}</div>
    </div>
  );
}
