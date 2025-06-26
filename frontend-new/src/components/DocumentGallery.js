import React, { useState } from 'react';
import './ImageGallery.css';

const API_URL = 'https://gallaryhub.onrender.com';

const getIcon = (type) => {
  switch (type) {
    case 'pdf': return '📕';
    case 'ppt':
    case 'pptx': return '📊';
    case 'xls':
    case 'xlsx': return '📈';
    default: return '📄';
  }
};

const DocumentGallery = ({ documents, onDocumentDelete, onRefresh, token }) => {
  const [deletingMultiple, setDeletingMultiple] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState([]);

  const handleDelete = async (docId) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        const response = await fetch(`${API_URL}/api/documents/${docId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          onDocumentDelete(docId);
        } else {
          alert('Failed to delete document');
        }
      } catch (error) {
        alert('Error deleting document');
      }
    }
  };

  const handleSelectDocument = (id) => {
    setSelectedDocuments((prev) =>
      prev.includes(id) ? prev.filter((docId) => docId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedDocuments.length === documents.length) {
      setSelectedDocuments([]);
    } else {
      setSelectedDocuments(documents.map((doc) => doc._id));
    }
  };

  const handleDownloadSelected = async () => {
    if (selectedDocuments.length === 0) return;
    const response = await fetch(`${API_URL}/api/documents/download-zip`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ documentIds: selectedDocuments }),
    });
    if (!response.ok) {
      alert('Failed to download zip');
      return;
    }
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'documents.zip';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
    setSelectedDocuments([]);
  };

  const handleDeleteSelected = async () => {
    if (selectedDocuments.length === 0) return;
    
    const confirmMessage = selectedDocuments.length === 1 
      ? 'Are you sure you want to delete this document?' 
      : `Are you sure you want to delete ${selectedDocuments.length} documents? This action cannot be undone.`;
    
    if (window.confirm(confirmMessage)) {
      setDeletingMultiple(true);
      try {
        const deletePromises = selectedDocuments.map(async (docId) => {
          const response = await fetch(`${API_URL}/api/documents/${docId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (!response.ok) {
            throw new Error(`Failed to delete document ${docId}`);
          }
          
          return docId;
        });

        const deletedIds = await Promise.all(deletePromises);
        
        // Remove deleted documents from the list
        deletedIds.forEach(id => onDocumentDelete(id));
        
        // Clear selection
        setSelectedDocuments([]);
        
        // Show success message
        const message = deletedIds.length === 1 
          ? 'Document deleted successfully!' 
          : `${deletedIds.length} documents deleted successfully!`;
        alert(message);
        
      } catch (error) {
        console.error('Error deleting documents:', error);
        alert('Some documents could not be deleted. Please try again.');
      } finally {
        setDeletingMultiple(false);
      }
    }
  };

  if (!documents.length) {
    return (
      <div className="image-gallery-container">
        <div className="empty-gallery">
          <div className="empty-icon">📄</div>
          <h3>No documents uploaded yet</h3>
          <p>Upload your first document to get started!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="image-gallery-container">
      <div className="gallery-header">
        <div className="gallery-title">
          <h2>Document Gallery</h2>
          <div className="gallery-stats">
            <span className="image-count">{documents.length} {documents.length === 1 ? 'document' : 'documents'}</span>
          </div>
        </div>
        <div className="gallery-actions">
          <button className="select-all-btn" onClick={handleSelectAll}>
            {selectedDocuments.length === documents.length ? 'Unselect All' : 'Select All'}
          </button>
          <button className="download-selected-btn" onClick={handleDownloadSelected} disabled={selectedDocuments.length === 0}>
            Download Selected
          </button>
          <button 
            className="delete-selected-btn" 
            onClick={handleDeleteSelected} 
            disabled={selectedDocuments.length === 0 || deletingMultiple}
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
        {documents.map(doc => (
          <div className="image-card" key={doc._id}>
            <div className="image-select-checkbox">
              <input
                type="checkbox"
                checked={selectedDocuments.includes(doc._id)}
                onChange={() => handleSelectDocument(doc._id)}
              />
            </div>
            <div className="image-preview">
              <span style={{ fontSize: '3rem' }}>{getIcon(doc.type)}</span>
            </div>
            <div className="image-info">
              <div className="image-name" title={doc.originalName}>{doc.originalName}</div>
              <div className="image-meta">{doc.type.toUpperCase()} &middot; {(doc.size / 1024 / 1024).toFixed(2)} MB</div>
              <div className="document-actions">
                <a
                  href={`${API_URL}/${doc.path.replace(/\\\\/g, '/').replace(/\\/g, '/')}`}
                  className="download-button"
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  onError={e => { e.target.style.display = 'none'; }}
                >
                  <span className="button-icon">⬇️</span>
                  Download
                </a>
                <button className="delete-button" onClick={() => handleDelete(doc._id)}>
                  <span className="button-icon">🗑️</span>
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DocumentGallery; 