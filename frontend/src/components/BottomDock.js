import React from 'react';
import { Home, FolderOpen, Plus, Settings, Trash2 } from 'lucide-react';
import './BottomDock.css';

const BottomDock = ({ activeTab, onTabChange, onUploadClick }) => {
    const tabs = [
        { id: 'home', icon: Home, label: 'Home' },
        { id: 'folders', icon: FolderOpen, label: 'Folders' },
        { id: 'upload', icon: Plus, label: 'Upload', isUpload: true },
        { id: 'trash', icon: Trash2, label: 'Trash' },
        { id: 'settings', icon: Settings, label: 'Settings' },
    ];

    return (
        <div className="dock-container">
            <nav className="bottom-dock">
                {tabs.map((tab) => {
                    if (tab.isUpload) {
                        return (
                            <button
                                key={tab.id}
                                className="dock-upload-btn"
                                onClick={onUploadClick}
                                title="Upload"
                            >
                                <Plus size={24} strokeWidth={2.5} />
                                <span className="dock-label">Upload</span>
                            </button>
                        );
                    }

                    return (
                        <button
                            key={tab.id}
                            className={`dock-tab ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => onTabChange(tab.id)}
                            title={tab.label}
                        >
                            <tab.icon size={22} />
                            <span className="dock-label">{tab.label}</span>
                        </button>
                    );
                })}
            </nav>
        </div>
    );
};

export default BottomDock;
