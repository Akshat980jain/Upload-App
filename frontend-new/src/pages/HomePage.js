import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Login from '../components/Login';
import Register from '../components/Register';
import './HomePage.css';

const HomePage = ({ token, onLogin }) => {
  const [showLogin, setShowLogin] = useState(true);
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [documents, setDocuments] = useState([]);
  const navigate = useNavigate();

  const fetchImageCount = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch('https://gallayhub.onrender.com/api/images', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setImages(data);
        }
      }
    } catch (error) {
      console.error('Error fetching image count:', error);
    }
  }, [token]);

  const fetchVideoCount = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch('https://gallayhub.onrender.com/api/videos', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setVideos(data);
        }
      }
    } catch (error) {
      console.error('Error fetching video count:', error);
    }
  }, [token]);

  const fetchDocumentCount = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch('https://gallayhub.onrender.com/api/documents', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setDocuments(data);
        }
      }
    } catch (error) {
      console.error('Error fetching document count:', error);
    }
  }, [token]);

  useEffect(() => {
    fetchImageCount();
    fetchVideoCount();
    fetchDocumentCount();
  }, [fetchImageCount, fetchVideoCount, fetchDocumentCount]);

  const handleGoToUpload = () => {
    navigate('/upload');
  };

  return (
    <div className="home-page">
      <header className="home-header">
        <h1>📸 Gallery Hub</h1>
        <p>Your personal space to upload, view, and manage images</p>
        {token && (
          <div className="user-info">
            <div className="user-stats">
              <span className="stat-item">
                <span className="stat-icon">🖼️</span>
                <span className="stat-text">{images.length} Images</span>
                <span className="stat-icon">🎬</span>
                <span className="stat-text">{videos.length} Videos</span>
                <span className="stat-icon">📄</span>
                <span className="stat-text">{documents.length} Documents</span>
              </span>
            </div>
            <div className="header-actions">

            </div>
          </div>
        )}
      </header>
      
      <main className="home-main">
        {!token ? (
          <div className="auth-section">
            {showLogin ? (
              <>
                <Login onLogin={onLogin} />
                <p className="toggle-form">
                  Don't have an account?{' '}
                  <span onClick={() => setShowLogin(false)}>Register here</span>
                </p>
              </>
            ) : (
              <>
                <Register onLogin={onLogin} />
                <p className="toggle-form">
                  Already have an account?{' '}
                  <span onClick={() => setShowLogin(true)}>Login here</span>
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="welcome-section">
            <div className="welcome-card">
              <div className="welcome-icon">🖼️</div>
              <h2>Image Hub</h2>
              <p>Manage your personal image collection.</p>
              <div className="welcome-stats">
                <div className="stat-card">
                  <div className="stat-number">{images.length}</div>
                  <div className="stat-label">Total Images</div>
                </div>
              </div>
              <button onClick={handleGoToUpload} className="cta-button">
                <span className="button-icon">📤</span>
                <span className="button-text">Go to Image Gallery</span>
              </button>
            </div>

            <div className="welcome-card">
              <div className="welcome-icon">🎬</div>
              <h2>Video Hub</h2>
              <p>Manage your personal video collection.</p>
              <div className="welcome-stats">
                <div className="stat-card">
                  <div className="stat-number">{videos.length}</div>
                  <div className="stat-label">Total Videos</div>
                </div>
              </div>
              <button onClick={() => navigate('/videos')} className="cta-button secondary">
                <span className="button-icon">🚀</span>
                <span className="button-text">Go to Video Hub</span>
              </button>
            </div>

            <div className="welcome-card">
              <div className="welcome-icon">📄</div>
              <h2>Document Hub</h2>
              <p>Manage your personal document collection (PDF, PPT, Excel).</p>
              <div className="welcome-stats">
                <div className="stat-card">
                  <div className="stat-number">{documents.length}</div>
                  <div className="stat-label">Total Documents</div>
                </div>
              </div>
              <button onClick={() => navigate('/documents')} className="cta-button secondary">
                <span className="button-icon">📂</span>
                <span className="button-text">Go to Document Hub</span>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default HomePage; 