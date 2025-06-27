import React, { useState, useRef, useEffect } from 'react';
import './ImageGallery.css';

const API_URL = 'https://gallayhub.onrender.com';

const ImageGallery = ({ images, onImageDelete, onRefresh, token }) => {
  const [deletingId, setDeletingId] = useState(null);
  const [deletingMultiple, setDeletingMultiple] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedImages, setSelectedImages] = useState([]);
  const imageRef = useRef(null);
  const previewModalRef = useRef(null);

  useEffect(() => {
    if (previewImage && previewModalRef.current) {
      previewModalRef.current.focus();
    }
  }, [previewImage]);

  const handleSelectImage = (id) => {
    setSelectedImages((prev) =>
      prev.includes(id) ? prev.filter((imgId) => imgId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedImages.length === images.length) {
      setSelectedImages([]);
    } else {
      setSelectedImages(images.map((img) => img._id));
    }
  };

  const handleDownloadSelected = async () => {
    if (selectedImages.length === 0) return;
    const response = await fetch(`${API_URL}/api/images/download-zip`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ imageIds: selectedImages }),
    });
    if (!response.ok) {
      alert('Failed to download zip');
      return;
    }
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'images.zip';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
    setSelectedImages([]);
  };

  const handleDeleteSelected = async () => {
    if (selectedImages.length === 0) return;
    
    const confirmMessage = selectedImages.length === 1 
      ? 'Are you sure you want to delete this image?' 
      : `Are you sure you want to delete ${selectedImages.length} images? This action cannot be undone.`;
    
    if (window.confirm(confirmMessage)) {
      setDeletingMultiple(true);
      try {
        const deletePromises = selectedImages.map(async (imageId) => {
          const response = await fetch(`${API_URL}/api/images/${imageId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (!response.ok) {
            throw new Error(`Failed to delete image ${imageId}`);
          }
          
          return imageId;
        });

        const deletedIds = await Promise.all(deletePromises);
        
        // Remove deleted images from the list
        deletedIds.forEach(id => onImageDelete(id));
        
        // Clear selection
        setSelectedImages([]);
        
        // Show success message
        const message = deletedIds.length === 1 
          ? 'Image deleted successfully!' 
          : `${deletedIds.length} images deleted successfully!`;
        alert(message);
        
      } catch (error) {
        console.error('Error deleting images:', error);
        alert('Some images could not be deleted. Please try again.');
      } finally {
        setDeletingMultiple(false);
      }
    }
  };

  const handleDelete = async (imageId) => {
    if (window.confirm('Are you sure you want to delete this image?')) {
      setDeletingId(imageId);
      try {
        const response = await fetch(`${API_URL}/api/images/${imageId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          onImageDelete(imageId);
        } else {
          alert('Failed to delete image');
        }
      } catch (error) {
        console.error('Error deleting image:', error);
        alert('Error deleting image');
      } finally {
        setDeletingId(null);
      }
    }
  };

  const handleImageClick = (image, index) => {
    setPreviewImage(image);
    setCurrentImageIndex(index);
    setZoomLevel(1);
    setImageLoaded(false);
  };

  const closePreview = () => {
    setPreviewImage(null);
    setZoomLevel(1);
    setImageLoaded(false);
    setCurrentImageIndex(0);
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 5));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.25));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
  };

  const handleNextImage = () => {
    if (currentImageIndex < images.length - 1) {
      const nextIndex = currentImageIndex + 1;
      setCurrentImageIndex(nextIndex);
      setPreviewImage(images[nextIndex]);
      setZoomLevel(1);
      setImageLoaded(false);
    }
  };

  const handlePrevImage = () => {
    if (currentImageIndex > 0) {
      const prevIndex = currentImageIndex - 1;
      setCurrentImageIndex(prevIndex);
      setPreviewImage(images[prevIndex]);
      setZoomLevel(1);
      setImageLoaded(false);
    }
  };

  const handlePreviewKeyDown = (e) => {
    if (e.key === 'Escape') {
      closePreview();
    } else if (e.key === '+' || e.key === '=') {
      e.preventDefault();
      handleZoomIn();
    } else if (e.key === '-') {
      e.preventDefault();
      handleZoomOut();
    } else if (e.key === '0') {
      e.preventDefault();
      handleResetZoom();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      handleNextImage();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      handlePrevImage();
    }
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getImageType = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    const types = {
      'jpg': 'JPEG',
      'jpeg': 'JPEG',
      'png': 'PNG',
      'gif': 'GIF',
      'webp': 'WebP'
    };
    return types[ext] || 'Image';
  };

  if (images.length === 0) {
    return (
      <div className="image-gallery-container">
        <div className="empty-gallery">
          <div className="empty-icon">🖼️</div>
          <h3>No images uploaded yet</h3>
          <p>Upload your first image to get started!</p>
          <div className="empty-actions">
            <button className="upload-cta-button" onClick={() => document.querySelector('.upload-button')?.click()}>
              📤 Upload Images
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="image-gallery-container">
        <div className="gallery-header">
          <div className="gallery-title">
            <h2>Image Gallery</h2>
            <div className="gallery-stats">
              <span className="image-count">{images.length} {images.length === 1 ? 'image' : 'images'}</span>
            </div>
          </div>
          <div className="gallery-actions">
            <button className="select-all-btn" onClick={handleSelectAll}>
              {selectedImages.length === images.length ? 'Unselect All' : 'Select All'}
            </button>
            <button className="download-selected-btn" onClick={handleDownloadSelected} disabled={selectedImages.length === 0}>
              Download Selected
            </button>
            <button 
              className="delete-selected-btn" 
              onClick={handleDeleteSelected} 
              disabled={selectedImages.length === 0 || deletingMultiple}
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
          {images.map((image, index) => (
            <div key={image._id} className="image-card" data-aos="fade-up" data-aos-delay={index * 100}>
              <div className="image-select-checkbox">
                <input
                  type="checkbox"
                  checked={selectedImages.includes(image._id)}
                  onChange={() => handleSelectImage(image._id)}
                />
              </div>
              <div className="image-container">
                <img
                  src={`${API_URL}/uploads/${image.filename}`}
                  alt={image.originalName}
                  className="gallery-image"
                  loading="lazy"
                  onClick={() => handleImageClick(image, index)}
                  title="Click to preview"
                  onError={e => { e.target.onerror = null; e.target.src = '/default-avatar.png'; }}
                />
                {deletingId === image._id && (
                  <div className="delete-overlay">
                    <div className="spinner"></div>
                    <p>Deleting...</p>
                  </div>
                )}
                <div className="image-overlay">
                  <div className="overlay-actions">
                    <button 
                      className="preview-button"
                      onClick={() => handleImageClick(image, index)}
                      title="Preview image"
                    >
                      <span className="button-icon">👁️</span>
                      <span className="button-text">Preview</span>
                    </button>
                  </div>
                </div>
                <div className="image-badge">
                  <span className="file-type">{getImageType(image.filename)}</span>
                </div>
              </div>
              
              <div className="image-info">
                <div className="image-header">
                  <h4 className="image-name" title={image.originalName}>
                    {image.originalName.length > 25 
                      ? image.originalName.substring(0, 25) + '...' 
                      : image.originalName
                    }
                  </h4>
                  <div className="image-meta">
                    <span className="image-date">{formatDate(image.uploadDate)}</span>
                  </div>
                </div>
                
                <div className="image-actions">
                  <a
                    href={`${API_URL}/uploads/${image.filename}`}
                    className="download-button"
                    download={image.originalName}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Download image"
                  >
                    <span className="button-icon">⬇️</span>
                    <span className="button-text">Download</span>
                  </a>
                  <button
                    className="delete-button"
                    onClick={() => handleDelete(image._id)}
                    disabled={deletingId === image._id}
                    title="Delete image"
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

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="preview-modal"
          onClick={closePreview}
          onKeyDown={handlePreviewKeyDown}
          tabIndex={-1}
          ref={previewModalRef}
        >
          <div className="preview-content" onClick={e => e.stopPropagation()}>
            <button className="preview-close" onClick={closePreview}>
              ✕
            </button>
            
            {/* Navigation Controls */}
            <div className="preview-navigation">
              <button 
                className="nav-button prev-button" 
                onClick={handlePrevImage}
                disabled={currentImageIndex === 0}
                title="Previous image (←)"
              >
                ‹
              </button>
              <span className="image-counter">
                {currentImageIndex + 1} / {images.length}
              </span>
              <button 
                className="nav-button next-button" 
                onClick={handleNextImage}
                disabled={currentImageIndex === images.length - 1}
                title="Next image (→)"
              >
                ›
              </button>
            </div>
            
            {/* Zoom Controls */}
            <div className="zoom-controls">
              <button className="zoom-btn" onClick={handleZoomOut} title="Zoom Out (-)">
                <span className="zoom-icon">🔍</span>
                <span className="zoom-text">-</span>
              </button>
              <span className="zoom-level">{Math.round(zoomLevel * 100)}%</span>
              <button className="zoom-btn" onClick={handleZoomIn} title="Zoom In (+)">
                <span className="zoom-icon">🔍</span>
                <span className="zoom-text">+</span>
              </button>
              <button className="zoom-btn reset-btn" onClick={handleResetZoom} title="Reset Zoom (0)">
                <span className="zoom-icon">🔄</span>
              </button>
            </div>
            
            <div className="preview-image-container">
              {!imageLoaded && (
                <div className="image-loading">
                  <div className="spinner"></div>
                  <p>Loading image...</p>
                </div>
              )}
              <img
                ref={imageRef}
                src={`${API_URL}/uploads/${previewImage.filename}`}
                alt={previewImage.originalName}
                className="preview-image"
                style={{ 
                  transform: zoomLevel !== 1 ? `scale(${zoomLevel})` : 'none',
                  opacity: imageLoaded ? 1 : 0,
                  transition: 'opacity 0.3s ease, transform 0.3s ease'
                }}
                onLoad={handleImageLoad}
              />
            </div>
            
            <div className="preview-info">
              <div className="preview-header">
                <h3>{previewImage.originalName}</h3>
                <span className="file-type-badge">{getImageType(previewImage.filename)}</span>
              </div>
              <div className="preview-details">
                <p><span className="detail-label">Uploaded:</span> {formatDate(previewImage.uploadDate)}</p>
                <p><span className="detail-label">Dimensions:</span> Loading...</p>
              </div>
              <p className="zoom-hint">
                Use + / - keys or buttons to zoom • Press 0 to reset • ← → to navigate • ESC to close
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ImageGallery; 