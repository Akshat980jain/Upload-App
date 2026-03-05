import React from 'react';
import './SkeletonCard.css';

const SkeletonCard = () => (
    <div className="skeleton-card">
        <div className="skeleton-image shimmer" />
        <div className="skeleton-info">
            <div className="skeleton-line shimmer" style={{ width: '75%' }} />
            <div className="skeleton-line shimmer" style={{ width: '50%' }} />
        </div>
    </div>
);

const SkeletonGrid = ({ count = 8 }) => (
    <div className="image-grid">
        {Array.from({ length: count }).map((_, i) => (
            <SkeletonCard key={i} />
        ))}
    </div>
);

export { SkeletonCard, SkeletonGrid };
export default SkeletonGrid;
