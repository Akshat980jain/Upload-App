import React, { useState, useEffect } from 'react';
import { Upload, Trash2, RotateCcw, Image as ImageIcon, Video, FileText, FolderPlus, Share2 } from 'lucide-react';
import './ActivityFeed.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const ActivityFeed = ({ token }) => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    useEffect(() => {
        fetchActivities(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    const fetchActivities = async (pageNum) => {
        try {
            setLoading(true);
            const res = await fetch(`${API_URL}/api/activity?page=${pageNum}&limit=20`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                if (pageNum === 1) {
                    setActivities(data.activities || []);
                } else {
                    setActivities(prev => [...prev, ...(data.activities || [])]);
                }
                setHasMore(data.page < data.pages);
                setPage(data.page);
            }
        } catch (err) {
            console.error('Failed to fetch activities', err);
        } finally {
            setLoading(false);
        }
    };

    const loadMore = () => {
        if (!loading && hasMore) {
            fetchActivities(page + 1);
        }
    };

    const getActionIcon = (action, itemType) => {
        switch (action) {
            case 'upload': return <Upload size={16} className="text-blue-500" />;
            case 'delete': return <Trash2 size={16} className="text-red-500" />;
            case 'restore': return <RotateCcw size={16} className="text-green-500" />;
            case 'create': return <FolderPlus size={16} className="text-blue-500" />;
            case 'share': return <Share2 size={16} className="text-purple-500" />;
            default: return <div className="w-2 h-2 rounded-full bg-gray-400" />;
        }
    };

    const getItemIcon = (itemType) => {
        switch (itemType) {
            case 'image': return <ImageIcon size={14} />;
            case 'video': return <Video size={14} />;
            case 'document': return <FileText size={14} />;
            default: return null;
        }
    };

    const getActionText = (action) => {
        switch (action) {
            case 'upload': return 'uploaded';
            case 'delete': return 'deleted';
            case 'restore': return 'restored';
            case 'create': return 'created';
            case 'share': return 'shared';
            default: return action;
        }
    };

    const formatTimeAgo = (date) => {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);

        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + ' years ago';

        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + ' months ago';

        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + ' days ago';

        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + ' hours ago';

        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + ' minutes ago';

        return 'just now';
    };

    if (loading && activities.length === 0) {
        return (
            <div className="activity-feed-container">
                <h3 className="activity-feed-title">Recent Activity</h3>
                <div className="activity-skeleton" />
                <div className="activity-skeleton" />
                <div className="activity-skeleton" />
            </div>
        );
    }

    if (activities.length === 0) {
        return (
            <div className="activity-feed-container" style={{ minHeight: '200px' }}>
                <h3 className="activity-feed-title">Recent Activity</h3>
                <div className="empty-activity text-center p-6 text-gray-500 text-sm" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    No recent activity.
                </div>
            </div>
        );
    }

    return (
        <div className="activity-feed-container">
            <h3 className="activity-feed-title">Recent Activity</h3>
            <div className="activity-feed-list">
                {activities.map((activity) => (
                    <div key={activity._id} className="activity-item">
                        <div className="activity-icon-wrapper bg-gray-100 dark:bg-gray-800 rounded-full p-2 mr-3">
                            {getActionIcon(activity.action, activity.itemType)}
                        </div>
                        <div className="activity-content flex-1">
                            <p className="activity-text text-sm">
                                You <span className="font-semibold">{getActionText(activity.action)}</span>
                                {' '}{activity.itemName}
                                {activity.details?.permanent && ' (permanently)'}
                            </p>
                            <span className="activity-time text-xs text-gray-400">
                                {formatTimeAgo(activity.createdAt)}
                            </span>
                        </div>
                        {getItemIcon(activity.itemType) && (
                            <div className="activity-type-icon text-gray-400 ml-2">
                                {getItemIcon(activity.itemType)}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {hasMore && (
                <button
                    onClick={loadMore}
                    disabled={loading}
                    className="load-more-btn mt-4 w-full py-2 text-sm text-blue-500 hover:text-blue-600 font-medium transition-colors"
                >
                    {loading ? 'Loading...' : 'Load older activity'}
                </button>
            )}
        </div>
    );
};

export default ActivityFeed;
