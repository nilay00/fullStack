import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

/**
 * Usage: <Icon name="house" /> <Icon name="heart" prefix="far" size="lg" />
 * prefix: "fas" (solid, default) | "far" (regular)
 */
export default function Icon({ name, prefix = "fas", size, className = "", style }) {
  return (
    <FontAwesomeIcon
      icon={[prefix, name]}
      size={size}
      className={className}
      style={style}
    />
  );
}
