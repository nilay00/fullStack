import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/editprofile.css";
import { useAuth } from "../hooks/useAuth";
import { updateMyProfile } from "../services/userService";
import { useNotifications } from "../hooks/useNotifications";
import Input from "../components/shared/Input";
import Select from "../components/shared/Select";
import Textarea from "../components/shared/Textarea";
import Btn from "../components/shared/Btn";
import Icon from "../components/shared/Icon";

const MAX_GALLERY = 6;

const SECTIONS = [
  { id: "basic", label: "Basic info", icon: "user" },
  { id: "photo", label: "Photos", icon: "camera" },
  { id: "religious", label: "Religious", icon: "star" },
  { id: "career", label: "Career", icon: "briefcase" },
  { id: "family", label: "Family", icon: "users" },
  { id: "guardian", label: "Guardian", icon: "shield-halved" },
  { id: "partner", label: "Partner prefs", icon: "heart" },
];

export default function EditProfilePage() {
  const { user, updateUserInContext } = useAuth();
  const { pushToast } = useNotifications();
  const navigate = useNavigate();

  // If the user lands here directly (e.g. bookmarked URL) before auth has hydrated, wait.
  if (!user) {
    return null;
  }

  return <EditProfileForm user={user} onSaved={(u) => { updateUserInContext(u); pushToast("Profile updated successfully!"); navigate("/dashboard"); }} onCancel={() => navigate(-1)} pushToast={pushToast} />;
}

