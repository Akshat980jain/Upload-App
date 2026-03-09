import React, { useState } from 'react';
import { Share, Copy, Check, X, Lock, Calendar } from 'lucide-react';
import './ShareModal.css';

const ShareModal = ({ isOpen, onClose, fileId, fileType, fileName, token }) => {
    const [password, setPassword] = useState('');
    const [expiresInDays, setExpiresInDays] = useState('7');
    const [shareLink, setShareLink] = useState(null);
    const [copied, setCopied] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState(null);

    if (!isOpen) return null;

    const handleGenerateLink = async () => {
        setIsGenerating(true);
        setError(null);
        try {
            const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
            const res = await fetch(`${API_URL}/api/share`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    fileId,
                    fileType,
                    password: password || undefined,
                    expiresInDays: expiresInDays ? parseInt(expiresInDays) : null
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to generate link');
            }

            const data = await res.json();
            // Construct full frontend URL to the public share page (we'll need to create this page)
            const baseUrl = window.location.origin;
            setShareLink(`${baseUrl}/share/${data.token}`);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopy = () => {
        if (!shareLink) return;
        navigator.clipboard.writeText(shareLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleClose = () => {
        setShareLink(null);
        setPassword('');
        setExpiresInDays('7');
        setCopied(false);
        setError(null);
        onClose();
    };

    return (
        <div className="share-modal-overlay animate-fade-in">
            <div className="share-modal animate-slide-up">
                <div className="share-modal-header">
                    <h3><Share size={20} /> Share {fileName}</h3>
                    <button className="close-btn" onClick={handleClose}><X size={20} /></button>
                </div>

                <div className="share-modal-content">
                    {error && <div className="share-error">{error}</div>}

                    {!shareLink ? (
                        <div className="share-settings form-group">
                            <p className="share-description">
                                Anyone with the link can view this {fileType}.
                            </p>

                            <label>
                                <Lock size={16} /> Password protection (optional)
                            </label>
                            <input
                                type="text"
                                placeholder="Enter a password to secure the link"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />

                            <label>
                                <Calendar size={16} /> Link expires in
                            </label>
                            <select value={expiresInDays} onChange={(e) => setExpiresInDays(e.target.value)}>
                                <option value="1">1 Day</option>
                                <option value="7">7 Days</option>
                                <option value="30">30 Days</option>
                                <option value="">Never Expires</option>
                            </select>

                            <button
                                className="primary-btn generate-link-btn"
                                onClick={handleGenerateLink}
                                disabled={isGenerating}
                            >
                                {isGenerating ? 'Generating...' : 'Create Share Link'}
                            </button>
                        </div>
                    ) : (
                        <div className="share-result">
                            <div className="success-icon"><Check size={40} /></div>
                            <h4>Link Ready to Share!</h4>

                            <div className="link-box">
                                <input type="text" value={shareLink} readOnly />
                                <button onClick={handleCopy} className={`copy-btn ${copied ? 'copied' : ''}`} title="Copy Link">
                                    {copied ? <Check size={18} /> : <Copy size={18} />}
                                </button>
                            </div>

                            {password && <p className="password-warning">Make sure to send the password separately!</p>}

                            <button className="secondary-btn done-btn" onClick={handleClose}>
                                Done
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ShareModal;
