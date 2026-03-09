import React, { useState, useRef, useCallback, useEffect } from 'react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { X, RotateCw, Crop, SlidersHorizontal, Save, Undo2, FlipHorizontal, FlipVertical } from 'lucide-react';
import './ImageEditor.css';

const API_URL = process.env.REACT_APP_API_URL ?? 'https://galleryhub.onrender.com';

const FILTER_PRESETS = [
    { name: 'None', values: { brightness: 100, contrast: 100, saturate: 100, grayscale: 0, sepia: 0, blur: 0 } },
    { name: 'Vivid', values: { brightness: 110, contrast: 120, saturate: 140, grayscale: 0, sepia: 0, blur: 0 } },
    { name: 'Warm', values: { brightness: 105, contrast: 100, saturate: 110, grayscale: 0, sepia: 20, blur: 0 } },
    { name: 'Cool', values: { brightness: 100, contrast: 110, saturate: 80, grayscale: 0, sepia: 0, blur: 0 } },
    { name: 'B&W', values: { brightness: 110, contrast: 120, saturate: 0, grayscale: 100, sepia: 0, blur: 0 } },
    { name: 'Vintage', values: { brightness: 100, contrast: 90, saturate: 70, grayscale: 0, sepia: 40, blur: 0 } },
    { name: 'Dramatic', values: { brightness: 90, contrast: 150, saturate: 120, grayscale: 0, sepia: 0, blur: 0 } },
    { name: 'Soft', values: { brightness: 110, contrast: 90, saturate: 90, grayscale: 0, sepia: 0, blur: 1 } },
];

