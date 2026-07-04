import "../../styles/shared.css";

export default function Spinner({ size = 28, label = "" }) {
  return (
    <div className="spinner-wrap">
      <div className="spinner-circle" style={{ "--spinner-size": `${size}px` }} />
      {label && <span className="spinner-label">{label}</span>}
    </div>
  );
}
