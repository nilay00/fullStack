import "../../styles/shared.css";

export default function Textarea({ label, value, onChange, name, placeholder = "", rows = 4 }) {
  return (
    <label className="field-block">
      {label && <div className="field-label">{label}</div>}
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        className="field-textarea"
      />
    </label>
  );
}
