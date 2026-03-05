import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Image, FolderOpen, Layers, Sun, Moon, Monitor, LogOut, RefreshCw, Grid, List,
  User, Camera, Lock, Mail, Edit3, Check, X, HardDrive, Trash2, Bell, Palette, Shield, ChevronRight,
  FolderPlus, Plus, ArrowLeft, MoreVertical
} from 'lucide-react';
import Header from '../components/Header';
import BottomDock from '../components/BottomDock';
import ImageGallery from '../components/ImageGallery';
import UploadModal from '../components/ImageUpload';
import ImagePreviewModal from '../components/ImagePreviewModal';
import SkeletonGrid from '../components/SkeletonCard';
import toast from 'react-hot-toast';
import './ImageUploadPage.css';

const API_URL = process.env.REACT_APP_API_URL || 'https://gallayhub.onrender.com';

// ─── Smart Category Definitions ─────────────────
const CATEGORY_GROUPS = [
  { name: 'Photos', icon: '📸', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff', 'svg'], color: '#4285f4' },
  { name: 'Videos', icon: '🎬', extensions: ['mp4', 'mov', 'avi', 'mkv', 'webm', 'wmv', 'flv'], color: '#ea4335' },
  { name: 'Documents', icon: '📝', extensions: ['pdf', 'doc', 'docx', 'txt', 'rtf'], color: '#34a853' },
  { name: 'Spreadsheets', icon: '📊', extensions: ['xls', 'xlsx', 'csv'], color: '#fbbc04' },
  { name: 'Presentations', icon: '📑', extensions: ['ppt', 'pptx'], color: '#a855f7' },
  { name: 'Archives', icon: '📦', extensions: ['zip', 'rar', '7z', 'tar', 'gz'], color: '#ec4899' },
];

const ImageUploadPage = ({ token, userInfo, onLogout, darkMode, themeMode, setThemeMode }) => {
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadMode, setUploadMode] = useState('all');
  const [previewImage, setPreviewImage] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [viewMode, setViewMode] = useState('grid');
  const [activeCategory, setActiveCategory] = useState('all');
  const [settingsSection, setSettingsSection] = useState('main');
  const [notifications, setNotifications] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(true);
  const [accentColor, setAccentColor] = useState('#4285f4');

  // Profile edit states
  const [editName, setEditName] = useState(userInfo?.name || '');
  const [editEmail, setEditEmail] = useState(userInfo?.email || '');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profilePic, setProfilePic] = useState(userInfo?.profilePicture || '');

  // Password states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  // Confirm delete all
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Folder states
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('#4285f4');
  const [renamingFolder, setRenamingFolder] = useState(null);
  const [renameFolderName, setRenameFolderName] = useState('');
  const [folderMenuId, setFolderMenuId] = useState(null);

  const profilePicRef = useRef(null);
  const folderMenuRef = useRef(null);
  const navigate = useNavigate();

  // ─── Data Fetching ─────────────────────────────
  const fetchImages = useCallback(async () => {
    if (!token) return [];
    const response = await fetch(`${API_URL}/api/images`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      if (response.status === 401) { navigate('/'); return []; }
      throw new Error('Failed to fetch images');
    }
    return response.json();
  }, [token, navigate]);

  const fetchVideos = useCallback(async () => {
    if (!token) return [];
    const response = await fetch(`${API_URL}/api/videos`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) return [];
    return response.json();
  }, [token]);

  const fetchDocuments = useCallback(async () => {
    if (!token) return [];
    const response = await fetch(`${API_URL}/api/documents`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) return [];
    return response.json();
  }, [token]);

  const fetchAllMedia = useCallback(async () => {
    if (!token) { navigate('/'); return; }
    try {
      setLoading(true);
      const [imgData, vidData, docData] = await Promise.all([
        fetchImages(),
        fetchVideos(),
        fetchDocuments(),
      ]);
      setImages(Array.isArray(imgData) ? imgData : []);
      setVideos(Array.isArray(vidData) ? vidData : []);
      setDocuments(Array.isArray(docData) ? docData : []);
    } catch (err) {
      console.error('Error:', err);
      toast.error('Failed to load files');
    } finally {
      setLoading(false);
    }
  }, [token, navigate, fetchImages, fetchVideos, fetchDocuments]);

  useEffect(() => { fetchAllMedia(); }, [fetchAllMedia]);

  // ─── Folder Fetching ───────────────────────────
  const fetchFolders = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/folders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setFolders(data);
      }
    } catch (err) {
      console.error('Error fetching folders:', err);
    }
  }, [token]);

  useEffect(() => { fetchFolders(); }, [fetchFolders]);

  // Close folder context menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (folderMenuRef.current && !folderMenuRef.current.contains(e.target)) {
        setFolderMenuId(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Fetch profile on mount
  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/api/users/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        if (data.profilePicture) setProfilePic(data.profilePicture);
        setEditName(data.name || '');
        setEditEmail(data.email || '');
      })
      .catch(() => { });
  }, [token]);

  // ─── Unified Media ─────────────────────────────
  const allMedia = [
    ...images.map(img => ({ ...img, mediaType: 'image' })),
    ...videos.map(vid => ({ ...vid, mediaType: 'video' })),
    ...documents.map(doc => ({ ...doc, mediaType: 'document' })),
  ].sort((a, b) => new Date(b.uploadDate || b.createdAt) - new Date(a.uploadDate || a.createdAt));

  const categoryFiltered = activeCategory === 'all'
    ? allMedia
    : allMedia.filter(item => {
      if (activeCategory === 'images') return item.mediaType === 'image';
      if (activeCategory === 'videos') return item.mediaType === 'video';
      if (activeCategory === 'documents') return item.mediaType === 'document';
      return true;
    });

  const filteredMedia = categoryFiltered.filter((item) =>
    item.originalName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ─── Callbacks ──────────────────────────────────
  const handleImageUpload = (newImage) => {
    setImages((prev) => [newImage, ...prev]);
  };

  const handleVideoUpload = (newVideo) => {
    setVideos((prev) => [newVideo, ...prev]);
  };

  const handleDocumentUpload = (newDoc) => {
    setDocuments((prev) => [newDoc, ...prev]);
  };

  const handleMediaDelete = (deletedId) => {
    setImages((prev) => prev.filter((img) => img._id !== deletedId));
    setVideos((prev) => prev.filter((vid) => vid._id !== deletedId));
    setDocuments((prev) => prev.filter((doc) => doc._id !== deletedId));
    toast.success('File deleted');
  };

  // ─── Stats ──────────────────────────────────────
  const totalSize = allMedia.reduce((sum, item) => sum + (item.size || 0), 0);
  const formatStorage = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  };

  // ─── Smart Categories ───────────────────────────
  const getSmartCategories = () => {
    return CATEGORY_GROUPS.map(cat => {
      const matching = allMedia.filter(item => {
        const ext = (item.originalName || '').split('.').pop()?.toLowerCase();
        return cat.extensions.includes(ext);
      });
      return { ...cat, count: matching.length, size: matching.reduce((s, i) => s + (i.size || 0), 0) };
    }).filter(cat => cat.count > 0);
  };

  // ─── Folder Handlers ────────────────────────────
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return toast.error('Enter a folder name');
    try {
      const res = await fetch(`${API_URL}/api/folders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newFolderName.trim(), color: newFolderColor }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message);
      }
      const folder = await res.json();
      setFolders(prev => [folder, ...prev]);
      setShowCreateFolder(false);
      setNewFolderName('');
      setNewFolderColor('#4285f4');
      toast.success(`Folder "${folder.name}" created`);
    } catch (err) {
      toast.error(err.message || 'Failed to create folder');
    }
  };

  const handleRenameFolder = async (folderId) => {
    if (!renameFolderName.trim()) return;
    try {
      const res = await fetch(`${API_URL}/api/folders/${folderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: renameFolderName.trim() }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message);
      }
      setFolders(prev => prev.map(f => f._id === folderId ? { ...f, name: renameFolderName.trim() } : f));
      setRenamingFolder(null);
      toast.success('Folder renamed');
    } catch (err) {
      toast.error(err.message || 'Failed to rename');
    }
  };

  const handleDeleteFolder = async (folderId) => {
    try {
      const res = await fetch(`${API_URL}/api/folders/${folderId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete');
      setFolders(prev => prev.filter(f => f._id !== folderId));
      if (selectedFolder?._id === folderId) setSelectedFolder(null);
      fetchAllMedia();
      toast.success('Folder deleted');
    } catch (err) {
      toast.error(err.message || 'Failed to delete folder');
    }
  };

  const handleMoveToFolder = async (folderId, fileId, fileType) => {
    try {
      const res = await fetch(`${API_URL}/api/folders/${folderId}/move`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ fileIds: [fileId], fileType }),
      });
      if (!res.ok) throw new Error('Failed to move');
      // Update local state
      const updateFn = (item) => item._id === fileId ? { ...item, folder: folderId } : item;
      setImages(prev => prev.map(updateFn));
      setVideos(prev => prev.map(updateFn));
      setDocuments(prev => prev.map(updateFn));
      fetchFolders();
      toast.success('File moved to folder');
    } catch (err) {
      toast.error(err.message || 'Failed to move file');
    }
  };

  const handleRemoveFromFolder = async (fileId, fileType) => {
    try {
      const res = await fetch(`${API_URL}/api/folders/remove-files`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ fileIds: [fileId], fileType }),
      });
      if (!res.ok) throw new Error('Failed to remove');
      const updateFn = (item) => item._id === fileId ? { ...item, folder: null } : item;
      setImages(prev => prev.map(updateFn));
      setVideos(prev => prev.map(updateFn));
      setDocuments(prev => prev.map(updateFn));
      fetchFolders();
      toast.success('File removed from folder');
    } catch (err) {
      toast.error(err.message || 'Failed to remove file');
    }
  };

  // Files in the selected folder
  const folderFiles = selectedFolder
    ? allMedia.filter(item => item.folder === selectedFolder._id)
    : [];

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'settings') setSettingsSection('main');
    if (tab !== 'folders') setSelectedFolder(null);
  };

  const openUpload = (mode = 'all') => {
    setUploadMode(mode);
    setShowUploadModal(true);
  };

  // ─── Profile Save ───
  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const res = await fetch(`${API_URL}/api/users/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: editName, email: editEmail }),
      });
      if (!res.ok) throw new Error('Failed to update');
      const data = await res.json();
      const stored = JSON.parse(localStorage.getItem('userInfo'));
      stored.name = data.name;
      stored.email = data.email;
      localStorage.setItem('userInfo', JSON.stringify(stored));
      toast.success('Profile updated!');
      setIsEditingProfile(false);
    } catch (err) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  // ─── Password Change ───
  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) return toast.error('Fill in all fields');
    if (newPassword.length < 6) return toast.error('Password must be at least 6 characters');
    if (newPassword !== confirmNewPassword) return toast.error('Passwords do not match');
    setSavingPassword(true);
    try {
      const res = await fetch(`${API_URL}/api/users/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to change password');
      }
      toast.success('Password changed!');
      setCurrentPassword(''); setNewPassword(''); setConfirmNewPassword('');
      setSettingsSection('main');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingPassword(false);
    }
  };

  // ─── Profile Picture ───
  const handleProfilePicUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('profilePicture', file);
    try {
      const res = await fetch(`${API_URL}/api/users/profile/picture`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      setProfilePic(data.profilePicture);
      toast.success('Profile picture updated!');
    } catch (err) {
      toast.error('Failed to upload');
    }
  };

  // ─── Delete All ───
  const handleDeleteAll = async () => {
    try {
      const allDeletes = [
        ...images.map(img => fetch(`${API_URL}/api/images/${img._id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })),
        ...videos.map(vid => fetch(`${API_URL}/api/videos/${vid._id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })),
        ...documents.map(doc => fetch(`${API_URL}/api/documents/${doc._id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })),
      ];
      await Promise.all(allDeletes);
      setImages([]); setVideos([]); setDocuments([]);
      setShowDeleteConfirm(false);
      toast.success('All files deleted');
    } catch (err) {
      toast.error('Failed to delete some files');
    }
  };

  const profilePicUrl = profilePic ? `${API_URL}/uploads/${profilePic}` : null;



  // ─── Tab Render ───
  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <>
            <div className="dashboard-header">
              <div>
                <h1 className="dashboard-title">My Gallery</h1>
                <p className="dashboard-subtitle">
                  {filteredMedia.length} file{filteredMedia.length !== 1 ? 's' : ''}
                  {searchQuery && ` matching "${searchQuery}"`}
                  {activeCategory !== 'all' && ` in ${activeCategory}`}
                </p>
              </div>
              <div className="header-actions-right">
                <div className="view-toggle">
                  <button className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')} title="Grid view">
                    <Grid size={18} />
                  </button>
                  <button className={`view-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')} title="List view">
                    <List size={18} />
                  </button>
                </div>
                <button className="refresh-btn" onClick={fetchAllMedia} title="Refresh">
                  <RefreshCw size={18} />
                </button>
              </div>
            </div>

            {/* ─── Stat Cards ─── */}
            <div className="stat-cards">
              <div className="stat-card">
                <div className="stat-icon" style={{ background: 'rgba(66,133,244,0.12)' }}>📁</div>
                <div>
                  <div className="stat-value">{allMedia.length}</div>
                  <div className="stat-label">Total Files</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon" style={{ background: 'rgba(52,168,83,0.12)' }}>💾</div>
                <div>
                  <div className="stat-value">{formatStorage(totalSize)}</div>
                  <div className="stat-label">Storage Used</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon" style={{ background: 'rgba(66,133,244,0.12)' }}>📷</div>
                <div>
                  <div className="stat-value">{images.length}</div>
                  <div className="stat-label">Images</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon" style={{ background: 'rgba(234,67,53,0.12)' }}>🎥</div>
                <div>
                  <div className="stat-value">{videos.length}</div>
                  <div className="stat-label">Videos</div>
                </div>
              </div>
            </div>

            {/* ─── Quick Folders ─── */}
            {folders.length > 0 && (
              <div className="quick-folders-section">
                <div className="quick-folders-header">
                  <h3>Your Folders</h3>
                  <button onClick={() => setActiveTab('folders')}>View all &rarr;</button>
                </div>
                <div className="quick-folders-scroll">
                  {folders.map(folder => (
                    <button key={folder._id} className="quick-folder-card" onClick={() => { setSelectedFolder(folder); setActiveTab('folders'); }}>
                      <div className="quick-folder-icon" style={{ background: `${folder.color}1a` }}>
                        <span>📁</span>
                      </div>
                      <div className="quick-folder-info">
                        <span className="quick-folder-name">{folder.name}</span>
                        <span className="quick-folder-meta">
                          {folder.fileCount} file{folder.fileCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ─── Category Filter Tabs ─── */}
            <div className="category-tabs">
              {[
                { key: 'all', label: 'All', count: allMedia.length },
                { key: 'images', label: '📷 Images', count: images.length },
                { key: 'videos', label: '🎥 Videos', count: videos.length },
                { key: 'documents', label: '📄 Documents', count: documents.length },
              ].map(cat => (
                <button
                  key={cat.key}
                  className={`category-tab ${activeCategory === cat.key ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat.key)}
                >
                  {cat.label}
                  <span className="category-count">{cat.count}</span>
                </button>
              ))}
            </div>

            {/* ─── Quick Actions (when few files) ─── */}
            {allMedia.length < 5 && (
              <div className="quick-actions">
                <button className="quick-action-card" onClick={() => openUpload('images')}>
                  <span className="quick-action-icon">📷</span>
                  <span className="quick-action-label">Upload Images</span>
                </button>
                <button className="quick-action-card" onClick={() => openUpload('videos')}>
                  <span className="quick-action-icon">🎥</span>
                  <span className="quick-action-label">Upload Videos</span>
                </button>
                <button className="quick-action-card" onClick={() => openUpload('documents')}>
                  <span className="quick-action-icon">📄</span>
                  <span className="quick-action-label">Upload Documents</span>
                </button>
              </div>
            )}

            {/* ─── Gallery ─── */}
            <section className="dashboard-content">
              {loading ? (
                <SkeletonGrid count={8} />
              ) : filteredMedia.length === 0 && allMedia.length === 0 ? (
                <div className="empty-state-hero">
                  <div className="empty-state-illustration">📂</div>
                  <h2 className="empty-state-title">Your gallery is empty</h2>
                  <p className="empty-state-subtitle">Start uploading images, videos, and documents to see them here</p>
                  <div className="quick-actions" style={{ width: '100%', maxWidth: 600 }}>
                    <button className="quick-action-card" onClick={() => openUpload('images')}>
                      <span className="quick-action-icon">📷</span>
                      <span className="quick-action-label">Upload Images</span>
                    </button>
                    <button className="quick-action-card" onClick={() => openUpload('videos')}>
                      <span className="quick-action-icon">🎥</span>
                      <span className="quick-action-label">Upload Videos</span>
                    </button>
                    <button className="quick-action-card" onClick={() => openUpload('documents')}>
                      <span className="quick-action-icon">📄</span>
                      <span className="quick-action-label">Upload Documents</span>
                    </button>
                  </div>
                </div>
              ) : (
                <ImageGallery images={filteredMedia} onImageDelete={handleMediaDelete} onRefresh={fetchAllMedia} token={token} onPreview={setPreviewImage} viewMode={viewMode} />
              )}
            </section>

          </>
        );

      case 'folders':
        // ─── Folder Detail View ───
        if (selectedFolder) {
          return (
            <div className="tab-content animate-fade-in">
              <div className="dashboard-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button className="back-link" onClick={() => setSelectedFolder(null)}><ArrowLeft size={16} /> Back</button>
                  <div>
                    <h1 className="dashboard-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span className="folder-title-dot" style={{ background: selectedFolder.color }}></span>
                      {selectedFolder.name}
                    </h1>
                    <p className="dashboard-subtitle">{folderFiles.length} file{folderFiles.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <button className="btn-primary" onClick={() => openUpload('all')} style={{ gap: '6px' }}>
                  <Plus size={16} /> Upload Here
                </button>
              </div>
              {folderFiles.length === 0 ? (
                <div className="empty-tab">
                  <FolderOpen size={48} />
                  <h3>This folder is empty</h3>
                  <p>Upload files directly or move them here from the preview modal</p>
                  <button className="btn-primary" onClick={() => openUpload('all')} style={{ marginTop: '16px' }}>
                    <Plus size={16} /> Upload Files
                  </button>
                </div>
              ) : (
                <ImageGallery images={folderFiles} onImageDelete={handleMediaDelete} onRefresh={() => { fetchAllMedia(); fetchFolders(); }} token={token} onPreview={setPreviewImage} viewMode={viewMode} />
              )}
            </div>
          );
        }

        // ─── Folder List View ───
        return (
          <div className="tab-content animate-fade-in">
            <div className="dashboard-header">
              <div>
                <h1 className="dashboard-title">Folders</h1>
                <p className="dashboard-subtitle">Organize your files into folders</p>
              </div>
              <button className="btn-primary" onClick={() => setShowCreateFolder(true)} style={{ gap: '6px' }}>
                <Plus size={16} /> New Folder
              </button>
            </div>

            {/* Create Folder Modal */}
            {showCreateFolder && (
              <div className="create-folder-card animate-fade-in">
                <div className="create-folder-header">
                  <FolderPlus size={20} />
                  <span>Create New Folder</span>
                </div>
                <input
                  type="text"
                  placeholder="Folder name"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="create-folder-input"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                />
                <div className="create-folder-colors">
                  {['#4285f4', '#ea4335', '#34a853', '#fbbc04', '#a855f7', '#ec4899', '#14b8a6', '#f97316'].map(c => (
                    <button
                      key={c}
                      className={`folder-color-dot ${newFolderColor === c ? 'active' : ''}`}
                      style={{ background: c }}
                      onClick={() => setNewFolderColor(c)}
                    />
                  ))}
                </div>
                <div className="create-folder-actions">
                  <button className="btn-primary" onClick={handleCreateFolder}>Create</button>
                  <button className="btn-ghost" onClick={() => { setShowCreateFolder(false); setNewFolderName(''); }}>Cancel</button>
                </div>
              </div>
            )}

            {folders.length === 0 && !showCreateFolder ? (
              <div className="empty-tab">
                <FolderOpen size={48} />
                <h3>No folders yet</h3>
                <p>Create a folder to organize your files</p>
                <button className="btn-primary" onClick={() => setShowCreateFolder(true)} style={{ marginTop: '16px' }}>
                  <FolderPlus size={16} /> Create Folder
                </button>
              </div>
            ) : (
              <div className="media-folder-grid">
                {folders.map((folder) => (
                  <div key={folder._id} className="media-folder-card-wrapper">
                    {renamingFolder === folder._id ? (
                      <div className="media-folder-card rename-mode">
                        <div className="media-folder-icon" style={{ background: `${folder.color}1a` }}>
                          <span style={{ fontSize: '24px' }}>📁</span>
                        </div>
                        <div className="media-folder-info" style={{ flex: 1 }}>
                          <input
                            type="text"
                            value={renameFolderName}
                            onChange={(e) => setRenameFolderName(e.target.value)}
                            className="rename-folder-input"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleRenameFolder(folder._id);
                              if (e.key === 'Escape') setRenamingFolder(null);
                            }}
                          />
                          <div className="rename-folder-actions">
                            <button className="btn-sm-primary" onClick={() => handleRenameFolder(folder._id)}><Check size={14} /></button>
                            <button className="btn-sm-ghost" onClick={() => setRenamingFolder(null)}><X size={14} /></button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <button className="media-folder-card" onClick={() => setSelectedFolder(folder)}>
                        <div className="media-folder-icon" style={{ background: `${folder.color}1a` }}>
                          <span style={{ fontSize: '24px' }}>📁</span>
                        </div>
                        <div className="media-folder-info">
                          <p className="media-folder-name">{folder.name}</p>
                          <p className="media-folder-meta">
                            {folder.fileCount} file{folder.fileCount !== 1 ? 's' : ''}
                            {folder.imageCount > 0 && ` · ${folder.imageCount} 📷`}
                            {folder.videoCount > 0 && ` · ${folder.videoCount} 🎥`}
                            {folder.docCount > 0 && ` · ${folder.docCount} 📄`}
                          </p>
                        </div>
                        <ChevronRight size={18} style={{ color: 'var(--text-tertiary)' }} />
                      </button>
                    )}
                    {/* Context menu button */}
                    {renamingFolder !== folder._id && (
                      <div className="folder-menu-wrapper" ref={folderMenuId === folder._id ? folderMenuRef : null}>
                        <button className="folder-menu-btn" onClick={(e) => { e.stopPropagation(); setFolderMenuId(folderMenuId === folder._id ? null : folder._id); }}>
                          <MoreVertical size={16} />
                        </button>
                        {folderMenuId === folder._id && (
                          <div className="folder-context-menu animate-slide-down">
                            <button onClick={() => { setRenamingFolder(folder._id); setRenameFolderName(folder.name); setFolderMenuId(null); }}>
                              <Edit3 size={14} /> Rename
                            </button>
                            <button className="danger" onClick={() => { handleDeleteFolder(folder._id); setFolderMenuId(null); }}>
                              <Trash2 size={14} /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'tags':
        const smartCategories = getSmartCategories();
        return (
          <div className="tab-content animate-fade-in">
            <div className="dashboard-header">
              <div>
                <h1 className="dashboard-title">Categories</h1>
                <p className="dashboard-subtitle">Browse by file type</p>
              </div>
            </div>
            {smartCategories.length === 0 ? (
              <div className="empty-tab"><Layers size={48} /><h3>No categories yet</h3><p>Upload files to see them categorized here</p></div>
            ) : (
              <div className="category-grid">
                {smartCategories.map((cat) => (
                  <button key={cat.name} className="category-card" onClick={() => {
                    // Filter home by these extensions
                    setSearchQuery('.' + cat.extensions[0]);
                    setActiveCategory('all');
                    setActiveTab('home');
                    toast.success(`Showing ${cat.name}`);
                  }}>
                    <div className="category-card-icon" style={{ background: `${cat.color}1a` }}>
                      <span>{cat.icon}</span>
                    </div>
                    <div className="category-card-info">
                      <p className="category-card-name">{cat.name}</p>
                      <p className="category-card-meta">{cat.count} file{cat.count !== 1 ? 's' : ''} · {formatStorage(cat.size)}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        );

      case 'settings':
        // ─── Profile Sub-page ───
        if (settingsSection === 'profile') {
          return (
            <div className="tab-content animate-fade-in">
              <div className="dashboard-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button className="back-link" onClick={() => setSettingsSection('main')}>← Back</button>
                  <div>
                    <h1 className="dashboard-title">Profile</h1>
                    <p className="dashboard-subtitle">Manage your account</p>
                  </div>
                </div>
              </div>
              <div className="profile-card">
                <div className="profile-avatar-section">
                  <div className="profile-avatar-large" onClick={() => profilePicRef.current?.click()}>
                    {profilePicUrl ? (
                      <img src={profilePicUrl} alt="Profile" className="profile-avatar-img" />
                    ) : (
                      <span>{editName?.charAt(0)?.toUpperCase() || 'U'}</span>
                    )}
                    <div className="avatar-overlay"><Camera size={20} /></div>
                  </div>
                  <input ref={profilePicRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleProfilePicUpload} />
                  <p className="avatar-hint">Click to change photo</p>
                </div>
                <div className="profile-fields">
                  <div className="profile-field">
                    <label><User size={14} /> Full Name</label>
                    {isEditingProfile ? (
                      <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="profile-input" />
                    ) : (
                      <p className="profile-value">{editName}</p>
                    )}
                  </div>
                  <div className="profile-field">
                    <label><Mail size={14} /> Email</label>
                    {isEditingProfile ? (
                      <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="profile-input" />
                    ) : (
                      <p className="profile-value">{editEmail}</p>
                    )}
                  </div>
                  <div className="profile-field">
                    <label><HardDrive size={14} /> Storage Used</label>
                    <p className="profile-value">{formatStorage(totalSize)} across {allMedia.length} files</p>
                  </div>
                </div>
                <div className="profile-actions">
                  {isEditingProfile ? (
                    <>
                      <button className="btn-primary" onClick={handleSaveProfile} disabled={savingProfile}>
                        {savingProfile ? 'Saving...' : <><Check size={16} /> Save Changes</>}
                      </button>
                      <button className="btn-ghost" onClick={() => { setIsEditingProfile(false); setEditName(userInfo?.name || ''); setEditEmail(userInfo?.email || ''); }}>
                        <X size={16} /> Cancel
                      </button>
                    </>
                  ) : (
                    <button className="btn-secondary" onClick={() => setIsEditingProfile(true)}>
                      <Edit3 size={16} /> Edit Profile
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        }

        // ─── Change Password Sub-page ───
        if (settingsSection === 'password') {
          return (
            <div className="tab-content animate-fade-in">
              <div className="dashboard-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button className="back-link" onClick={() => setSettingsSection('main')}>← Back</button>
                  <div>
                    <h1 className="dashboard-title">Change Password</h1>
                    <p className="dashboard-subtitle">Update your account password</p>
                  </div>
                </div>
              </div>
              <div className="settings-form-card">
                <div className="form-group">
                  <label>Current Password</label>
                  <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Enter current password" />
                </div>
                <div className="form-group">
                  <label>New Password</label>
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 6 characters" />
                </div>
                <div className="form-group">
                  <label>Confirm New Password</label>
                  <input type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} placeholder="Confirm new password" />
                </div>
                <div className="profile-actions">
                  <button className="btn-primary" onClick={handleChangePassword} disabled={savingPassword}>
                    {savingPassword ? 'Changing...' : <><Lock size={16} /> Update Password</>}
                  </button>
                  <button className="btn-ghost" onClick={() => setSettingsSection('main')}>Cancel</button>
                </div>
              </div>
            </div>
          );
        }

        // ─── Settings Main ───
        return (
          <div className="tab-content animate-fade-in">
            <div className="dashboard-header">
              <div>
                <h1 className="dashboard-title">Settings</h1>
                <p className="dashboard-subtitle">Customize your experience</p>
              </div>
            </div>
            <div className="settings-list">
              <p className="settings-section-title">Account</p>
              <button className="settings-item clickable" onClick={() => setSettingsSection('profile')}>
                <div className="settings-item-info">
                  <div className="settings-avatar">
                    {profilePicUrl ? <img src={profilePicUrl} alt="" className="settings-avatar-img" /> : userInfo?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <p className="settings-label">{userInfo?.name || 'User'}</p>
                    <p className="settings-desc">{userInfo?.email || ''}</p>
                  </div>
                </div>
                <ChevronRight size={18} className="settings-chevron" />
              </button>
              <button className="settings-item clickable" onClick={() => setSettingsSection('password')}>
                <div className="settings-item-info">
                  <Lock size={20} />
                  <div>
                    <p className="settings-label">Change Password</p>
                    <p className="settings-desc">Update your account password</p>
                  </div>
                </div>
                <ChevronRight size={18} className="settings-chevron" />
              </button>

              <p className="settings-section-title">Appearance</p>
              <div className="settings-item">
                <div className="settings-item-info">
                  {themeMode === 'system' ? <Monitor size={20} /> : themeMode === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                  <div>
                    <p className="settings-label">Theme</p>
                    <p className="settings-desc">Choose system, light, or dark theme</p>
                  </div>
                </div>
                <div className="theme-selector">
                  <button className={`theme-btn ${themeMode === 'system' ? 'active' : ''}`} onClick={() => { setThemeMode('system'); toast.success('System theme'); }} title="System">
                    <Monitor size={16} />
                  </button>
                  <button className={`theme-btn ${themeMode === 'light' ? 'active' : ''}`} onClick={() => { setThemeMode('light'); toast.success('Light mode'); }} title="Light">
                    <Sun size={16} />
                  </button>
                  <button className={`theme-btn ${themeMode === 'dark' ? 'active' : ''}`} onClick={() => { setThemeMode('dark'); toast.success('Dark mode'); }} title="Dark">
                    <Moon size={16} />
                  </button>
                </div>
              </div>
              <div className="settings-item">
                <div className="settings-item-info">
                  <Grid size={20} />
                  <div>
                    <p className="settings-label">Default View</p>
                    <p className="settings-desc">Choose grid or list layout</p>
                  </div>
                </div>
                <div className="view-toggle">
                  <button className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}><Grid size={16} /></button>
                  <button className={`view-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}><List size={16} /></button>
                </div>
              </div>
              <div className="settings-item">
                <div className="settings-item-info">
                  <Palette size={20} />
                  <div>
                    <p className="settings-label">Accent Color</p>
                    <p className="settings-desc">Personalize the app highlight color</p>
                  </div>
                </div>
                <div className="accent-colors">
                  {['#4285f4', '#a855f7', '#ec4899', '#34a853', '#fbbc04', '#ea4335'].map((color) => (
                    <button
                      key={color}
                      className={`accent-dot ${accentColor === color ? 'active' : ''}`}
                      style={{ background: color }}
                      onClick={() => { setAccentColor(color); document.documentElement.style.setProperty('--primary', color); toast.success('Accent color updated'); }}
                    />
                  ))}
                </div>
              </div>

              <p className="settings-section-title">Preferences</p>
              <div className="settings-item">
                <div className="settings-item-info">
                  <Bell size={20} />
                  <div>
                    <p className="settings-label">Notifications</p>
                    <p className="settings-desc">Show toast notifications for actions</p>
                  </div>
                </div>
                <button className={`toggle-switch ${notifications ? 'active' : ''}`} onClick={() => { setNotifications(!notifications); toast.success(notifications ? 'Notifications off' : 'Notifications on'); }}>
                  <div className="toggle-knob" />
                </button>
              </div>
              <div className="settings-item">
                <div className="settings-item-info">
                  <Shield size={20} />
                  <div>
                    <p className="settings-label">Confirm Before Delete</p>
                    <p className="settings-desc">Ask for confirmation before deleting files</p>
                  </div>
                </div>
                <button className={`toggle-switch ${confirmDelete ? 'active' : ''}`} onClick={() => { setConfirmDelete(!confirmDelete); toast.success(confirmDelete ? 'Quick delete enabled' : 'Delete confirmation enabled'); }}>
                  <div className="toggle-knob" />
                </button>
              </div>

              <p className="settings-section-title">Storage</p>
              <div className="settings-item">
                <div className="settings-item-info">
                  <HardDrive size={20} />
                  <div>
                    <p className="settings-label">Storage Used</p>
                    <p className="settings-desc">{formatStorage(totalSize)} across {allMedia.length} files</p>
                  </div>
                </div>
                <span className="settings-badge">{allMedia.length}</span>
              </div>
              <div className="settings-item">
                <div className="settings-item-info">
                  <Image size={20} />
                  <div>
                    <p className="settings-label">File Types</p>
                    <p className="settings-desc">
                      {images.length} images · {videos.length} videos · {documents.length} documents
                    </p>
                  </div>
                </div>
              </div>

              <p className="settings-section-title danger-title">Danger Zone</p>
              {!showDeleteConfirm ? (
                <button className="settings-item settings-danger-item" onClick={() => setShowDeleteConfirm(true)}>
                  <div className="settings-item-info">
                    <Trash2 size={20} />
                    <div>
                      <p className="settings-label">Delete All Files</p>
                      <p className="settings-desc">Permanently remove all {allMedia.length} files</p>
                    </div>
                  </div>
                </button>
              ) : (
                <div className="settings-item danger-confirm">
                  <p>Are you sure? This cannot be undone.</p>
                  <div className="danger-actions">
                    <button className="btn-danger" onClick={handleDeleteAll}>Yes, Delete All</button>
                    <button className="btn-ghost" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
                  </div>
                </div>
              )}

              <button className="settings-item settings-logout" onClick={() => { onLogout(); navigate('/'); }}>
                <div className="settings-item-info">
                  <LogOut size={20} />
                  <div>
                    <p className="settings-label">Sign Out</p>
                    <p className="settings-desc">Log out of your account</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="dashboard">
      <Header userInfo={userInfo} onLogout={() => { onLogout(); navigate('/'); }} darkMode={darkMode} themeMode={themeMode} setThemeMode={setThemeMode} searchQuery={searchQuery} onSearchChange={setSearchQuery} profilePicture={profilePic} onProfileClick={() => { setActiveTab('settings'); setSettingsSection('profile'); }} onSettingsClick={() => { setActiveTab('settings'); setSettingsSection('main'); }} />
      <main className="dashboard-main">{renderContent()}</main>
      <BottomDock activeTab={activeTab} onTabChange={handleTabChange} onUploadClick={() => openUpload('all')} />
      <UploadModal
        isOpen={showUploadModal}
        onClose={() => { setShowUploadModal(false); if (selectedFolder) { fetchAllMedia(); fetchFolders(); } }}
        onImageUpload={handleImageUpload}
        onVideoUpload={handleVideoUpload}
        onDocumentUpload={handleDocumentUpload}
        token={token}
        uploadMode={uploadMode}
        folderId={selectedFolder?._id || null}
        folderName={selectedFolder?.name || null}
      />
      {previewImage && (
        <ImagePreviewModal image={previewImage} images={filteredMedia} onClose={() => setPreviewImage(null)} onDelete={handleMediaDelete} onNavigate={setPreviewImage} folders={folders} onMoveToFolder={handleMoveToFolder} onRemoveFromFolder={handleRemoveFromFolder} />
      )}
    </div>
  );
};

export default ImageUploadPage;