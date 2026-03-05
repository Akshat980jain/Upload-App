import React, { useState } from 'react';
import { Eye, Download, Trash2, FileImage, Play, FileText } from 'lucide-react';
import './ImageGallery.css';

const API_URL = process.env.REACT_APP_API_URL || 'https://gallayhub.onrender.com';

const getMediaUrl = (item) => {
  if (item.mediaType === 'video') return `${API_URL}/videos/${item.filename}`;
  if (item.mediaType === 'document') return `${API_URL}/documents/${item.filename}`;
  return item.imageUrl || `${API_URL}/uploads/${item.filename}`;
};

const getMediaIcon = (item) => {
  if (item.mediaType === 'video') return '🎥';
  if (item.mediaType === 'document') {
    const ext = (item.originalName || '').split('.').pop()?.toLowerCase();
    if (['pdf'].includes(ext)) return '📕';
    if (['doc', 'docx'].includes(ext)) return '📘';
    if (['xls', 'xlsx', 'csv'].includes(ext)) return '📊';
    if (['ppt', 'pptx'].includes(ext)) return '📑';
    if (['zip', 'rar', '7z'].includes(ext)) return '📦';
    return '📄';
  }
  return null; // image — use actual thumbnail
};

const getPlaceholderColor = (item) => {
  if (item.mediaType === 'video') return 'linear-gradient(135deg, #ea4335 0%, #ff6b6b 100%)';
  const ext = (item.originalName || '').split('.').pop()?.toLowerCase();
  if (['pdf'].includes(ext)) return 'linear-gradient(135deg, #ea4335 0%, #ff8a80 100%)';
  if (['doc', 'docx'].includes(ext)) return 'linear-gradient(135deg, #4285f4 0%, #82b1ff 100%)';
  if (['xls', 'xlsx', 'csv'].includes(ext)) return 'linear-gradient(135deg, #34a853 0%, #69f0ae 100%)';
  if (['ppt', 'pptx'].includes(ext)) return 'linear-gradient(135deg, #a855f7 0%, #ce93d8 100%)';
  if (['zip', 'rar', '7z'].includes(ext)) return 'linear-gradient(135deg, #ec4899 0%, #f48fb1 100%)';
  return 'linear-gradient(135deg, #5f6368 0%, #9aa0a6 100%)';
};

const ImageGallery = ({ images, onImageDelete, onRefresh, token, onPreview, viewMode = 'grid' }) => {
  const [deletingId, setDeletingId] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);

  const handleDelete = async (item) => {
    if (!window.confirm('Delete this file?')) return;
    const imageId = item._id;
    setDeletingId(imageId);
    try {
      let endpoint = `${API_URL}/api/images/${imageId}`;
      if (item.mediaType === 'video') endpoint = `${API_URL}/api/videos/${imageId}`;
      if (item.mediaType === 'document') endpoint = `${API_URL}/api/documents/${imageId}`;

      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        onImageDelete(imageId);
      }
    } catch (error) {
      console.error('Delete error:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (images.length === 0) {
    return (
      <div className="empty-gallery">
        <div className="empty-illustration">📂</div>
        <h3>No files yet</h3>
        <p>Upload your first file using the + button below</p>
      </div>
    );
  }

  // ─── List View ───
  if (viewMode === 'list') {
    return (
      <div className="image-list">
        {/* List Header */}
        <div className="list-header">
          <span className="list-col-name">Name</span>
          <span className="list-col-date">Date</span>
          <span className="list-col-size">Size</span>
          <span className="list-col-actions">Actions</span>
        </div>
        {images.map((image) => {
          const mediaUrl = getMediaUrl(image);
          const icon = getMediaIcon(image);
          return (
            <div
              key={image._id}
              className="list-row"
              onClick={() => onPreview(image)}
            >
              <div className="list-col-name">
                <div className="list-thumb-wrapper">
                  {icon ? (
                    <span className="list-thumb-icon">{icon}</span>
                  ) : (
                    <>
                      <img src={mediaUrl} alt="" className="list-thumb" loading="lazy"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                      <FileImage size={16} className="list-thumb-fallback" />
                    </>
                  )}
                </div>
                <span className="list-filename" title={image.originalName}>
                  {image.originalName}
                </span>
              </div>
              <span className="list-col-date">{formatDate(image.uploadDate || image.createdAt)}</span>
              <span className="list-col-size">{formatSize(image.size)}</span>
              <div className="list-col-actions" onClick={(e) => e.stopPropagation()}>
                <a href={mediaUrl} download={image.originalName} target="_blank" rel="noopener noreferrer" className="list-action-btn" title="Download">
                  <Download size={16} />
                </a>
                <button className="list-action-btn danger" title="Delete" onClick={() => handleDelete(image)} disabled={deletingId === image._id}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // ─── Grid View (default) ───
  return (
    <div className="image-grid">
      {images.map((image) => {
        const mediaUrl = getMediaUrl(image);
        const icon = getMediaIcon(image);
        return (
          <div
            key={image._id}
            className="image-card animate-slide-up"
            onMouseEnter={() => setHoveredId(image._id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <div className="card-image-wrapper" onClick={() => onPreview(image)}>
              {icon ? (
                <div className="media-placeholder" style={{ background: getPlaceholderColor(image) }}>
                  <span style={{ fontSize: '40px' }}>{icon}</span>
                </div>
              ) : (
                <img
                  src={mediaUrl}
                  alt={image.originalName}
                  className="card-image"
                  loading="lazy"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23f0f0f0" width="100" height="100"/%3E%3Ctext x="50" y="55" text-anchor="middle" fill="%23aaa" font-size="12"%3ENo Image%3C/text%3E%3C/svg%3E';
                  }}
                />
              )}

              {hoveredId === image._id && (
                <div className="card-overlay animate-fade-in">
                  <div className="overlay-actions">
                    <button className="overlay-btn" title="Preview" onClick={(e) => { e.stopPropagation(); onPreview(image); }}>
                      <Eye size={18} />
                    </button>
                    <a href={mediaUrl} download={image.originalName} target="_blank" rel="noopener noreferrer" className="overlay-btn" title="Download" onClick={(e) => e.stopPropagation()}>
                      <Download size={18} />
                    </a>
                    <button className="overlay-btn danger" title="Delete" onClick={(e) => { e.stopPropagation(); handleDelete(image); }} disabled={deletingId === image._id}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              )}

              {deletingId === image._id && (
                <div className="card-overlay deleting">
                  <div className="btn-spinner" />
                </div>
              )}
            </div>

            <div className="card-info">
              <p className="card-name" title={image.originalName}>
                {image.originalName.length > 22 ? image.originalName.slice(0, 22) + '...' : image.originalName}
              </p>
              <span className="card-date">{formatDate(image.uploadDate || image.createdAt)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ImageGallery;