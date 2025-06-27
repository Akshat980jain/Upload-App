import React, { useState, useRef } from 'react';
import './ImageUpload.css';

const ImageUpload = ({ onImageUpload, token }) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const validateFile = (file) => {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return `File "${file.name}" is not a valid image type (JPEG, PNG, GIF, WebP)`;
    }

    // Validate file size (20MB)
    if (file.size > 20 * 1024 * 1024) {
      return `File "${file.name}" is too large (max 20MB)`;
    }

    return null;
  };

  const handleFiles = async (files) => {
    const validationErrors = [];
    const validFiles = [];

    files.forEach(file => {
      const error = validateFile(file);
      if (error) {
        validationErrors.push(error);
      } else {
        validFiles.push(file);
      }
    });

    if (validationErrors.length > 0) {
      setError(validationErrors.join('\n'));
    } else {
      setError(null);
    }

    if (validFiles.length === 0) {
      return; // Stop if there are no valid files to upload
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadedCount(0);
    setTotalFiles(validFiles.length);

    // If multiple files, use bulk upload endpoint
    if (validFiles.length > 1) {
      const formData = new FormData();
      validFiles.forEach(file => {
        formData.append('images', file);
      });

      try {
        const response = await fetch('https://gallayhub.onrender.com/api/images/upload-multiple', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Bulk upload failed');
        }

        const result = await response.json();
        
        // Add all uploaded images to the gallery
        result.images.forEach(image => {
          onImageUpload(image);
        });
        
        setUploadedCount(validFiles.length);
        setUploadProgress(100);

        setTimeout(() => {
          setUploadProgress(0);
          setUploading(false);
          setUploadedCount(0);
          setTotalFiles(0);
          
          // Reset form
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }, 1000);

      } catch (err) {
        console.error('Bulk upload error:', err);
        setError(err.message);
        setUploading(false);
        setUploadProgress(0);
        setUploadedCount(0);
        setTotalFiles(0);
      }
    } else {
      // Single file upload - use existing logic
      const file = validFiles[0];
      
      const formData = new FormData();
      formData.append('image', file);

      try {
        const response = await fetch('https://gallayhub.onrender.com/api/images/upload', {
          method: 'POST',
          headers: {
              'Authorization': `Bearer ${token}`
          },
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Failed to upload "${file.name}": ${errorData.message || 'Upload failed'}`);
        }

        const uploadedImage = await response.json();
        onImageUpload(uploadedImage);
        setUploadedCount(1);
        setUploadProgress(100);

        setTimeout(() => {
          setUploadProgress(0);
          setUploading(false);
          setUploadedCount(0);
          setTotalFiles(0);
          
          // Reset form
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }, 1000);

      } catch (err) {
        console.error('Upload error:', err);
        setError(err.message);
        setUploading(false);
        setUploadProgress(0);
        setUploadedCount(0);
        setTotalFiles(0);
      }
    }
  };

  const onButtonClick = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="image-upload-container">
      <div className="upload-section">
        <div
          className={`upload-area ${dragActive ? 'drag-active' : ''} ${uploading ? 'uploading' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleChange}
            style={{ display: 'none' }}
          />
          
          <div className="upload-content">
            {uploading ? (
              <div className="upload-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p>Uploading... {uploadedCount}/{totalFiles} ({Math.round(uploadProgress)}%)</p>
                <p className="upload-status">Uploaded {uploadedCount} of {totalFiles} images</p>
              </div>
            ) : (
              <>
                <div className="upload-icon">📁</div>
                <h3>Drop your images here</h3>
                <p>or</p>
                <button 
                  className="upload-button"
                  onClick={onButtonClick}
                  disabled={uploading}
                >
                  Choose Files
                </button>
                <p className="upload-hint">
                  Supports: JPEG, PNG, GIF, WebP (Max: 20MB each)
                </p>
                <p className="upload-hint">
                  You can select multiple files or drag multiple images
                </p>
              </>
            )}
          </div>
        </div>
        
        {error && (
          <div className="error-message">
            {error.split('\n').map((line, index) => (
              <div key={index}>{line}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUpload; 