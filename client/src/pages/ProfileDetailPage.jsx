import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import "../styles/profile.css";
import { getProfileById, toggleBlockUser } from "../services/userService";
import { sendInterest, respondToInterest, getInterestStatusWith } from "../services/interestService";
import { getOrCreateConversation } from "../services/messageService";
import ProfileDetailHero from "../components/profile/ProfileDetailHero";
import ProfileTabs, { TabContent } from "../components/profile/ProfileTabs";
import CompatibilityCard from "../components/profile/CompatibilityCard";
import GalleryTab from "../components/profile/GalleryTab";
import Spinner from "../components/shared/Spinner";
import ToastContainer from "../components/shared/ToastContainer";
import ReportModal from "../components/shared/ReportModal";
import { useNotifications } from "../hooks/useNotifications";
import { useSocket } from "../hooks/useSocket";
import { useAuth } from "../hooks/useAuth";

export default function ProfileDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { pushToast } = useNotifications();
  const { socket } = useSocket();
  const { user } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("about");

  // Interest state — driven entirely by the server so a page refresh always reflects
  // the true, current status instead of resetting to "Send interest".
  const [sentStatus, setSentStatus] = useState(null); // null | pending | accepted | declined
  const [receivedStatus, setReceivedStatus] = useState(null);
  const [receivedInterestId, setReceivedInterestId] = useState(null);
  const [sending, setSending] = useState(false);
  const [responding, setResponding] = useState(false);
  const [messaging, setMessaging] = useState(false);
  const [showReport, setShowReport] = useState(searchParams.get("report") === "1");
  const [blocked, setBlocked] = useState(false);
  const [blocking, setBlocking] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [profileData, interestData] = await Promise.all([
        getProfileById(id),
        getInterestStatusWith(id),
      ]);
      setProfile(profileData.profile);
      setSentStatus(interestData.sent?.status || null);
      setReceivedStatus(interestData.received?.status || null);
      setReceivedInterestId(interestData.received?._id || null);
    } catch (err) {
      pushToast("Could not load this profile.");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // Live-sync: if the other person sends/accepts/declines an interest with us while we're
  // sitting on this page, reflect it immediately instead of requiring a manual refresh.
  useEffect(() => {
    if (!socket) return;
    const handleUpdate = (payload) => {
      const otherId = String(payload.from) === String(id) ? payload.from : payload.to;
      if (String(otherId) !== String(id)) return;
      // Figure out which direction changed relative to "me" by re-fetching the pair —
      // cheap, and guarantees correctness rather than guessing from the payload alone.
      load();
    };
    socket.on("interest:update", handleUpdate);
    return () => socket.off("interest:update", handleUpdate);
  }, [socket, id, load]);

  const handleSendInterest = async () => {
    if (sending || sentStatus === "pending" || sentStatus === "accepted") return;
    setSending(true);
    try {
      await sendInterest(profile._id);
      setSentStatus("pending");
      pushToast(`Interest sent to ${profile.name}`);
    } catch (err) {
      pushToast(err.response?.data?.message || "Could not send interest.");
      if (err.response?.status === 409 && err.response?.data?.interest?.status) {
        setSentStatus(err.response.data.interest.status);
      }
    } finally {
      setSending(false);
    }
  };

  const handleRespond = async (status) => {
    if (responding || !receivedInterestId) return;
    setResponding(true);
    try {
      await respondToInterest(receivedInterestId, status);
      setReceivedStatus(status);
      pushToast(status === "accepted" ? `You accepted ${profile.name}'s interest` : `You declined ${profile.name}'s interest`);
    } catch (err) {
      pushToast(err.response?.data?.message || "Action failed.");
    } finally {
      setResponding(false);
    }
  };

  const handleBlock = async () => {
    if (blocking) return;
    setBlocking(true);
    try {
      const data = await toggleBlockUser(profile._id);
      setBlocked(data.blocked);
      pushToast(data.blocked ? `${profile.name} has been blocked.` : `${profile.name} has been unblocked.`);
    } catch (err) {
      pushToast(err.response?.data?.message || "Could not update block status.");
    } finally {
      setBlocking(false);
    }
  };

  const handleMessage = async () => {
    if (messaging) return;
    setMessaging(true);
    try {
      await getOrCreateConversation(profile._id);
      navigate("/messages", { state: { targetUserId: profile._id } });
    } catch (err) {
      pushToast(err.response?.data?.message || "Could not start conversation.");
    } finally {
      setMessaging(false);
    }
  };

  const interestBtnLabel = () => {
    if (sending) return "Sending…";
    if (sentStatus === "accepted") return "✓ Interest accepted";
    if (sentStatus === "pending") return "✓ Interest sent";
    if (sentStatus === "declined") return "Re-send interest";
    return "Send interest";
  };

  const TABS = ["about", "religious", "career", "family", "partner", "gallery"];

  if (loading) {
    return (
      <div className="profile-detail-loading-wrap">
        <Spinner label="Loading profile…" />
      </div>
    );
  }

  if (!profile) {
    return <div className="profile-detail-not-found">Profile not found.</div>;
  }

  return (
    <div className="fade-in profile-detail-page">
      <ProfileDetailHero
        profile={profile}
        onBack={() => navigate(-1)}
        onMessage={handleMessage}
        onSendInterest={handleSendInterest}
        interestSent={sentStatus === "accepted" || sentStatus === "pending"}
        interestBtnLabel={interestBtnLabel()}
        sending={sending}
        onReport={() => setShowReport(true)}
        needsMyResponse={receivedStatus === "pending" && !!receivedInterestId}
        onAccept={() => handleRespond("accepted")}
        onDecline={() => handleRespond("declined")}
        responding={responding}
        isConnected={sentStatus === "accepted" || receivedStatus === "accepted"}
        onBlock={handleBlock}
        blocked={blocked}
        blocking={blocking}
      />

      <ProfileTabs active={tab} onChange={setTab} tabs={TABS} />

      {tab === "gallery" ? (
        <GalleryTab
          gallery={profile.gallery || []}
          galleryVisible={profile.galleryVisible !== false}
          galleryCount={profile.galleryCount}
          isOwnProfile={String(profile._id) === String(user?._id)}
        />
      ) : (
        <TabContent active={tab} profile={profile} />
      )}

      {profile.matchPct != null && (
        <div className="compat-card-wrap">
          <CompatibilityCard matchPct={profile.matchPct} />
        </div>
      )}

      {showReport && (
        <ReportModal
          reportedUserId={profile._id}
          reportedName={profile.name}
          onClose={() => setShowReport(false)}
        />
      )}

      <ToastContainer />
    </div>
  );
}