const ImageEditor = ({ image, token, onClose, onSave }) => {
    const imgRef = useRef(null);
    const canvasRef = useRef(null);

    const [activeTool, setActiveTool] = useState('filters'); // 'crop' | 'rotate' | 'filters'
    const [crop, setCrop] = useState();
    const [completedCrop, setCompletedCrop] = useState(null);
    const [rotation, setRotation] = useState(0);
    const [flipH, setFlipH] = useState(false);
    const [flipV, setFlipV] = useState(false);
    const [filters, setFilters] = useState({ brightness: 100, contrast: 100, saturate: 100, grayscale: 0, sepia: 0, blur: 0 });
    const [saving, setSaving] = useState(false);

    const mediaUrl = `${API_URL}/${image.path?.replace(/\\/g, '/')}`;

    const filterStyle = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturate}%) grayscale(${filters.grayscale}%) sepia(${filters.sepia}%) blur(${filters.blur}px)`;

    const transformStyle = `rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`;

    const resetAll = () => {
        setRotation(0);
        setFlipH(false);
        setFlipV(false);
        setFilters({ brightness: 100, contrast: 100, saturate: 100, grayscale: 0, sepia: 0, blur: 0 });
        setCrop(undefined);
        setCompletedCrop(null);
    };

    const applyPreset = (preset) => {
        setFilters({ ...preset.values });
    };

    const handleSave = useCallback(async (saveAs = false) => {
        if (!imgRef.current) return;
        setSaving(true);

        try {
            const img = imgRef.current;
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');

            // Determine source dimensions (crop or full)
            let sx = 0, sy = 0, sWidth = img.naturalWidth, sHeight = img.naturalHeight;
            if (completedCrop && completedCrop.width && completedCrop.height) {
                const scaleX = img.naturalWidth / img.width;
                const scaleY = img.naturalHeight / img.height;
                sx = completedCrop.x * scaleX;
                sy = completedCrop.y * scaleY;
                sWidth = completedCrop.width * scaleX;
                sHeight = completedCrop.height * scaleY;
            }

            // Handle rotation (swap dimensions for 90/270)
            const isRotated = rotation % 180 !== 0;
            canvas.width = isRotated ? sHeight : sWidth;
            canvas.height = isRotated ? sWidth : sHeight;

            ctx.save();
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate((rotation * Math.PI) / 180);
            ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
            ctx.filter = filterStyle;
            ctx.drawImage(img, sx, sy, sWidth, sHeight, -sWidth / 2, -sHeight / 2, sWidth, sHeight);
            ctx.restore();

            // Convert to blob and upload
            canvas.toBlob(async (blob) => {
                if (!blob) { setSaving(false); return; }
                const formData = new FormData();
                const filename = saveAs ? `edited-${image.originalName}` : image.originalName;
                formData.append('image', blob, filename);

                await fetch(`${API_URL}/api/images/upload`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}` },
                    body: formData,
                });

                if (onSave) onSave();
                onClose();
            }, 'image/png');
        } catch (err) {
            console.error('Save error:', err);
            setSaving(false);
        }
    }, [completedCrop, rotation, flipH, flipV, filterStyle, image, token, onClose, onSave]);

    // Keyboard shortcuts
    useEffect(() => {
        const handler = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose]);

    return (
        <div className="editor-overlay" onClick={onClose}>
            <div className="editor-modal" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="editor-header">
                    <h3>Edit Image</h3>
                    <div className="editor-header-actions">
                        <button className="editor-btn ghost" onClick={resetAll} title="Reset all">
                            <Undo2 size={16} /> Reset
                        </button>
                        <button className="editor-btn primary" onClick={() => handleSave(true)} disabled={saving}>
                            <Save size={16} /> {saving ? 'Saving...' : 'Save as Copy'}
                        </button>
                        <button className="editor-close" onClick={onClose}><X size={20} /></button>
                    </div>
                </div>

                {/* Canvas area */}
                <div className="editor-canvas-area">
                    {activeTool === 'crop' ? (
                        <ReactCrop crop={crop} onChange={setCrop} onComplete={setCompletedCrop}>
                            <img
                                ref={imgRef}
                                src={mediaUrl}
                                alt="Edit"
                                className="editor-image"
                                style={{ filter: filterStyle, transform: transformStyle }}
                                crossOrigin="anonymous"
                            />
                        </ReactCrop>
                    ) : (
                        <img
                            ref={imgRef}
                            src={mediaUrl}
                            alt="Edit"
                            className="editor-image"
                            style={{ filter: filterStyle, transform: transformStyle }}
                            crossOrigin="anonymous"
                        />
                    )}
                    <canvas ref={canvasRef} style={{ display: 'none' }} />
                </div>

                {/* Toolbar */}
                <div className="editor-toolbar">
                    <div className="editor-tools">
                        <button className={`editor-tool ${activeTool === 'crop' ? 'active' : ''}`} onClick={() => setActiveTool('crop')}>
                            <Crop size={18} /> Crop
                        </button>
                        <button className={`editor-tool ${activeTool === 'rotate' ? 'active' : ''}`} onClick={() => setActiveTool('rotate')}>
                            <RotateCw size={18} /> Transform
                        </button>
                        <button className={`editor-tool ${activeTool === 'filters' ? 'active' : ''}`} onClick={() => setActiveTool('filters')}>
                            <SlidersHorizontal size={18} /> Filters
                        </button>
                    </div>

                    {/* Tool-specific controls */}
                    <div className="editor-controls">
                        {activeTool === 'rotate' && (
                            <div className="rotate-controls">
                                <button className="editor-btn" onClick={() => setRotation((r) => (r + 90) % 360)}>
                                    <RotateCw size={16} /> Rotate 90°
                                </button>
                                <button className={`editor-btn ${flipH ? 'active' : ''}`} onClick={() => setFlipH(!flipH)}>
                                    <FlipHorizontal size={16} /> Flip H
                                </button>
                                <button className={`editor-btn ${flipV ? 'active' : ''}`} onClick={() => setFlipV(!flipV)}>
                                    <FlipVertical size={16} /> Flip V
                                </button>
                                <span className="rotation-label">{rotation}°</span>
                            </div>
                        )}

                        {activeTool === 'filters' && (
                            <div className="filter-controls">
                                <div className="filter-presets">
                                    {FILTER_PRESETS.map((p) => (
                                        <button
                                            key={p.name}
                                            className={`filter-preset ${JSON.stringify(filters) === JSON.stringify(p.values) ? 'active' : ''}`}
                                            onClick={() => applyPreset(p)}
                                        >
                                            <div className="filter-preset-preview">
                                                <img src={mediaUrl} alt="" style={{ filter: `brightness(${p.values.brightness}%) contrast(${p.values.contrast}%) saturate(${p.values.saturate}%) grayscale(${p.values.grayscale}%) sepia(${p.values.sepia}%)` }} />
                                            </div>
                                            <span>{p.name}</span>
                                        </button>
                                    ))}
                                </div>
                                <div className="filter-sliders">
                                    {[
                                        { key: 'brightness', label: 'Brightness', min: 0, max: 200 },
                                        { key: 'contrast', label: 'Contrast', min: 0, max: 200 },
                                        { key: 'saturate', label: 'Saturation', min: 0, max: 200 },
                                        { key: 'sepia', label: 'Sepia', min: 0, max: 100 },
                                        { key: 'blur', label: 'Blur', min: 0, max: 10 },
                                    ].map(({ key, label, min, max }) => (
                                        <div key={key} className="filter-slider">
                                            <label>{label}</label>
                                            <input
                                                type="range"
                                                min={min}
                                                max={max}
                                                step={key === 'blur' ? 0.5 : 1}
                                                value={filters[key]}
                                                onChange={(e) => setFilters((f) => ({ ...f, [key]: parseFloat(e.target.value) }))}
                                            />
                                            <span className="filter-value">{filters[key]}{key === 'blur' ? 'px' : '%'}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTool === 'crop' && (
                            <div className="crop-controls">
                                <p className="crop-hint">Click and drag on the image to select a crop area</p>
                                {completedCrop && completedCrop.width > 0 && (
                                    <span className="crop-dimensions">
                                        {Math.round(completedCrop.width)} × {Math.round(completedCrop.height)}px
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImageEditor;
