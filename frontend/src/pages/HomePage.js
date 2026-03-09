import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import Login from '../components/Login';
import Register from '../components/Register';
import './HomePage.css';

const HomePage = ({ token, onLogin, userInfo, onLogout, darkMode }) => {
  const [showLogin, setShowLogin] = useState(true);

  // If logged in, redirect to gallery
  if (token) {
    return <Navigate to="/gallery" replace />;
  }

  return (
    <div className="home-page">
      {/* Background decoration */}
      <div className="home-bg-decoration">
        <div className="bg-circle bg-circle-1" />
        <div className="bg-circle bg-circle-2" />
        <div className="bg-circle bg-circle-3" />
      </div>

      <div className="home-content">
        {/* Left - Branding */}
        <div className="home-branding animate-fade-in">
          <div className="brand-logo">
            <img src="/favicon.png" alt="GalleryHub Logo" className="brand-logo-svg" style={{ width: '44px', height: '44px', borderRadius: '12px', objectFit: 'cover' }} />
            <span className="brand-logo-text">GalleryHub</span>
          </div>
          <h1>Your images,<br /><span className="gradient-text">beautifully organized.</span></h1>
          <p className="brand-tagline">
            Upload, manage, and preview your image collection with a clean,
            modern interface inspired by Google Drive.
          </p>
          <div className="brand-features">
            <div className="feature-chip">📤 Drag & Drop Upload</div>
            <div className="feature-chip">🖼️ Full Preview</div>
            <div className="feature-chip">🌙 Dark Mode</div>
            <div className="feature-chip">⚡ Lightning Fast</div>
          </div>
        </div>

        {/* Right - Auth Card */}
        <div className="home-auth">
          {showLogin ? (
            <>
              <Login onLogin={onLogin} />
              <p className="toggle-form">
                Don't have an account?{' '}
                <span onClick={() => setShowLogin(false)}>Create one</span>
              </p>
            </>
          ) : (
            <>
              <Register onLogin={onLogin} />
              <p className="toggle-form">
                Already have an account?{' '}
                <span onClick={() => setShowLogin(true)}>Sign in</span>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;