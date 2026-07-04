import "../../styles/dashboard.css";

export default function StatsCard({ icon, label, value }) {
  return (
    <div className="stats-card">
      <div className="stats-card-icon">{icon}</div>
      <div>
        <div className="stats-card-value">{value}</div>
        <div className="stats-card-label">{label}</div>
      </div>
    </div>
  );
}
