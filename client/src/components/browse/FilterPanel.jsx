import "../../styles/browse.css";
import Select from "../shared/Select";

export const DEFAULT_FILTERS = { sect: "Any", country: "Any", ageMin: "18", ageMax: "40", education: "Any", maritalStatus: "Any" };

export default function FilterPanel({ filters, onChange, onReset }) {
  const f = (key, value) => onChange({ ...filters, [key]: value });

  return (
    <>
      <div className="filter-header">
        <span className="filter-title">Filters</span>
        <button onClick={onReset} className="filter-reset-btn">Reset all</button>
      </div>

      <div className="filter-section">
        <div className="filter-section-label">Age range</div>
        <div className="filter-age-row">
          <input
            type="number" value={filters.ageMin} onChange={(e) => f("ageMin", e.target.value)}
            className="filter-age-input"
          />
          <span className="filter-age-sep">to</span>
          <input
            type="number" value={filters.ageMax} onChange={(e) => f("ageMax", e.target.value)}
            className="filter-age-input"
          />
        </div>
      </div>

      <div className="filter-section">
        <div className="filter-section-label">Sect</div>
        {["Any", "Sunni", "Shia"].map((s) => (
          <label key={s} className="filter-radio-label">
            <input
              type="radio" name="sect" value={s} checked={filters.sect === s}
              onChange={() => f("sect", s)} className="filter-radio-input"
            />
            <span className="filter-radio-text">{s}</span>
          </label>
        ))}
      </div>

      <div className="filter-section">
        <Select label="Country" options={["Any", "India", "Pakistan", "Saudi Arabia", "UK", "Canada", "UAE"]} value={filters.country} onChange={(e) => f("country", e.target.value)} />
      </div>

      <div className="filter-section">
        <Select label="Education" options={["Any", "Bachelor's", "Master's", "PhD", "Professional (MBBS/LLB/etc)"]} value={filters.education} onChange={(e) => f("education", e.target.value)} />
      </div>

      <div className="filter-section filter-section-last">
        <Select label="Marital status" options={["Any", "Never married", "Divorced", "Widowed"]} value={filters.maritalStatus} onChange={(e) => f("maritalStatus", e.target.value)} />
      </div>
    </>
  );
}
