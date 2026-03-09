const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Activity = require('../models/Activity');

// @desc    Get recent activity feed
// @route   GET /api/activity
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const page = parseInt(req.query.page) || 1;
        const skip = (page - 1) * limit;

        const activities = await Activity.find({ user: req.user.id })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Activity.countDocuments({ user: req.user.id });

        res.json({
            activities,
            total,
            page,
            pages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error('Error fetching activity feed:', error);
        res.status(500).json({ message: 'Server error fetching activity feed' });
    }
});

// Helper function to log activity (to be used in other controllers/routes)
const logActivity = async (userId, action, targetName, targetType, metadata = {}) => {
    try {
        await Activity.create({
            user: userId,
            action,
            targetName,
            targetType,
            metadata
        });
    } catch (error) {
        console.error('Failed to log activity:', error);
        // We don't throw here to avoid failing the main action just because logging failed
    }
};

module.exports = {
    router,
    logActivity
};
