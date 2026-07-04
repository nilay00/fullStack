import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../../styles/layout.css";
import { useAuth } from "../../hooks/useAuth";
import { useSocket } from "../../hooks/useSocket";
import NotificationBell from "../notifications/NotificationBell";
import Icon from "../shared/Icon";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { totalUnread } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  const links = [
    { id: "/", label: "Home", icon: "house" },
    { id: "/browse", label: "Browse", icon: "magnifying-glass" },
    { id: "/messages", label: "Messages", icon: "message", unread: totalUnread },
    { id: "/dashboard", label: "Dashboard", icon: "gauge" },
  ];

  const isActive = (path) => location.pathname === path;
  const handleNav = (path) => { navigate(path); setMenuOpen(false); setProfileOpen(false); };
  const handleLogout = async () => { await logout(); navigate("/login"); };

  useEffect(() => {
    function handleClick(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <>
      <nav className="navbar">
        <div className="navbar-left">
          <div onClick={() => handleNav("/")} className="navbar-brand">
            <div className="navbar-logo">N</div>
            <div>
              <div className="serif navbar-brand-name">NikahConnect</div>
              <div className="navbar-brand-tag">Muslim Matrimonial</div>
            </div>
          </div>

          <div className="desktop-nav-links">
            {links.map((l) => (
              <button key={l.id} onClick={() => handleNav(l.id)} className={`navbar-link${isActive(l.id) ? " active" : ""}`}>
                <Icon name={l.icon} />
                <span>{l.label}</span>
                {l.unread > 0 && <span className="navbar-unread-badge">{l.unread > 9 ? "9+" : l.unread}</span>}
              </button>
            ))}
          </div>
        </div>

        <div className="desktop-nav-right">
          <NotificationBell />

          {/* Floating profile dropdown */}
          <div ref={profileRef} className="navbar-profile-wrap">
            <button className="navbar-profile-btn" onClick={() => setProfileOpen(o => !o)}>
              {user?.avatar
                ? <img src={user.avatar} alt={user.name} className="navbar-profile-img" />
                : <div className="navbar-profile-initials">{user?.name?.[0] || "?"}</div>
              }
              <Icon name={profileOpen ? "chevron-up" : "chevron-down"} className="navbar-profile-chevron" />
            </button>

            {profileOpen && (
              <div className="navbar-profile-dropdown">
                <div className="navbar-profile-header">
                  {user?.avatar
                    ? <img src={user.avatar} alt={user.name} className="navbar-dropdown-avatar" />
                    : <div className="navbar-dropdown-initials">{user?.name?.[0] || "?"}</div>
                  }
                  <div>
                    <div className="navbar-dropdown-name">{user?.name}</div>
                    <div className="navbar-dropdown-email">{user?.email}</div>
                  </div>
                </div>
                <div className="navbar-dropdown-divider" />
                <button className="navbar-dropdown-item" onClick={() => handleNav(`/profile/${user?._id}`)}>
                  <Icon name="user" /> View my profile
                </button>
                <button className="navbar-dropdown-item" onClick={() => handleNav("/saved")}>
                  <Icon name="bookmark" /> Saved profiles
                </button>
                <button className="navbar-dropdown-item" onClick={() => handleNav("/privacy-settings")}>
                  <Icon name="lock" /> Privacy settings
                </button>
                <button className="navbar-dropdown-item" onClick={() => handleNav("/dashboard")}>
                  <Icon name="gear" /> Settings & profile
                </button>
                <div className="navbar-dropdown-divider" />
                <button className="navbar-dropdown-item danger" onClick={handleLogout}>
                  <Icon name="right-from-bracket" /> Log out
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="mobile-nav-right">
          <NotificationBell />
          <button className="mobile-menu-btn" onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
            <Icon name={menuOpen ? "xmark" : "bars"} />
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <div className={`mobile-menu${menuOpen ? "" : " mobile-menu-hidden"}`}>
        {links.map((l) => (
          <button key={l.id} onClick={() => handleNav(l.id)} className={isActive(l.id) ? "active" : ""}>
            <Icon name={l.icon} />
            <span>{l.label}</span>
            {l.unread > 0 && <span className="navbar-unread-badge">{l.unread > 9 ? "9+" : l.unread}</span>}
          </button>
        ))}
        <button onClick={() => handleNav("/saved")}>
          <Icon name="bookmark" /> <span>Saved profiles</span>
        </button>
        <button onClick={() => handleNav(`/profile/${user?._id}`)}>
          <Icon name="user" /> <span>My profile</span>
        </button>
        <button onClick={() => handleNav("/privacy-settings")}>
          <Icon name="lock" /> <span>Privacy settings</span>
        </button>
        <button onClick={() => handleNav("/dashboard")}>
          <Icon name="gear" /> <span>Settings</span>
        </button>
        <button onClick={handleLogout} className="danger">
          <Icon name="right-from-bracket" /> <span>Log out</span>
        </button>
      </div>
    </>
  );
}
