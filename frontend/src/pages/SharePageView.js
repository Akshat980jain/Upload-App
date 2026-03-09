import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Lock, Download, AlertTriangle, Loader, FileText } from 'lucide-react';
import './SharePageView.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const SharePageView = () => {
    const { token } = useParams();
    const [status, setStatus] = useState('loading'); // loading, password_required, loaded, error
    const [fileData, setFileData] = useState(null);
    const [password, setPassword] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        fetchSharedFile();
    }, [token]);

    const fetchSharedFile = async () => {
        setStatus('loading');
        try {
            const res = await fetch(`${API_URL}/api/share/${token}`);

            if (res.status === 401) {
                // Password required
                setStatus('password_required');
                return;
            }

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Error fetching file');
            }

            const data = await res.json();
            setFileData(data);
            setStatus('loaded');
        } catch (err) {
            setErrorMsg(err.message);
            setStatus('error');
        }
    };

    const handlePasswordSubmit = async (e) => {
        if (e) e.preventDefault();
        setErrorMsg('');
        setStatus('loading');

        try {
            const res = await fetch(`${API_URL}/api/share/${token}/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Incorrect password');
            }

            const data = await res.json();
            setFileData(data);
            setStatus('loaded');
        } catch (err) {
            setErrorMsg(err.message);
            setStatus('password_required');
        }
    };

    const formatSize = (bytes) => {
        if (!bytes) return '';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const getDownloadUrl = () => {
        // Direct media URL isn't safe for password protected files.
        // In a real app, this should be a proxy route or signed URL.
        // For now, if loaded, we assume we have the file object path.
        if (!fileData || !fileData.file) return '#';

        // This is a simplification; a secure implementation needs an auth token or cookie
        // to bypass the backend's static file auth (which we haven't implemented for public links yet).
        // For the scope of Phase 4, we'll provide the direct link assuming it's public.
        const type = fileData.fileType === 'video' ? 'videos' : fileData.fileType === 'document' ? 'documents' : 'uploads';
        return `${API_URL}/${type}/${fileData.file.filename}`;
    };

    if (status === 'loading') {
        return (
            <div className="share-page-container">
                <div className="share-card loader-card">
                    <Loader size={48} className="spinner" />
                    <p>Loading shared file...</p>
                </div>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="share-page-container">
                <div className="share-card error-card">
                    <AlertTriangle size={48} className="error-icon" />
                    <h2>Link Unavailable</h2>
                    <p>{errorMsg || 'This link may have expired or does not exist.'}</p>
                </div>
            </div>
        );
    }

    if (status === 'password_required') {
        return (
            <div className="share-page-container">
                <div className="share-card password-card animate-scale-in">
                    <div className="lock-icon-wrapper">
                        <Lock size={32} />
                    </div>
                    <h2>Password Required</h2>
                    <p>This file is protected. Please enter the password to view it.</p>

                    <form onSubmit={handlePasswordSubmit}>
                        {errorMsg && <div className="password-error">{errorMsg}</div>}
                        <input
                            type="password"
                            placeholder="Enter password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoFocus
                        />
                        <button type="submit" className="btn-primary unlock-btn">
                            Unlock File
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    // Status is 'loaded'
    const { file, fileType, sharedBy } = fileData;
    const downloadUrl = getDownloadUrl();

    return (
        <div className="share-page-container">
            <div className="share-navbar">
                <div className="logo">GalleryHub</div>
                <div className="shared-by-info">
                    Shared by {sharedBy?.name || sharedBy?.email || 'a user'}
                </div>
            </div>

            <main className="share-main-content animate-fade-in">
                <div className="preview-container">
                    {fileType === 'image' && (
                        <img
                            src={downloadUrl}
                            alt={file.originalName}
                            className="shared-preview shared-image"
                        />
                    )}

                    {fileType === 'video' && (
                        <video
                            src={downloadUrl}
                            controls
                            className="shared-preview shared-video"
                        />
                    )}

                    {fileType === 'document' && (
                        <div className="shared-preview shared-document">
                            <FileText size={80} className="doc-icon" />
                            <h3>{file.originalName}</h3>
                            <p>Document preview not fully supported here. Please download to view.</p>
                        </div>
                    )}
                </div>

                <div className="file-info-panel">
                    <h2 title={file.originalName}>{file.originalName}</h2>

                    <div className="file-meta-row">
                        <span className="file-meta-tag">{formatSize(file.size)}</span>
                        <span className="file-meta-tag">{fileType.toUpperCase()}</span>
                    </div>

                    <a
                        href={downloadUrl}
                        download={file.originalName}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary download-btn-large"
                    >
                        <Download size={20} /> Download File
                    </a>
                </div>
            </main>
        </div>
    );
};

export default SharePageView;
