import "../../styles/shared.css";
import Icon from "./Icon";

export default function Avatar({ src, name = "", size = 40, online = false, locked = false }) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const cssVars = {
    "--avatar-size": `${size}px`,
    "--avatar-font-size": `${size * 0.4}px`,
    "--avatar-dot-size": `${size * 0.28}px`,
  };

  if (locked) {
    return (
      <div className="avatar-wrap avatar-locked" style={cssVars} title="This photo is private">
        <div className="avatar-fallback avatar-locked-fallback">{initials || "?"}</div>
        <div className="avatar-lock-overlay">
          <Icon name="lock" />
          <p></p>
        </div>
      </div>
    );
  }

  return (
    <div className="avatar-wrap" style={cssVars}>
      {src ? (
        <img src={src} alt={name} className="avatar-img" />
      ) : (
        <div className="avatar-fallback">{initials || "?"}</div>
      )}
      {online && <span className="avatar-online-dot" />}
    </div>
  );
}
