import React, { useState, useEffect } from 'react';
import './Header.css';
const API_URL = 'https://gallaryhub.onrender.com';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

const Header = ({ userInfo, onLogout, onProfileClick }) => {
  const defaultAvatar = '/default-avatar.png';
  const profilePictureUrl = userInfo && userInfo.profilePicture ? `${API_URL}/uploads/${userInfo.profilePicture}` : defaultAvatar;
  const isMobile = useIsMobile();
  return (
    <header className="app-header">
      <div className="header-left">
        {/* You can add logo or nav links here in the future */}
      </div>

      <div className="header-right">
        {!isMobile && (
          <button onClick={onProfileClick} className="profile-button">
            <img src={profilePictureUrl} alt="Profile" className="profile-avatar-header" />
          </button>
        )}
        {!isMobile && (
          <button onClick={onLogout} className="logout-button-global">
            <span className="button-icon">🚪</span>
            <span className="button-text">Logout</span>
          </button>
        )}
      </div>
    </header>
  );
};
export default Header; 