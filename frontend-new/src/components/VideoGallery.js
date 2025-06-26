import React, { useState } from 'react';
import './ImageGallery.css'; // Reusing styles

const API_URL = 'https://gallayhub.onrender.com';

const VideoGallery = ({ videos, onVideoDelete, onRefresh, token }) => {
  const [deletingId, setDeletingId] = useState(null);
  const [deletingMultiple, setDeletingMultiple] = useState(false);
  const [selectedVideos, setSelectedVideos] = useState([]);

  const handleDelete = async (videoId) => {
    if (window.confirm('Are you sure you want to delete this video?')) {
      setDeletingId(videoId);
      try {
        const response = await fetch(`${API_URL}/api/videos/${videoId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          onVideoDelete(videoId);
        } else {
          alert('Failed to delete video');
        }
      } catch (error) {
        console.error('Error deleting video:', error);
        alert('Error deleting video');
      } finally {
        setDeletingId(null);
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const handleSelectVideo = (id) => {
    setSelectedVideos((prev) =>
      prev.includes(id) ? prev.filter((vidId) => vidId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedVideos.length === videos.length) {
      setSelectedVideos([]);
    } else {
      setSelectedVideos(videos.map((vid) => vid._id));
    }
  };

  const handleDownloadSelected = async () => {
    if (selectedVideos.length === 0) return;
    const response = await fetch(`${API_URL}/api/videos/download-zip`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ videoIds: selectedVideos }),
    });
    if (!response.ok) {
      alert('Failed to download zip');
      return;
    }
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'videos.zip';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
    setSelectedVideos([]);
  };

  const handleDeleteSelected = async () => {
    if (selectedVideos.length === 0) return;
    
    const confirmMessage = selectedVideos.length === 1 
      ? 'Are you sure you want to delete this video?' 
      : `Are you sure you want to delete ${selectedVideos.length} videos? This action cannot be undone.`;
    
    if (window.confirm(confirmMessage)) {
      setDeletingMultiple(true);
      try {
        const deletePromises = selectedVideos.map(async (videoId) => {
          const response = await fetch(`${API_URL}/api/videos/${videoId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (!response.ok) {
            throw new Error(`Failed to delete video ${videoId}`);
          }
          
          return videoId;
        });

        const deletedIds = await Promise.all(deletePromises);
        
        // Remove deleted videos from the list
        deletedIds.forEach(id => onVideoDelete(id));
        
        // Clear selection
        setSelectedVideos([]);
        
        // Show success message
        const message = deletedIds.length === 1 
          ? 'Video deleted successfully!' 
          : `${deletedIds.length} videos deleted successfully!`;
        alert(message);
        
      } catch (error) {
        console.error('Error deleting videos:', error);
        alert('Some videos could not be deleted. Please try again.');
      } finally {
        setDeletingMultiple(false);
      }
    }
  };

  if (videos.length === 0) {
    return (
      <div className="image-gallery-container">
        <div className="empty-gallery">
          <div className="empty-icon">🎬</div>
          <h3>No videos uploaded yet</h3>
          <p>Upload your first video to get started!</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="image-gallery-container">
        <div className="gallery-header">
          <div className="gallery-title">
            <h2>Video Gallery</h2>
            <div className="gallery-stats">
              <span className="image-count">{videos.length} {videos.length === 1 ? 'video' : 'videos'}</span>
            </div>
          </div>
          <div className="gallery-actions">
            <button className="select-all-btn" onClick={handleSelectAll}>
              {selectedVideos.length === videos.length ? 'Unselect All' : 'Select All'}
            </button>
            <button className="download-selected-btn" onClick={handleDownloadSelected} disabled={selectedVideos.length === 0}>
              Download Selected
            </button>
            <button 
              className="delete-selected-btn" 
              onClick={handleDeleteSelected} 
              disabled={selectedVideos.length === 0 || deletingMultiple}
            >
              {deletingMultiple ? (
                <>
                  <span className="spinner-small"></span>
                  Deleting...
                </>
              ) : (
                <>
                  <span className="button-icon">🗑️</span>
                  Delete Selected
                </>
              )}
            </button>
            <button className="refresh-button" onClick={onRefresh}>
              <span className="refresh-icon">🔄</span>
              <span className="refresh-text">Refresh</span>
            </button>
          </div>
        </div>
        
        <div className="image-grid">
          {videos.map((video, index) => (
            <div key={video._id} className="image-card video-card">
              <div className="image-select-checkbox">
                <input
                  type="checkbox"
                  checked={selectedVideos.includes(video._id)}
                  onChange={() => handleSelectVideo(video._id)}
                />
              </div>
              <div className="image-container">
                <video
                  src={`${API_URL}/videos/${video.filename}`}
                  className="gallery-image"
                  controls
                  preload="metadata"
                  onError={e => { e.target.poster = '/default-avatar.png'; }}
                />
                {deletingId === video._id && (
                  <div className="delete-overlay">
                    <div className="spinner"></div>
                    <p>Deleting...</p>
                  </div>
                )}
                <div className="image-overlay">
                  <div className="overlay-actions">
                    <button 
                      className="preview-button"
                      title="Preview video"
                      style={{ pointerEvents: 'none', opacity: 0.8 }}
                    >
                      <span className="button-icon">👁️</span>
                      <span className="button-text">Preview</span>
                    </button>
                  </div>
                </div>
              </div>
              <div className="image-card-footer">
                <div className="image-info">
                  <h4 className="image-title" title={video.originalName}>
                    {video.originalName}
                  </h4>
                  <div className="image-meta">
                    <span className="image-date">{formatDate(video.uploadDate)}</span>
                  </div>
                </div>
                <div className="video-actions">
                  <a
                    href={`${API_URL}/videos/${video.filename}`}
                    className="download-button"
                    download={video.originalName}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Download video"
                  >
                    <span className="button-icon">⬇️</span>
                    <span className="button-text">Download</span>
                  </a>
                  <button
                    className="delete-button"
                    onClick={() => handleDelete(video._id)}
                    disabled={deletingId === video._id}
                    title="Delete video"
                  >
                    <span className="button-icon">🗑️</span>
                    <span className="button-text">Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default VideoGallery; 