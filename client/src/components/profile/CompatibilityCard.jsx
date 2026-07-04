import "../../styles/profile.css";

export default function CompatibilityCard({ matchPct = 0 }) {
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (matchPct / 100) * circumference;

  return (
    <div className="compat-card">
      <svg width={64} height={64} className="compat-ring">
        <circle cx={32} cy={32} r={radius} className="compat-ring-track" strokeWidth={5} fill="none" />
        <circle
          cx={32} cy={32} r={radius} className="compat-ring-progress" strokeWidth={5} fill="none"
          style={{ "--circumference": circumference, "--offset": offset }}
        />
      </svg>
      <div>
        <div className="compat-info-title">{matchPct}% compatibility</div>
        <div className="compat-info-text">Based on sect, age, location, and education preferences</div>
      </div>
    </div>
  );
}
