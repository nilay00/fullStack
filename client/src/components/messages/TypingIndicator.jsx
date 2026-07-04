import "../../styles/messages.css";

export default function TypingIndicator({ name = "" }) {
  return (
    <div className="typing-indicator-row">
      <div className="typing-bubble">
        {[0, 1, 2].map((i) => (
          <span key={i} className="typing-dot" style={{ "--delay": `${i * 0.15}s` }} />
        ))}
      </div>
      {name && <span className="typing-name-label">{name} is typing…</span>}
    </div>
  );
}
