import React, { useState, useRef } from 'react';
import { Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';
import './ImageUpload.css';

const API_URL = process.env.REACT_APP_API_URL ?? 'https://galleryhub.onrender.com';

const classifyFile = (file) => {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  return 'document';
};

const getFileIcon = (file) => {
  const type = classifyFile(file);
  if (type === 'video') return '🎥';
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (['pdf'].includes(ext)) return '📕';
  if (['doc', 'docx'].includes(ext)) return '📘';
  if (['xls', 'xlsx', 'csv'].includes(ext)) return '📊';
  if (['ppt', 'pptx'].includes(ext)) return '📑';
  if (['zip', 'rar', '7z'].includes(ext)) return '📦';
  if (type === 'document') return '📄';
  return null; // image — use thumbnail
};

const UploadModal = ({ isOpen, onClose, onImageUpload, onVideoUpload, onDocumentUpload, token, uploadMode = 'all', folderId, folderName }) => {
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);

  if (!isOpen) return null;

  const acceptTypes = {
    all: undefined,
    images: 'image/*',
    videos: 'video/*',
    documents: '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar,.7z',
  };

  const handleFiles = (newFiles) => {
    const validFiles = Array.from(newFiles).filter((f) => {
      if (f.size > 50 * 1024 * 1024) {
        toast.error(`${f.name} exceeds 50MB limit`);
        return false;
      }
      if (uploadMode === 'images' && !f.type.startsWith('image/')) {
        toast.error(`${f.name} is not an image`);
        return false;
      }
      if (uploadMode === 'videos' && !f.type.startsWith('video/')) {
        toast.error(`${f.name} is not a video`);
        return false;
      }
      return true;
    });

    setFiles((prev) => [...prev, ...validFiles]);
    const newPreviews = validFiles.map((f) => {
      const icon = getFileIcon(f);
      return {
        name: f.name,
        size: (f.size / (1024 * 1024)).toFixed(1) + ' MB',
        url: f.type.startsWith('image/') ? URL.createObjectURL(f) : null,
        icon,
        fileType: classifyFile(f),
      };
    });
    setPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeFile = (index) => {
    if (previews[index].url) URL.revokeObjectURL(previews[index].url);
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setProgress(0);

    try {
      // Group files by type
      const imageFiles = files.filter(f => classifyFile(f) === 'image');
      const videoFiles = files.filter(f => classifyFile(f) === 'video');
      const docFiles = files.filter(f => classifyFile(f) === 'document');

      const uploads = [];
      const uploadedImageIds = [];
      const uploadedVideoIds = [];
      const uploadedDocIds = [];

      // Upload images
      if (imageFiles.length > 0) {
        const formData = new FormData();
        if (imageFiles.length === 1) {
          formData.append('image', imageFiles[0]);
          uploads.push(
            fetch(`${API_URL}/api/images/upload`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}` },
              body: formData,
            }).then(async (res) => {
              if (!res.ok) throw new Error('Image upload failed');
              const result = await res.json();
              if (result._id) uploadedImageIds.push(result._id);
              if (onImageUpload) onImageUpload(result);
            })
          );
        } else {
          imageFiles.forEach((f) => formData.append('images', f));
          uploads.push(
            fetch(`${API_URL}/api/images/upload-multiple`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}` },
              body: formData,
            }).then(async (res) => {
              if (!res.ok) throw new Error('Image upload failed');
              const result = await res.json();
              if (result.images) result.images.forEach((img) => {
                if (img._id) uploadedImageIds.push(img._id);
                if (onImageUpload) onImageUpload(img);
              });
            })
          );
        }
      }

      // Upload videos
      if (videoFiles.length > 0) {
        const formData = new FormData();
        videoFiles.forEach((f) => formData.append('videos', f));
        uploads.push(
          fetch(`${API_URL}/api/videos/upload-multiple`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          }).then(async (res) => {
            if (!res.ok) throw new Error('Video upload failed');
            const result = await res.json();
            result.forEach((vid) => {
              if (vid._id) uploadedVideoIds.push(vid._id);
              if (onVideoUpload) onVideoUpload(vid);
            });
          })
        );
      }

      // Upload documents
      if (docFiles.length > 0) {
        const formData = new FormData();
        docFiles.forEach((f) => formData.append('documents', f));
        uploads.push(
          fetch(`${API_URL}/api/documents/upload-multiple`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          }).then(async (res) => {
            if (!res.ok) throw new Error('Document upload failed');
            const result = await res.json();
            result.forEach((doc) => {
              if (doc._id) uploadedDocIds.push(doc._id);
              if (onDocumentUpload) onDocumentUpload(doc);
            });
          })
        );
      }

      await Promise.all(uploads);

      // If uploading into a folder, move files to that folder
      if (folderId) {
        const moveToFolder = async (ids, fileType) => {
          if (ids.length === 0) return;
          await fetch(`${API_URL}/api/folders/${folderId}/move`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ fileIds: ids, fileType }),
          });
        };
        await Promise.all([
          moveToFolder(uploadedImageIds, 'image'),
          moveToFolder(uploadedVideoIds, 'video'),
          moveToFolder(uploadedDocIds, 'document'),
        ]);
      }

      setProgress(100);
      toast.success(`${files.length} file${files.length > 1 ? 's' : ''} uploaded!${folderId ? ` Added to ${folderName || 'folder'}` : ''}`);

      setTimeout(() => {
        previews.forEach((p) => { if (p.url) URL.revokeObjectURL(p.url); });
        setFiles([]);
        setPreviews([]);
        setProgress(0);
        setUploading(false);
        onClose();
      }, 800);
    } catch (err) {
      toast.error(err.message || 'Upload failed');
      setUploading(false);
      setProgress(0);
    }
  };

  const handleClose = () => {
    if (uploading) return;
    previews.forEach((p) => { if (p.url) URL.revokeObjectURL(p.url); });
    setFiles([]);
    setPreviews([]);
    onClose();
  };

  const modeLabels = {
    all: 'Upload Files',
    images: 'Upload Images',
    videos: 'Upload Videos',
    documents: 'Upload Documents',
  };

  const modeHints = {
    all: 'Images, videos, documents — up to 50MB each',
    images: 'PNG, JPG, GIF, WebP — up to 50MB each',
    videos: 'MP4, MOV, AVI, MKV — up to 50MB each',
    documents: 'PDF, DOC, XLS, PPT, TXT, ZIP — up to 50MB each',
  };

  return (
    <div className="upload-overlay" onClick={handleClose}>
      <div className="upload-modal animate-scale-in" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="upload-modal-header">
          <h2>{folderId ? `Upload to ${folderName || 'Folder'}` : modeLabels[uploadMode]}</h2>
          <button className="upload-close-btn" onClick={handleClose} disabled={uploading}>
            <X size={20} />
          </button>
        </div>

        {/* Drop Zone */}
        <div
          className={`upload-dropzone ${dragActive ? 'drag-active' : ''} ${previews.length > 0 ? 'has-files' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept={acceptTypes[uploadMode]}
            multiple
            onChange={(e) => handleFiles(e.target.files)}
            style={{ display: 'none' }}
          />
          <Upload size={32} className="upload-zone-icon" />
          <p className="upload-zone-text">
            <strong>Click to upload</strong> or drag and drop
          </p>
          <p className="upload-zone-hint">{modeHints[uploadMode]}</p>
        </div>

        {/* Preview Thumbnails */}
        {previews.length > 0 && (
          <div className="upload-previews">
            {previews.map((p, i) => (
              <div key={i} className="upload-preview-item">
                {p.url ? (
                  <img src={p.url} alt={p.name} className="preview-thumb" />
                ) : (
                  <div className="preview-thumb preview-thumb-icon">{p.icon}</div>
                )}
                <div className="preview-meta">
                  <span className="preview-name">{p.name.length > 20 ? p.name.slice(0, 20) + '...' : p.name}</span>
                  <span className="preview-size">{p.size}</span>
                </div>
                {!uploading && (
                  <button className="preview-remove" onClick={() => removeFile(i)}>
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Progress Bar */}
        {uploading && (
          <div className="upload-progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        )}

        {/* Footer */}
        <div className="upload-modal-footer">
          <span className="file-count">{files.length} file{files.length !== 1 ? 's' : ''} selected</span>
          <button
            className="upload-submit-btn"
            onClick={handleUpload}
            disabled={files.length === 0 || uploading}
          >
            {uploading ? 'Uploading...' : `Upload ${files.length > 0 ? `(${files.length})` : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadModal;