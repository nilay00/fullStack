import "../../styles/shared.css";

export default function Input({ label, type = "text", value, onChange, name, placeholder = "", required = false, error = "" }) {
  return (
    <label className="field-block">
      {label && (
        <div className="field-label">
          {label}{required && <span className="field-required"> *</span>}
        </div>
      )}
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`field-input${error ? " has-error" : ""}`}
      />
      {error && <div className="field-error">{error}</div>}
    </label>
  );
}
