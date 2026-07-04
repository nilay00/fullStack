import "../../styles/shared.css";

export default function Badge({ children, color = "brand" }) {
  return <span className={`badge badge-${color}`}>{children}</span>;
}
