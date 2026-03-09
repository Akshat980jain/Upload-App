import React from 'react';
import './ConfirmModal.css';

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = 'OK', cancelText = 'Cancel' }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay animate-fade-in" style={{ zIndex: 9999 }}>
            <div className="modal-content animate-slide-up" style={{ maxWidth: '400px', padding: '24px' }}>
                <h2 className="modal-title" style={{ fontSize: '1.2rem', marginBottom: '12px' }}>{title}</h2>
                <p className="modal-description" style={{ marginBottom: '24px', color: 'var(--text-secondary)' }}>{message}</p>
                <div className="modal-actions" style={{ justifyContent: 'flex-end', gap: '12px' }}>
                    <button className="btn-secondary" onClick={onCancel}>
                        {cancelText}
                    </button>
                    <button className="btn-primary danger" onClick={onConfirm} style={{ background: '#10b981', borderColor: '#10b981' }}>
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
