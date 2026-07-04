import "../../styles/shared.css";

export default function Select({ label, options = [], value, onChange, name }) {
  return (
    <label className="field-block">
      {label && <div className="field-label">{label}</div>}
      <select name={name} value={value} onChange={onChange} className="field-select">
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </label>
  );
}
