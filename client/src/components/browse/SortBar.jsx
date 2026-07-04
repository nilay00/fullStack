import "../../styles/browse.css";

const SORT_OPTIONS = [
  ["match", "Best match"],
  ["age", "Age"],
  ["active", "Active"],
];

export default function SortBar({ sort, onChange }) {
  return (
    <div className="sort-bar">
      {SORT_OPTIONS.map(([v, l]) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={`sort-pill${sort === v ? " active" : ""}`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
