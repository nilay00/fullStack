import "../../styles/shared.css";

export default function Card({ children, className = "", onClick }) {
  const classes = ["card", onClick ? "card-clickable" : "", className].filter(Boolean).join(" ");
  return (
    <div onClick={onClick} className={classes}>
      {children}
    </div>
  );
}
