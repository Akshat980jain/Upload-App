import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import VideoUpload from '../components/VideoUpload';
import VideoGallery from '../components/VideoGallery';
import './ImageUploadPage.css'; // Reusing styles

const VideoUploadPage = ({ token }) => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchVideos = useCallback(async () => {
    if (!token) {
      navigate('/');
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch('https://gallayhub.onrender.com/api/videos', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          navigate('/');
          throw new Error('Session expired. Please login again.');
        }
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch videos');
      }
      
      const data = await response.json();
      setVideos(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch videos');
      setVideos([]);
    } finally {
      setLoading(false);
    }
  }, [token, navigate]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const handleVideoUpload = (newVideos) => {
    setVideos(prevVideos => [...newVideos, ...prevVideos]);
  };

  const handleVideoDelete = (deletedId) => {
    setVideos(prevVideos => prevVideos.filter(vid => vid._id !== deletedId));
  };

  return (
    <div className="image-upload-page">
      <Link to="/" className="back-button-corner">
        <span className="button-icon">←</span>
        <span className="button-text">Back to Home</span>
      </Link>
      <header className="page-header">
        <div className="header-content">
          <div className="header-left">
            <h1>🎬 Video Gallery</h1>
            <div className="page-stats">
              <span className="stat-item">
                <span className="stat-icon">🎬</span>
                <span className="stat-text">{videos.length} Videos</span>
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="page-main">
        <VideoUpload onVideoUpload={handleVideoUpload} token={token} />

        <div className="gallery-section">
          <div className="section-header">
            <h2>Your Video Gallery</h2>
            <p>View and manage your uploaded videos</p>
          </div>
          
          {loading && <div className="loading">Loading videos...</div>}
          {error && <div className="error">{error}</div>}
          
          <VideoGallery 
            videos={videos} 
            onVideoDelete={handleVideoDelete}
            onRefresh={fetchVideos}
            token={token}
          />
        </div>
      </main>
    </div>
  );
};

export default VideoUploadPage; 