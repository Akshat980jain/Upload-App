import React, { useState, useEffect } from 'react';
import { Share2, X, Plus, Trash2, Shield } from 'lucide-react';
import ConfirmModal from './ConfirmModal';
import './ShareFolderModal.css';

const ShareFolderModal = ({ isOpen, onClose, folderId, folderName, token, onRefresh }) => {
    const [email, setEmail] = useState('');
    const [permission, setPermission] = useState('view');
    const [collaborators, setCollaborators] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [confirmRemoveCollaborator, setConfirmRemoveCollaborator] = useState(null);

    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

    useEffect(() => {
        if (isOpen && folderId) {
            fetchFolderDetails();
        }
    }, [isOpen, folderId]);

    const fetchFolderDetails = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/folders/${folderId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setCollaborators(data.sharedWith || []);
            }
        } catch (err) {
            console.error('Error fetching folder shares:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleShare = async (e) => {
        e.preventDefault();
        if (!email) return;
        setError(null);
        setIsLoading(true);

        try {
            const res = await fetch(`${API_URL}/api/folders/${folderId}/share`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ email, permission })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to share folder');
            }

            setEmail('');
            fetchFolderDetails();
            if (onRefresh) onRefresh();
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemoveCollaborator = async (collaborator) => {
        setConfirmRemoveCollaborator(collaborator);
    };

    const executeRemoveCollaborator = async (collaborator) => {
        setConfirmRemoveCollaborator(null);
        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/folders/${folderId}/share/${collaborator.user?._id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to remove collaborator');
            fetchFolderDetails();
            if (onRefresh) onRefresh();
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="share-modal-overlay animate-fade-in">
            <div className="share-modal animate-slide-up">
                <div className="share-modal-header">
                    <h3><Share2 size={20} /> Share "{folderName}"</h3>
                    <button className="close-btn" onClick={onClose}><X size={20} /></button>
                </div>

                <div className="share-modal-content">
                    {error && <div className="share-error">{error}</div>}

                    <form onSubmit={handleShare} className="share-form form-group">
                        <label>Invite people</label>
                        <div className="share-input-group">
                            <input
                                type="email"
                                placeholder="Enter email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={isLoading}
                                required
                            />
                            <select
                                value={permission}
                                onChange={(e) => setPermission(e.target.value)}
                                disabled={isLoading}
                                className="permission-select"
                            >
                                <option value="view">Viewer</option>
                                <option value="edit">Editor</option>
                            </select>
                            <button
                                type="submit"
                                className="btn-primary"
                                disabled={isLoading || !email}
                            >
                                {isLoading ? '...' : <Plus size={18} />}
                            </button>
                        </div>
                    </form>

                    <div className="collaborators-list">
                        <h4>People with access</h4>

                        <div className="collaborator-item owner">
                            <div className="collab-avatar owner-avatar"><Shield size={16} /></div>
                            <div className="collab-info">
                                <span className="collab-name">You</span>
                                <span className="collab-role">Owner</span>
                            </div>
                        </div>

                        {collaborators.map(c => (
                            <div key={c.user?._id || c._id} className="collaborator-item">
                                <div className="collab-avatar">
                                    {c.user?.name?.charAt(0).toUpperCase() || 'U'}
                                </div>
                                <div className="collab-info">
                                    <span className="collab-name">{c.user?.name || c.user?.email || 'Unknown User'}</span>
                                    <span className="collab-email">{c.user?.email}</span>
                                </div>
                                <div className="collab-actions">
                                    <span className="collab-role badge">{c.permission}</span>
                                    <button
                                        className="remove-collab-btn"
                                        onClick={() => handleRemoveCollaborator(c)}
                                        title="Remove access"
                                        disabled={isLoading}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}

                        {collaborators.length === 0 && (
                            <div className="empty-collaborators">
                                <p>This folder is only visible to you.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <ConfirmModal
                isOpen={!!confirmRemoveCollaborator}
                title="Remove Collaborator"
                message={`Are you sure you want to remove ${confirmRemoveCollaborator?.user?.name || confirmRemoveCollaborator?.user?.email} from this folder?`}
                confirmText="Remove"
                onCancel={() => setConfirmRemoveCollaborator(null)}
                onConfirm={() => executeRemoveCollaborator(confirmRemoveCollaborator)}
            />
        </div>
    );
};

ShareFolderModal.ShareIcon = Share2;
export default ShareFolderModal;
