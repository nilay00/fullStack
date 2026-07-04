import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/editprofile.css";
import "../styles/privacy.css";
import { useAuth } from "../hooks/useAuth";
import { useNotifications } from "../hooks/useNotifications";
import { updatePrivacySettings } from "../services/userService";
import Icon from "../components/shared/Icon";
import Btn from "../components/shared/Btn";
import Avatar from "../components/shared/Avatar";

const OPTIONS = [
  { value: "public", label: "Everyone", desc: "Any member browsing NikahConnect can see this." },
  { value: "connections", label: "Connections only", desc: "Only members whose interest with you has been accepted." },
  { value: "private", label: "Only me", desc: "Hidden from everyone else on the platform." },
];

function PrivacyOptionGroup({ value, onChange }) {
  return (
    <div className="privacy-option-group">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={`privacy-option${value === opt.value ? " selected" : ""}`}
          onClick={() => onChange(opt.value)}
        >
          <div className="privacy-option-icon"><Icon name={opt.value === "public" ? "earth-americas" : opt.value === "connections" ? "users" : "lock"} /></div>
          <div className="privacy-option-text">
            <div className="privacy-option-label">{opt.label}</div>
            <div className="privacy-option-desc">{opt.desc}</div>
          </div>
          {value === opt.value && <Icon name="circle-check" className="privacy-option-check" />}
        </button>
      ))}
    </div>
  );
}

export default function PrivacySettingsPage() {
  const { user, updateUserInContext } = useAuth();
  const { pushToast } = useNotifications();
  const navigate = useNavigate();

  const [avatarPrivacy, setAvatarPrivacy] = useState(user?.avatarPrivacy || "public");
  const [galleryPrivacy, setGalleryPrivacy] = useState(user?.galleryPrivacy || "connections");
  const [saving, setSaving] = useState(false);
  const dirty = avatarPrivacy !== (user?.avatarPrivacy || "public") || galleryPrivacy !== (user?.galleryPrivacy || "connections");

  if (!user) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = await updatePrivacySettings({ avatarPrivacy, galleryPrivacy });
      updateUserInContext(data.user);
      pushToast("Privacy settings updated.");
    } catch (err) {
      pushToast(err.response?.data?.message || "Could not update privacy settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fade-in edit-page privacy-settings-page">
      <div className="edit-page-header">
        <div>
          <h1 className="edit-page-title"><Icon name="lock" /> Privacy settings</h1>
          <p className="edit-page-subtitle">Control exactly who can see your profile picture and gallery.</p>
        </div>
        <div className="edit-page-header-actions">
          <Btn variant="outline" onClick={() => navigate(-1)}>Back</Btn>
          <Btn variant="primary" disabled={saving || !dirty} onClick={handleSave}>
            {saving ? "Saving…" : <><Icon name="check" /> Save changes</>}
          </Btn>
        </div>
      </div>

      <div className="privacy-settings-layout">
        <section className="edit-page-panel privacy-panel">
          <div className="privacy-panel-header">
            <Avatar src={user.avatar} name={user.name} size={56} />
            <div>
              <h2 className="edit-page-panel-title">Profile picture</h2>
              <p className="privacy-panel-sub">Who can see the main photo on your profile.</p>
            </div>
          </div>
          <PrivacyOptionGroup value={avatarPrivacy} onChange={setAvatarPrivacy} />
        </section>

        <section className="edit-page-panel privacy-panel">
          <div className="privacy-panel-header">
            <div className="privacy-gallery-icon"><Icon name="image" /></div>
            <div>
              <h2 className="edit-page-panel-title">Gallery photos</h2>
              <p className="privacy-panel-sub">
                Applies to your whole gallery ({(user.gallery || []).length} photo{(user.gallery || []).length === 1 ? "" : "s"}) — not set per photo.
              </p>
            </div>
          </div>
          <PrivacyOptionGroup value={galleryPrivacy} onChange={setGalleryPrivacy} />
        </section>

        <div className="privacy-info-box">
          <Icon name="shield-halved" />
          <div>
            Members who can't see a locked photo will instead see a blurred placeholder with a lock icon —
            your photo is never sent to anyone who isn't allowed to view it.
          </div>
        </div>
      </div>
    </div>
  );
}
