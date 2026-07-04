import { useState, useEffect, useCallback, useRef } from "react";
import "../styles/browse.css";
import { browseProfiles } from "../services/userService";
import FilterPanel, { DEFAULT_FILTERS } from "../components/browse/FilterPanel";
import SortBar from "../components/browse/SortBar";
import ProfileCard from "../components/profile/ProfileCard";
import Spinner from "../components/shared/Spinner";
import ToastContainer from "../components/shared/ToastContainer";
import Icon from "../components/shared/Icon";
import { useNotifications } from "../hooks/useNotifications";

const DEBOUNCE_MS = 350;

export default function BrowsePage() {
  const { pushToast } = useNotifications();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(DEFAULT_FILTERS);
  const [sort, setSort] = useState("match");
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const debounceRef = useRef(null);

  const activeFilterCount = [
    appliedFilters.sect !== "Any", appliedFilters.country !== "Any",
    appliedFilters.education !== "Any", appliedFilters.maritalStatus !== "Any",
    appliedFilters.ageMin !== "18" || appliedFilters.ageMax !== "40",
  ].filter(Boolean).length;

  // Filters apply automatically as the user changes them — dropdowns/radios
  // apply instantly, the age number inputs debounce briefly so we don't fire
  // a request on every keystroke.
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setAppliedFilters(filters);
    }, DEBOUNCE_MS);
    return () => clearTimeout(debounceRef.current);
  }, [filters]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await browseProfiles({ ...appliedFilters, sort });
      setProfiles(data.profiles);
    } catch (err) {
      pushToast("Could not load profiles. Please try again.");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedFilters, sort]);

  useEffect(() => {
    load();
  }, [load]);

  const handleReset = () => {
    setFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
  };

  return (
    <div className="fade-in browse-page-root">
      <div className="browse-mobile-bar mobile-filter-bar">
        <button
          onClick={() => setFiltersOpen((o) => !o)}
          className={`browse-filter-toggle-btn${filtersOpen ? " active" : ""}${activeFilterCount > 0 ? " has-filters" : ""}`}
        >
          <Icon name="filter" /> Filters
          {activeFilterCount > 0 && <span className="filter-count-badge">{activeFilterCount}</span>}
          <Icon name={filtersOpen ? "chevron-up" : "chevron-down"} />
        </button>
        <div className="browse-mobile-sort">
          <SortBar sort={sort} onChange={setSort} />
        </div>
      </div>

      {filtersOpen && (
        <div className="browse-mobile-panel mobile-filter-panel">
          <FilterPanel filters={filters} onChange={setFilters} onReset={handleReset} />
        </div>
      )}

      <div className="browse-body">
        <aside className="browse-sidebar desktop-filter-sidebar">
          <FilterPanel filters={filters} onChange={setFilters} onReset={handleReset} />
          <div className="saved-search-box">
            <div className="saved-search-title"><Icon name="bell" prefix="far" /> Saved search</div>
            <div className="saved-search-text">Get notified when new profiles matching your filters join</div>
          </div>
        </aside>

        <main className="browse-main">
          <div className="browse-main-header">
            <div>
              <span className="browse-main-title">Browse profiles</span>
              <span className="browse-main-count">
                {loading ? "Updating…" : `Showing ${profiles.length} profiles`}
              </span>
            </div>
            <div className="desktop-sort-bar sort-bar-desktop">
              <SortBar sort={sort} onChange={setSort} />
            </div>
          </div>

          {loading ? (
            <Spinner label="Loading profiles…" />
          ) : profiles.length === 0 ? (
            <div className="browse-empty-state">No profiles match your filters. Try adjusting them.</div>
          ) : (
            <div className="profile-grid">
              {profiles.map((p) => (
                <ProfileCard key={p._id} profile={p} onToast={pushToast} />
              ))}
            </div>
          )}
        </main>
      </div>

      <ToastContainer />
    </div>
  );
}
