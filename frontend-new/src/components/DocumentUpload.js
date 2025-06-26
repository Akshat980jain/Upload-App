import React, { useRef, useState } from 'react';
import './ImageUpload.css';

const DocumentUpload = ({ onDocumentUpload, token }) => {
  const fileInputRef = useRef();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setError('');
    setUploading(true);
    const formData = new FormData();
    files.forEach(file => formData.append('documents', file));
    try {
      const response = await fetch('https://gallayhub.onrender.com/api/documents/upload-multiple', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Upload failed');
      }
      const data = await response.json();
      onDocumentUpload && onDocumentUpload(Array.isArray(data) ? data : [data]);
      fileInputRef.current.value = '';
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="upload-container">
      <div className="upload-section">
        <div className="upload-icon">📄</div>
        <div className="upload-instructions">Drop your documents here<br/>or</div>
        <label className="upload-button">
  {uploading ? 'Uploading...' : 'Choose Files'}
  <input
    type="file"
    className="upload-input hidden-file-input"
    multiple
    onChange={handleFileChange}
    disabled={uploading}
    style={{ display: 'none' }}
    ref={fileInputRef}
  />
</label>

        <div className="upload-note">
          Supports: All file types (Max: 50MB each)<br/>
          You can select multiple files or drag multiple documents
        </div>
        {error && <div className="error">{error}</div>}
      </div>
    </div>
  );
};

export default DocumentUpload; 