function EditProfileForm({ user, onSaved, onCancel, pushToast }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: user.name || "",
    city: user.city || "",
    country: user.country || "",
    bio: user.bio || "",
    sect: user.sect || "Sunni",
    prayerFrequency: user.prayerFrequency || "",
    hijabBeard: user.hijabBeard || "",
    education: user.education || "",
    profession: user.profession || "",
    maritalStatus: user.maritalStatus || "Never married",
    familyValues: user.familyValues || "",
    aboutFamily: user.aboutFamily || "",
    waliName: user.waliName || "",
    waliContact: user.waliContact || "",
    partnerPrefs: {
      ageMin: user.partnerPrefs?.ageMin || 18,
      ageMax: user.partnerPrefs?.ageMax || 40,
      sect: user.partnerPrefs?.sect || "Any",
      country: user.partnerPrefs?.country || "Any",
      education: user.partnerPrefs?.education || "Any",
      maritalStatus: user.partnerPrefs?.maritalStatus || "Any",
    },
  });
  const [avatar, setAvatar] = useState(user.avatar || "");
  const [gallery, setGallery] = useState(
    (user.gallery || []).map(g => typeof g === "string" ? { url: g, caption: "" } : { url: g.url, caption: g.caption || "", _id: g._id })
  );
  const [activeSection, setActiveSection] = useState("basic");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [dirty, setDirty] = useState(false);
  const avatarInputRef = useRef(null);

  // Warn on browser navigation / tab close with unsaved changes — standard, professional
  // safeguard against losing a long form's worth of edits by accident.
  useEffect(() => {
    const handler = (e) => {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const set = (key, val) => { setForm(p => ({ ...p, [key]: val })); setDirty(true); };
  const setPref = (key, val) => { setForm(p => ({ ...p, partnerPrefs: { ...p.partnerPrefs, [key]: val } })); setDirty(true); };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { setAvatar(ev.target.result); setDirty(true); };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleGalleryAdd = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      if (gallery.length >= MAX_GALLERY) return;
      const reader = new FileReader();
      reader.onload = ev => {
        setGallery(prev => prev.length < MAX_GALLERY
          ? [...prev, { url: ev.target.result, caption: "" }]
          : prev
        );
        setDirty(true);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const handleGalleryCaption = (idx, caption) => {
    setGallery(prev => prev.map((g, i) => i === idx ? { ...g, caption } : g));
    setDirty(true);
  };

  const handleGalleryRemove = (idx) => {
    setGallery(prev => prev.filter((_, i) => i !== idx));
    setDirty(true);
  };

  const handleCancel = () => {
    if (dirty && !window.confirm("Discard unsaved changes?")) return;
    onCancel();
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const data = await updateMyProfile({ ...form, avatar, gallery });
      setDirty(false);
      onSaved(data.user);
    } catch (err) {
      setError(err.response?.data?.message || "Could not save changes.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fade-in edit-page">
      <div className="edit-page-header">
        <div>
          <h1 className="edit-page-title"><Icon name="pencil" /> Edit profile</h1>
          <p className="edit-page-subtitle">Keep your profile accurate and complete — it helps you get better matches.</p>
        </div>
        <div className="edit-page-header-actions">
          <Btn variant="outline" onClick={handleCancel}>Cancel</Btn>
          <Btn variant="primary" disabled={saving} onClick={handleSave}>
            {saving ? "Saving…" : <><Icon name="check" /> Save changes</>}
          </Btn>
        </div>
      </div>

      <div className="edit-page-layout">
        <nav className="edit-page-nav">
          {SECTIONS.map(s => (
            <button
              key={s.id}
              className={`edit-page-nav-item${activeSection === s.id ? " active" : ""}`}
              onClick={() => setActiveSection(s.id)}
            >
              <Icon name={s.icon} /> {s.label}
            </button>
          ))}
        </nav>

        <div className="edit-page-content">
          {activeSection === "basic" && (
            <section className="edit-page-panel">
              <h2 className="edit-page-panel-title">Basic info</h2>
              <Input label="Full name" value={form.name} onChange={e => set("name", e.target.value)} />
              <div className="form-grid-2">
                <Input label="City" value={form.city} onChange={e => set("city", e.target.value)} placeholder="e.g. Mumbai" />
                <Input label="Country" value={form.country} onChange={e => set("country", e.target.value)} placeholder="e.g. India" />
              </div>
              <Textarea label="About me" value={form.bio} onChange={e => set("bio", e.target.value)} placeholder="Tell potential matches about yourself…" rows={5} />
            </section>
          )}

          {activeSection === "photo" && (
            <section className="edit-page-panel">
              <h2 className="edit-page-panel-title">Profile picture</h2>
              <div className="profile-pic-edit-wrap">
                <div className="profile-pic-preview">
                  {avatar
                    ? <img src={avatar} alt="Profile" className="profile-pic-img" />
                    : <div className="profile-pic-placeholder"><Icon name="user" size="2x" /></div>
                  }
                  <button className="profile-pic-change-btn" onClick={() => avatarInputRef.current?.click()}>
                    <Icon name="camera" /> Change photo
                  </button>
                  <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarChange} />
                </div>
                <div className="profile-pic-privacy-link">
                  <div className="field-label">Who can see your photos?</div>
                  <p className="profile-pic-privacy-hint">
                    Profile picture and gallery visibility are managed together in one place.
                  </p>
                  <Btn variant="outline" size="sm" onClick={() => navigate("/privacy-settings")}>
                    <Icon name="lock" /> Manage privacy settings
                  </Btn>
                </div>
              </div>

              <h2 className="edit-page-panel-title edit-page-panel-title-gap">Gallery (up to {MAX_GALLERY})</h2>
              <div className="gallery-grid">
                {gallery.map((g, idx) => (
                  <div key={g._id || idx} className="gallery-item gallery-item-edit">
                    <img src={`${import.meta.env.VITE_SOCKET_URL}${g.url}`} alt={`Gallery ${idx + 1}`} className="gallery-img" />
                    <button className="gallery-remove-btn" onClick={() => handleGalleryRemove(idx)}>
                      <Icon name="xmark" />
                    </button>
                    <div className="gallery-item-controls">
                      <input
                        value={g.caption}
                        onChange={e => handleGalleryCaption(idx, e.target.value)}
                        placeholder="Caption (optional)"
                        className="gallery-caption-input"
                      />
                    </div>
                  </div>
                ))}
                {gallery.length < MAX_GALLERY && (
                  <label className="gallery-add-btn">
                    <Icon name="camera" size="lg" />
                    <span>Add photo</span>
                    <input type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handleGalleryAdd} />
                  </label>
                )}
              </div>
              <div className="gallery-hint">
                <Icon name="lock" /> Your whole gallery is shown or hidden together — set who can see it in
                <button type="button" className="inline-link-btn" onClick={() => navigate("/privacy-settings")}> Privacy settings</button>.
              </div>
            </section>
          )}

          {activeSection === "religious" && (
            <section className="edit-page-panel">
              <h2 className="edit-page-panel-title">Religious</h2>
              <div className="form-grid-2">
                <Select label="Sect" value={form.sect} onChange={e => set("sect", e.target.value)} options={["Sunni", "Shia", "Other"]} />
                <Input label="Prayer frequency" value={form.prayerFrequency} onChange={e => set("prayerFrequency", e.target.value)} placeholder="e.g. 5 times daily" />
              </div>
              <Input label="Hijab / Beard" value={form.hijabBeard} onChange={e => set("hijabBeard", e.target.value)} placeholder="e.g. Yes, always" />
            </section>
          )}

          {activeSection === "career" && (
            <section className="edit-page-panel">
              <h2 className="edit-page-panel-title">Career</h2>
              <div className="form-grid-2">
                <Select label="Education" value={form.education} onChange={e => set("education", e.target.value)} options={["", "Bachelor's", "Master's", "PhD", "Professional (MBBS/LLB/etc)", "Other"]} />
                <Input label="Profession" value={form.profession} onChange={e => set("profession", e.target.value)} placeholder="e.g. Doctor" />
              </div>
            </section>
          )}

          {activeSection === "family" && (
            <section className="edit-page-panel">
              <h2 className="edit-page-panel-title">Family</h2>
              <Select label="Marital status" value={form.maritalStatus} onChange={e => set("maritalStatus", e.target.value)} options={["Never married", "Divorced", "Widowed"]} />
              <Input label="Family values" value={form.familyValues} onChange={e => set("familyValues", e.target.value)} placeholder="e.g. Traditional, close-knit" />
              <Textarea label="About my family" value={form.aboutFamily} onChange={e => set("aboutFamily", e.target.value)} placeholder="Describe your family background…" rows={4} />
            </section>
          )}

          {activeSection === "guardian" && (
            <section className="edit-page-panel">
              <h2 className="edit-page-panel-title">Guardian</h2>
              <div className="form-grid-2">
                <Input label="Guardian name" value={form.waliName} onChange={e => set("waliName", e.target.value)} placeholder="e.g. Father's name" />
                <Input label="Guardian contact" value={form.waliContact} onChange={e => set("waliContact", e.target.value)} placeholder="Phone or email" />
              </div>
            </section>
          )}

          {activeSection === "partner" && (
            <section className="edit-page-panel">
              <h2 className="edit-page-panel-title">Partner preferences</h2>
              <div className="form-grid-2">
                <Input label="Min age" type="number" value={form.partnerPrefs.ageMin} onChange={e => setPref("ageMin", e.target.value)} />
                <Input label="Max age" type="number" value={form.partnerPrefs.ageMax} onChange={e => setPref("ageMax", e.target.value)} />
              </div>
              <div className="form-grid-2">
                <Select label="Preferred sect" value={form.partnerPrefs.sect} onChange={e => setPref("sect", e.target.value)} options={["Any", "Sunni", "Shia"]} />
                <Select label="Preferred country" value={form.partnerPrefs.country} onChange={e => setPref("country", e.target.value)} options={["Any", "India", "Pakistan", "Saudi Arabia", "UK", "Canada", "UAE"]} />
              </div>
            </section>
          )}

          {error && <div className="auth-error"><Icon name="triangle-exclamation" /> {error}</div>}

          <div className="edit-page-footer">
            <Btn variant="outline" onClick={handleCancel}>Cancel</Btn>
            <Btn variant="primary" disabled={saving} onClick={handleSave}>
              {saving ? "Saving…" : <><Icon name="check" /> Save changes</>}
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}
