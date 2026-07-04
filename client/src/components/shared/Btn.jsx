import "../../styles/shared.css";

export default function Btn({
  children, onClick, variant = "primary", size = "md", full = false,
  disabled = false, type = "button", className = "", ...rest
}) {
  const classes = [
    "btn",
    `btn-${variant}`,
    `btn-${size}`,
    full ? "btn-full" : "",
    className,
  ].filter(Boolean).join(" ");

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={classes} {...rest}>
      {children}
    </button>
  );
}
