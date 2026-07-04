import "../../styles/profile.css";

const ALL_TABS = [
  { id: "about", label: "About" },
  { id: "religious", label: "Religious" },
  { id: "career", label: "Career" },
  { id: "family", label: "Family" },
  { id: "partner", label: "Partner seeks" },
  { id: "gallery", label: "Gallery" },
];

export default function ProfileTabs({ active, onChange, tabs }) {
  const visibleTabs = tabs
    ? ALL_TABS.filter((t) => tabs.includes(t.id))
    : ALL_TABS;

  return (
    <div className="profile-tabs-bar">
      {visibleTabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`profile-tab-btn${active === t.id ? " active" : ""}`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function TabContent({ active, profile }) {
  if (active === "about") {
    return (
      <Section title="About">
        <p className="tab-bio-text">{profile.bio || "No bio added yet."}</p>
      </Section>
    );
  }
  if (active === "religious") {
    return (
      <Section title="Religious background">
        <Row label="Sect" value={profile.sect} />
        <Row label="Prayer frequency" value={profile.prayerFrequency || "—"} />
        <Row label="Hijab / Beard" value={profile.hijabBeard || "—"} />
      </Section>
    );
  }
  if (active === "career") {
    return (
      <Section title="Career & education">
        <Row label="Education" value={profile.education || "—"} />
        <Row label="Profession" value={profile.profession || "—"} />
      </Section>
    );
  }
  if (active === "family") {
    return (
      <Section title="Family">
        <Row label="Family values" value={profile.familyValues || "—"} />
        <p className="tab-bio-text tab-bio-text-spaced">{profile.aboutFamily || "No family details added yet."}</p>
      </Section>
    );
  }
  if (active === "partner") {
    const p = profile.partnerPrefs || {};
    return (
      <Section title="What they're looking for">
        <Row label="Age range" value={`${p.ageMin || "18"} – ${p.ageMax || "99"}`} />
        <Row label="Sect" value={p.sect || "Any"} />
        <Row label="Country" value={p.country || "Any"} />
        <Row label="Education" value={p.education || "Any"} />
        <Row label="Marital status" value={p.maritalStatus || "Any"} />
      </Section>
    );
  }
  return null;
}

function Section({ title, children }) {
  return (
    <div className="tab-section">
      <h3 className="tab-section-title">{title}</h3>
      {children}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="tab-row">
      <span className="tab-row-label">{label}</span>
      <span className="tab-row-value">{value}</span>
    </div>
  );
}
