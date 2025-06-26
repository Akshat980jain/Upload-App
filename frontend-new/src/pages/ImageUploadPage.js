import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import ImageUpload from '../components/ImageUpload';
import ImageGallery from '../components/ImageGallery';
import './ImageUploadPage.css';

const ImageUploadPage = ({ token }) => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchImages = useCallback(async () => {
    if (!token) {
      navigate('/');
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch('https://gallayhub.onrender.com/api/images', {
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
        throw new Error(errorData.message || 'Failed to fetch images');
      }
      
      const data = await response.json();

      if (Array.isArray(data)) {
        setImages(data);
      } else {
        console.error('Received data is not an array:', data);
        setImages([]);
        throw new Error('Received invalid data format from server.');
      }

      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch images');
      console.error('Error fetching images:', err);
      setImages([]);
    } finally {
      setLoading(false);
    }
  }, [token, navigate]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const handleImageUpload = (newImage) => {
    setImages(prevImages => [newImage, ...prevImages]);
  };

  const handleImageDelete = (deletedId) => {
    setImages(prevImages => prevImages.filter(img => img._id !== deletedId));
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
            <h1>🖼️ Image Gallery</h1>
            <div className="page-stats">
              <span className="stat-item">
                <span className="stat-icon">🖼️</span>
                <span className="stat-text">{images.length} Images</span>
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="page-main">
        <ImageUpload onImageUpload={handleImageUpload} token={token} />

        <div className="gallery-section">
          <div className="section-header">
            <h2>Your Image Gallery</h2>
            <p>View, preview, and manage your uploaded images</p>
          </div>
          
          {loading && <div className="loading">Loading images...</div>}
          {error && <div className="error">{error}</div>}
          
          <ImageGallery 
            images={images} 
            onImageDelete={handleImageDelete}
            onRefresh={fetchImages}
            token={token}
          />
        </div>
      </main>
    </div>
  );
};

export default ImageUploadPage; 