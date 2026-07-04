import { useNavigate } from "react-router-dom";
import "../styles/pages.css";
import { useAuth } from "../hooks/useAuth";
import Badge from "../components/shared/Badge";
import Btn from "../components/shared/Btn";

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="fade-in">
      <div className="profile-completion-banner">
        <div className="profile-completion-text">
          🕌 Your profile is {user?.profileCompletion || 20}% complete — finish it to get better matches.
        </div>
        <Btn size="xs" variant="secondary" onClick={() => navigate("/dashboard")}>Complete profile</Btn>
      </div>

      <div className="hero-section">
        <div className="hero-pattern-overlay" />
        <div className="hero-content">
          <Badge color="gold">🕌 Trusted by 48,000+ Muslim families worldwide</Badge>
          <h1 className="serif hero-h1">
            Your blessed path to<br /><em>a blessed marriage</em>
          </h1>
          <p className="hero-subtitle">
            A private, verified space for practising Muslims to find a life partner — with family involvement, family support, and complete Islamic values built in.
          </p>
          <div className="hero-cta-row">
            <Btn variant="white" size="lg" onClick={() => navigate("/browse")}>Browse profiles →</Btn>
            <Btn variant="ghostWhite" size="lg" onClick={() => navigate("/dashboard")}>Complete your profile</Btn>
          </div>
          <div className="hero-stats">
            <Stat value="48,000+" label="Active members" />
            <Stat value="12,400+" label="Matches made" />
            <Stat value="3,200+" label="Successful nikahs" />
          </div>
        </div>
      </div>

      <div className="home-section">
        <h2 className="serif home-section-title">How NikahConnect works</h2>
        <div className="feature-grid">
          <FeatureCard icon="📝" title="Build a verified profile" text="Share your deen, background, and what you're seeking — with family involvement at every step." />
          <FeatureCard icon="🔍" title="Browse with intention" text="Filter by sect, education, location, and more to find genuinely compatible matches." />
          <FeatureCard icon="💌" title="Send interest respectfully" text="Express interest formally; conversations only begin once both sides agree." />
          <FeatureCard icon="💬" title="Safe, moderated chat" text="Message securely with live typing indicators, Conversations are kept private and secure." />
        </div>
      </div>
    </div>
  );
}

function Stat({ value, label }) {
  return (
    <div>
      <div className="hero-stat-value">{value}</div>
      <div className="hero-stat-label">{label}</div>
    </div>
  );
}

function FeatureCard({ icon, title, text }) {
  return (
    <div className="feature-card">
      <div className="feature-icon">{icon}</div>
      <div className="feature-title">{title}</div>
      <div className="feature-text">{text}</div>
    </div>
  );
}
