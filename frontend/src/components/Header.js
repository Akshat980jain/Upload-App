import React, { useState, useRef, useEffect } from 'react';
import { Search, Moon, Sun, Monitor, LogOut, ChevronDown, User, Settings } from 'lucide-react';
import './Header.css';

const API_URL = process.env.REACT_APP_API_URL ?? 'https://gallayhub.onrender.com';

const Logo = () => (
  <img src="/favicon.png" alt="GalleryHub Logo" className="logo-svg" style={{ width: '32px', height: '32px', borderRadius: '8px', objectFit: 'cover' }} />
);

const Header = ({ userInfo, onLogout, darkMode, themeMode, setThemeMode, searchQuery, onSearchChange, profilePicture, onProfileClick, onSettingsClick }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const profilePicUrl = profilePicture ? `${API_URL}/uploads/${profilePicture}` : null;

  // Cycle through: system → light → dark → system
  const cycleTheme = () => {
    const next = themeMode === 'system' ? 'light' : themeMode === 'light' ? 'dark' : 'system';
    setThemeMode(next);
  };

  const themeIcon = themeMode === 'system' ? <Monitor size={20} /> : themeMode === 'dark' ? <Sun size={20} /> : <Moon size={20} />;
  const themeLabel = themeMode === 'system' ? 'System theme' : themeMode === 'dark' ? 'Dark mode' : 'Light mode';

  return (
    <nav className="navbar">
      {/* Logo */}
      <div className="navbar-logo">
        <Logo />
        <span className="logo-text">GalleryHub</span>
      </div>

      {/* Search Bar */}
      <div className="navbar-search">
        <Search size={18} className="search-icon" />
        <input
          type="text"
          placeholder="Search images, tags, folders..."
          value={searchQuery || ''}
          onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Right Actions */}
      <div className="navbar-actions">
        {/* Theme Toggle */}
        <button
          className="nav-icon-btn"
          onClick={cycleTheme}
          title={themeLabel}
        >
          {themeIcon}
        </button>

        {/* User Avatar */}
        <div className="user-menu" ref={dropdownRef}>
          <button className="user-avatar-btn" onClick={() => setShowDropdown(!showDropdown)}>
            <div className="user-avatar">
              {profilePicUrl ? (
                <img src={profilePicUrl} alt="" className="avatar-img" />
              ) : (
                userInfo?.name?.charAt(0)?.toUpperCase() || 'U'
              )}
            </div>
            <span className="user-name">{userInfo?.name?.split(' ')[0] || 'User'}</span>
            <ChevronDown size={14} className={`chevron ${showDropdown ? 'open' : ''}`} />
          </button>

          {showDropdown && (
            <div className="user-dropdown animate-slide-down">
              <div className="dropdown-header">
                <div className="dropdown-avatar">
                  {profilePicUrl ? (
                    <img src={profilePicUrl} alt="" className="avatar-img" />
                  ) : (
                    userInfo?.name?.charAt(0)?.toUpperCase() || 'U'
                  )}
                </div>
                <div>
                  <p className="dropdown-name">{userInfo?.name}</p>
                  <p className="dropdown-email">{userInfo?.email}</p>
                </div>
              </div>
              <div className="dropdown-divider" />
              <button className="dropdown-item" onClick={() => { setShowDropdown(false); onProfileClick && onProfileClick(); }}>
                <User size={16} />
                <span>View Profile</span>
              </button>
              <button className="dropdown-item" onClick={() => { setShowDropdown(false); onSettingsClick && onSettingsClick(); }}>
                <Settings size={16} />
                <span>Settings</span>
              </button>
              <div className="dropdown-divider" />
              <button className="dropdown-item danger" onClick={onLogout}>
                <LogOut size={16} />
                <span>Sign out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Header;