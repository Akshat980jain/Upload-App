import React, { useState, useCallback, useRef } from 'react';
import axios from 'axios';
import './ImageUpload.css'; // Reusing styles for consistency

const VideoUpload = ({ onVideoUpload, token }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleUpload = useCallback(async (files) => {
    setUploading(true);
    setUploadProgress(0);
    setError(null);

    const formData = new FormData();
    files.forEach(file => {
      formData.append('videos', file);
    });

    try {
      const response = await axios.post('https://gallayhub.onrender.com/api/videos/upload-multiple', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });
      onVideoUpload(response.data);
    } catch (err) {
      const message = err.response?.data?.message || 'Error uploading videos';
      setError(message);
      console.error('Upload error:', err.response || err);
    } finally {
      setUploading(false);
    }
  }, [onVideoUpload, token]);

  const handleButtonClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      handleUpload(files);
    }
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleUpload(files);
    }
  }, [handleUpload]);

  return (
    <div 
      className="upload-container"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      <input
        type="file"
        id="video-upload-input"
        ref={fileInputRef}
        multiple
        accept="video/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      <div className="upload-section">
        <div className="upload-icon">🎬</div>
        <h3>Drag & Drop or Upload Videos</h3>
        <p>Supported formats: MP4, MOV, AVI, MKV (Max 50MB)</p>
        <button type="button" className="upload-button" onClick={handleButtonClick}>
          <span className="button-icon">➕</span>
          Add Videos
        </button>
      </div>
      
      {uploading && (
        <div className="upload-progress-bar">
          <div 
            className="progress-bar-fill"
            style={{ width: `${uploadProgress}%` }}
          >
            {uploadProgress}%
          </div>
        </div>
      )}
      
      {error && <div className="upload-error">{error}</div>}
    </div>
  );
};

export default VideoUpload; 