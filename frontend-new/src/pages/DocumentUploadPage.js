import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import DocumentUpload from '../components/DocumentUpload';
import DocumentGallery from '../components/DocumentGallery';
import './ImageUploadPage.css';

const getTypeFilter = (pathname) => {
  if (pathname.endsWith('/pdf')) return 'pdf';
  if (pathname.endsWith('/ppt')) return 'ppt';
  if (pathname.endsWith('/pptx')) return 'pptx';
  if (pathname.endsWith('/xls')) return 'xls';
  if (pathname.endsWith('/xlsx')) return 'xlsx';
  if (pathname.endsWith('/doc')) return 'doc';
  if (pathname.endsWith('/docx')) return 'docx';
  if (pathname.endsWith('/txt')) return 'txt';
  if (pathname.endsWith('/zip')) return 'zip';
  if (pathname.endsWith('/csv')) return 'csv';
  if (pathname.endsWith('/excel')) return 'excel';
  return null;
};

const DocumentUploadPage = ({ token }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const typeFilter = getTypeFilter(location.pathname);

  const fetchDocuments = useCallback(async () => {
    if (!token) {
      navigate('/');
      return;
    }
    try {
      setLoading(true);
      const response = await fetch('https://gallayhub.onrender.com/api/documents', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        if (response.status === 401) {
          navigate('/');
          throw new Error('Session expired. Please login again.');
        }
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch documents');
      }
      const data = await response.json();
      setDocuments(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch documents');
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [token, navigate]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleDocumentUpload = (newDocs) => {
    setDocuments(prevDocs => [...newDocs, ...prevDocs]);
  };

  const handleDocumentDelete = (deletedId) => {
    setDocuments(prevDocs => prevDocs.filter(doc => doc._id !== deletedId));
  };

  // Filter documents by type
  let filteredDocs = documents;
  if (typeFilter === 'pdf') {
    filteredDocs = documents.filter(doc => doc.type === 'pdf');
  } else if (typeFilter === 'ppt') {
    filteredDocs = documents.filter(doc => doc.type === 'ppt' || doc.type === 'pptx');
  } else if (typeFilter === 'pptx') {
    filteredDocs = documents.filter(doc => doc.type === 'pptx');
  } else if (typeFilter === 'xls') {
    filteredDocs = documents.filter(doc => doc.type === 'xls');
  } else if (typeFilter === 'xlsx') {
    filteredDocs = documents.filter(doc => doc.type === 'xlsx');
  } else if (typeFilter === 'doc') {
    filteredDocs = documents.filter(doc => doc.type === 'doc');
  } else if (typeFilter === 'docx') {
    filteredDocs = documents.filter(doc => doc.type === 'docx');
  } else if (typeFilter === 'txt') {
    filteredDocs = documents.filter(doc => doc.type === 'txt');
  } else if (typeFilter === 'zip') {
    filteredDocs = documents.filter(doc => doc.type === 'zip');
  } else if (typeFilter === 'csv') {
    filteredDocs = documents.filter(doc => doc.type === 'csv');
  } else if (typeFilter === 'excel') {
    filteredDocs = documents.filter(doc => doc.type === 'xls' || doc.type === 'xlsx');
  }

  // Get the label for the current filter
  const getFilterLabel = () => {
    switch (typeFilter) {
      case 'pdf': return 'PDF';
      case 'ppt': return 'PPT/PPTX';
      case 'pptx': return 'PPTX';
      case 'xls': return 'XLS';
      case 'xlsx': return 'XLSX';
      case 'doc': return 'DOC';
      case 'docx': return 'DOCX';
      case 'txt': return 'TXT';
      case 'zip': return 'ZIP';
      case 'csv': return 'CSV';
      case 'excel': return 'Excel';
      default: return 'Document';
    }
  };

  // Calculate total size in bytes
  const totalSize = documents.reduce((sum, doc) => sum + (doc.size || 0), 0);
  // Format size helper
  const formatSize = (bytes) => {
    if (bytes >= 1024 * 1024 * 1024) {
      return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
    } else if (bytes >= 1024 * 1024) {
      return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    } else if (bytes >= 1024) {
      return (bytes / 1024).toFixed(2) + ' KB';
    } else {
      return bytes + ' B';
    }
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
            <h1>📄 Document Gallery</h1>
            <div className="page-stats">
              <span className="stat-item">
                <span className="stat-icon">📄</span>
                <span className="stat-text">{documents.length} Documents</span>
                <span className="stat-icon">💾</span>
                <span className="stat-text">{formatSize(totalSize)}</span>
              </span>
            </div>
          </div>
        </div>
      </header>
      <main className="page-main">
        <DocumentUpload onDocumentUpload={handleDocumentUpload} token={token} />
        <div className="gallery-section">
          <div className="section-header">
            <h2>Your {typeFilter ? getFilterLabel() : 'Document'} Gallery</h2>
            <p>View and manage your uploaded {typeFilter ? getFilterLabel().toLowerCase() : 'documents'}<br/>You can upload and manage <b>all file types</b> here.</p>
          </div>
          {loading && <div className="loading">Loading documents...</div>}
          {error && <div className="error">{error}</div>}
          <div className="doc-type-tabs doc-type-tabs-center">
            <button onClick={() => navigate('/documents/pdf')} className={`upload-button${typeFilter === 'pdf' ? ' active' : ''}`}>PDF</button>
            <button onClick={() => navigate('/documents/ppt')} className={`upload-button${typeFilter === 'ppt' ? ' active' : ''}`}>PPT</button>
            <button onClick={() => navigate('/documents/pptx')} className={`upload-button${typeFilter === 'pptx' ? ' active' : ''}`}>PPTX</button>
            <button onClick={() => navigate('/documents/xls')} className={`upload-button${typeFilter === 'xls' ? ' active' : ''}`}>XLS</button>
            <button onClick={() => navigate('/documents/xlsx')} className={`upload-button${typeFilter === 'xlsx' ? ' active' : ''}`}>XLSX</button>
            <button onClick={() => navigate('/documents/doc')} className={`upload-button${typeFilter === 'doc' ? ' active' : ''}`}>DOC</button>
            <button onClick={() => navigate('/documents/docx')} className={`upload-button${typeFilter === 'docx' ? ' active' : ''}`}>DOCX</button>
            <button onClick={() => navigate('/documents/txt')} className={`upload-button${typeFilter === 'txt' ? ' active' : ''}`}>TXT</button>
            <button onClick={() => navigate('/documents/zip')} className={`upload-button${typeFilter === 'zip' ? ' active' : ''}`}>ZIP</button>
            <button onClick={() => navigate('/documents/csv')} className={`upload-button${typeFilter === 'csv' ? ' active' : ''}`}>CSV</button>
            <button onClick={() => navigate('/documents')} className={`upload-button${!typeFilter ? ' active' : ''}`}>All</button>
          </div>
          <DocumentGallery 
            documents={filteredDocs} 
            onDocumentDelete={handleDocumentDelete}
            onRefresh={fetchDocuments}
            token={token}
          />
        </div>
      </main>
    </div>
  );
};

export default DocumentUploadPage; 