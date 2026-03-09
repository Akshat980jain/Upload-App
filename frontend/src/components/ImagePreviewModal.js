import React, { useEffect, useCallback, useState } from 'react';
import { X, Download, Trash2, ChevronLeft, ChevronRight, ExternalLink, FileText, Loader, FolderOpen, ArrowLeft, Pencil, Play, Pause, Share2 } from 'lucide-react';
import ImageEditor from './ImageEditor';
import ShareModal from './ShareModal';
import './ImagePreviewModal.css';

const API_URL = process.env.REACT_APP_API_URL ?? 'https://galleryhub.onrender.com';

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
        return '📄';
    }
    return null;
};

// ─── File type helpers ───
const getFileExt = (name) => (name || '').split('.').pop()?.toLowerCase() || '';

const PDF_EXTS = ['pdf'];
const OFFICE_EXTS = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'];
const TEXT_EXTS = ['txt', 'csv', 'json', 'xml', 'md', 'log', 'yml', 'yaml', 'ini', 'cfg', 'env', 'html', 'css', 'js', 'ts', 'jsx', 'tsx', 'py', 'java', 'c', 'cpp', 'h', 'rb', 'go', 'rs', 'sh', 'bat', 'sql', 'toml'];
const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico'];

// ─── Document Viewer Sub-Component ───
const DocViewer = ({ item, mediaUrl, icon }) => {
    const ext = getFileExt(item.originalName);
    const [textContent, setTextContent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Determine viewer type
    const isPdf = PDF_EXTS.includes(ext);
    const isOffice = OFFICE_EXTS.includes(ext);
    const isText = TEXT_EXTS.includes(ext);
    const isImage = IMAGE_EXTS.includes(ext);

    // Fetch text content for text-based files
    useEffect(() => {
        if (!isText) {
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        setTextContent(null);
        fetch(mediaUrl)
            .then(res => {
                if (!res.ok) throw new Error('Failed to load file');
                return res.text();
            })
            .then(text => {
                setTextContent(text);
                setLoading(false);
            })
            .catch(err => {
                setError(err.message);
                setLoading(false);
            });
    }, [mediaUrl, isText]);

    // ─── PDF Viewer ───
    if (isPdf) {
        return (
            <div className="doc-viewer-container animate-scale-in">
                <div className="doc-viewer-loading" id="doc-loading">
                    <Loader size={28} className="spinner" />
                    <p>Loading PDF…</p>
                </div>
                <iframe
                    src={mediaUrl}
                    title={item.originalName}
                    className="doc-viewer-iframe"
                    onLoad={() => {
                        const el = document.getElementById('doc-loading');
                        if (el) el.style.display = 'none';
                    }}
                />
            </div>
        );
    }

    // ─── Office Doc Viewer (Google Docs Viewer) ───
    if (isOffice) {
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        if (isLocalhost) {
            // Google Docs Viewer can't access localhost URLs
            return (
                <div className="doc-viewer-fallback animate-scale-in">
                    <span className="doc-viewer-icon">{icon}</span>
                    <p className="doc-viewer-filename">{item.originalName}</p>
                    <p className="doc-viewer-hint">Office document preview is available when deployed.<br />On localhost, please download to view.</p>
                    <a href={mediaUrl} download={item.originalName} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ marginTop: '16px', textDecoration: 'none' }}>
                        <Download size={16} /> Download File
                    </a>
                </div>
            );
        }
        const googleViewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(mediaUrl)}&embedded=true`;
        return (
            <div className="doc-viewer-container animate-scale-in">
                <div className="doc-viewer-loading" id="doc-loading">
                    <Loader size={28} className="spinner" />
                    <p>Loading document…</p>
                </div>
                <iframe
                    src={googleViewerUrl}
                    title={item.originalName}
                    className="doc-viewer-iframe"
                    onLoad={() => {
                        const el = document.getElementById('doc-loading');
                        if (el) el.style.display = 'none';
                    }}
                />
            </div>
        );
    }

    // ─── Text / Code Viewer ───
    if (isText) {
        if (loading) {
            return (
                <div className="doc-viewer-fallback animate-scale-in">
                    <Loader size={32} className="spinner" />
                    <p>Loading file contents…</p>
                </div>
            );
        }
        if (error) {
            return (
                <div className="doc-viewer-fallback animate-scale-in">
                    <span className="doc-viewer-icon">{icon}</span>
                    <p className="doc-viewer-filename">{item.originalName}</p>
                    <p className="doc-viewer-hint">Could not load file preview.</p>
                    <a href={mediaUrl} download={item.originalName} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ marginTop: '16px', textDecoration: 'none' }}>
                        <Download size={16} /> Download File
                    </a>
                </div>
            );
        }
        return (
            <div className="doc-text-viewer animate-scale-in">
                <div className="doc-text-header">
                    <FileText size={16} />
                    <span>{item.originalName}</span>
                    <span className="doc-text-ext">{ext.toUpperCase()}</span>
                </div>
                <pre className="doc-text-content">{textContent}</pre>
            </div>
        );
    }

    // ─── Image documents ───
    if (isImage) {
        return (
            <img src={mediaUrl} alt={item.originalName} className="preview-image animate-scale-in" />
        );
    }

    // ─── Fallback (unsupported) ───
    return (
        <div className="doc-viewer-fallback animate-scale-in">
            <span className="doc-viewer-icon">{icon}</span>
            <p className="doc-viewer-filename">{item.originalName}</p>
            <p className="doc-viewer-hint">Preview not available for this file type.</p>
            <a href={mediaUrl} download={item.originalName} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ marginTop: '16px', textDecoration: 'none' }}>
                <Download size={16} /> Download File
            </a>
        </div>
    );
};

const ImagePreviewModal = ({ image, images, onClose, onDelete, onNavigate, folders = [], onMoveToFolder, onRemoveFromFolder, token, onRefresh }) => {
    const currentIndex = images.findIndex((img) => img._id === image._id);
    const [showFolderPicker, setShowFolderPicker] = useState(false);
    const [showEditor, setShowEditor] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);

    const goPrev = useCallback(() => {
        if (currentIndex > 0) onNavigate(images[currentIndex - 1]);
    }, [currentIndex, images, onNavigate]);

    const goNext = useCallback(() => {
        if (currentIndex < images.length - 1) onNavigate(images[currentIndex + 1]);
    }, [currentIndex, images, onNavigate]);

    useEffect(() => {
        const handler = (e) => {
            if (e.key === 'Escape') onClose();
            else if (e.key === 'ArrowLeft') goPrev();
            else if (e.key === 'ArrowRight') goNext();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose, goPrev, goNext]);

    // Prevent body scroll
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    // Slideshow
    const [slideshowActive, setSlideshowActive] = useState(false);
    useEffect(() => {
        if (!slideshowActive) return;
        const timer = setInterval(() => {
            if (currentIndex < images.length - 1) goNext();
            else setSlideshowActive(false);
        }, 5000);
        return () => clearInterval(timer);
    }, [slideshowActive, currentIndex, images.length, goNext]);

    const formatDate = (d) => new Date(d).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
    });

    const mediaUrl = getMediaUrl(image);
    const icon = getMediaIcon(image);

    return (
        <div className="preview-overlay" onClick={onClose}>
            <div className="preview-modal" onClick={(e) => e.stopPropagation()}>
                {/* Back button (top-left, always visible) */}
                <button className="preview-back" onClick={onClose}>
                    <ArrowLeft size={20} />
                    <span className="preview-back-label">Back</span>
                </button>
                {/* Close */}
                <button className="preview-close" onClick={onClose}><X size={20} /></button>

                {/* Navigation */}
                {currentIndex > 0 && (
                    <button className="preview-nav prev" onClick={goPrev}>
                        <ChevronLeft size={24} />
                    </button>
                )}
                {currentIndex < images.length - 1 && (
                    <button className="preview-nav next" onClick={goNext}>
                        <ChevronRight size={24} />
                    </button>
                )}

                {/* Content */}
                <div className="preview-image-wrapper">
                    {image.mediaType === 'video' ? (
                        <video
                            src={mediaUrl}
                            controls
                            className="preview-image animate-scale-in"
                            style={{ maxHeight: '70vh', objectFit: 'contain' }}
                        />
                    ) : image.mediaType === 'document' ? (
                        <DocViewer item={image} mediaUrl={mediaUrl} icon={icon} />
                    ) : (
                        <img
                            src={mediaUrl}
                            alt={image.originalName}
                            className="preview-image animate-scale-in"
                        />
                    )}
                </div>

                {/* Info bar */}
                <div className="preview-info-bar">
                    <div className="preview-details">
                        <h3>{image.originalName}</h3>
                        <div className="preview-meta-row">
                            <span className="preview-date">{formatDate(image.uploadDate || image.createdAt)}</span>
                            {image.size && <span className="preview-meta-tag">{image.size < 1024 ? image.size + ' B' : image.size < 1024 * 1024 ? (image.size / 1024).toFixed(1) + ' KB' : (image.size / (1024 * 1024)).toFixed(1) + ' MB'}</span>}
                            <span className="preview-meta-tag">{(image.originalName?.split('.').pop() || '').toUpperCase()}</span>
                            <span className="preview-meta-tag">{image.mediaType === 'video' ? '🎥 Video' : image.mediaType === 'document' ? '📄 Document' : '🖼️ Image'}</span>
                            <span className="preview-counter">{currentIndex + 1} / {images.length}</span>
                        </div>
                    </div>
                    <div className="preview-actions">
                        {/* Move to folder */}
                        <div style={{ position: 'relative' }}>
                            <button
                                className={`preview-action-btn ${image.folder ? 'active-folder' : ''}`}
                                onClick={() => setShowFolderPicker(!showFolderPicker)}
                                title={image.folder ? 'In folder — click to change' : 'Move to folder'}
                            >
                                <FolderOpen size={18} />
                            </button>
                            {showFolderPicker && (
                                <div className="folder-picker-dropdown animate-slide-down">
                                    <p className="folder-picker-title">Move to folder</p>
                                    {folders.length === 0 ? (
                                        <p className="folder-picker-empty">No folders created yet</p>
                                    ) : (
                                        folders.map(f => (
                                            <button
                                                key={f._id}
                                                className={`folder-picker-item ${image.folder === f._id ? 'current' : ''}`}
                                                onClick={() => {
                                                    onMoveToFolder && onMoveToFolder(f._id, image._id, image.mediaType);
                                                    setShowFolderPicker(false);
                                                }}
                                            >
                                                <span className="folder-picker-dot" style={{ background: f.color }}></span>
                                                <span>{f.name}</span>
                                                {image.folder === f._id && <span className="folder-picker-check">✓</span>}
                                            </button>
                                        ))
                                    )}
                                    {image.folder && (
                                        <>
                                            <div className="folder-picker-divider" />
                                            <button
                                                className="folder-picker-item remove"
                                                onClick={() => {
                                                    onRemoveFromFolder && onRemoveFromFolder(image._id, image.mediaType);
                                                    setShowFolderPicker(false);
                                                }}
                                            >
                                                <X size={14} />
                                                <span>Remove from folder</span>
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                        {images.length > 1 && (
                            <button className={`preview-action-btn ${slideshowActive ? 'active-folder' : ''}`} onClick={() => setSlideshowActive(!slideshowActive)} title={slideshowActive ? 'Pause slideshow' : 'Start slideshow'}>
                                {slideshowActive ? <Pause size={18} /> : <Play size={18} />}
                            </button>
                        )}
                        {(!image.mediaType || image.mediaType === 'image') && (
                            <button className="preview-action-btn" onClick={() => setShowEditor(true)} title="Edit image">
                                <Pencil size={18} />
                            </button>
                        )}
                        <button className="preview-action-btn" onClick={() => setShowShareModal(true)} title="Share">
                            <Share2 size={18} />
                        </button>
                        <a
                            href={mediaUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="preview-action-btn"
                            title="Open in new tab"
                        >
                            <ExternalLink size={18} />
                        </a>
                        <a
                            href={mediaUrl}
                            download={image.originalName}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="preview-action-btn"
                            title="Download"
                        >
                            <Download size={18} />
                        </a>
                        <button
                            className="preview-action-btn danger"
                            onClick={() => { onDelete(image._id); onClose(); }}
                            title="Delete"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>
                {showEditor && (
                    <ImageEditor
                        image={image}
                        token={token}
                        onClose={() => setShowEditor(false)}
                        onSave={() => { setShowEditor(false); onRefresh && onRefresh(); }}
                    />
                )}
                {showShareModal && (
                    <ShareModal
                        isOpen={showShareModal}
                        onClose={() => setShowShareModal(false)}
                        fileId={image._id}
                        fileType={image.mediaType || 'image'}
                        fileName={image.originalName}
                        token={token}
                    />
                )}
            </div>
        </div>
    );
};

export default ImagePreviewModal;
