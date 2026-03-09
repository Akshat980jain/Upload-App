const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const { protect } = require('../middleware/authMiddleware');
const ShareLink = require('../models/ShareLink');
const Image = require('../models/Image');
const Video = require('../models/Video');
const Document = require('../models/Document');
const { logActivity } = require('./activityRoutes');

// Helper to get correct model
const getModel = (type) => {
    switch (type) {
        case 'image': return Image;
        case 'video': return Video;
        case 'document': return Document;
        default: return null;
    }
};

// @desc    Create a share link
// @route   POST /api/share
// @access  Private
router.post('/', protect, async (req, res) => {
    const { fileId, fileType, password, expiresInDays } = req.body;

    try {
        const Model = getModel(fileType);
        if (!Model) return res.status(400).json({ message: 'Invalid file type' });

        const file = await Model.findOne({ _id: fileId, user: req.user.id });
        if (!file) return res.status(404).json({ message: 'File not found' });

        const token = crypto.randomBytes(32).toString('hex');

        let linkData = {
            fileId,
            fileType,
            user: req.user.id,
            token
        };

        if (password) {
            const salt = await bcrypt.genSalt(10);
            linkData.password = await bcrypt.hash(password, salt);
        }

        if (expiresInDays) {
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + parseInt(expiresInDays));
            linkData.expiresAt = expiresAt;
        }

        const shareLink = await ShareLink.create(linkData);

        // Log activity
        await logActivity(req.user.id, 'share', file.originalName || file.name, fileType);

        res.status(201).json({
            token: shareLink.token,
            hasPassword: !!shareLink.password,
            expiresAt: shareLink.expiresAt
        });

    } catch (error) {
        console.error('Error creating share link:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Get user's share links
// @route   GET /api/share/my-links
// @access  Private
router.get('/my-links', protect, async (req, res) => {
    try {
        const links = await ShareLink.find({ user: req.user.id }).sort({ createdAt: -1 });

        // Fetch file details for each link (name, etc)
        const enrichedLinks = await Promise.all(links.map(async (link) => {
            const Model = getModel(link.fileType);
            const file = await Model.findById(link.fileId).select('originalName name');
            return {
                ...link._doc,
                fileName: file ? (file.originalName || file.name) : 'Unknown File',
                password: !!link.password // Only send boolean flag
            };
        }));

        res.json(enrichedLinks);
    } catch (error) {
        console.error('Error fetching share links:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Revoke a share link
// @route   DELETE /api/share/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
    try {
        const link = await ShareLink.findOne({ _id: req.params.id, user: req.user.id });

        if (!link) return res.status(404).json({ message: 'Share link not found' });

        await link.deleteOne();
        res.json({ message: 'Share link revoked successfully' });
    } catch (error) {
        console.error('Error revoking share link:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Verify password for a protected link (Returns temp token or sets cookie in real app, here we just return success)
// @route   POST /api/share/:token/verify
// @access  Public
router.post('/:token/verify', async (req, res) => {
    try {
        const { password } = req.body;
        const link = await ShareLink.findOne({ token: req.params.token });

        if (!link) return res.status(404).json({ message: 'Link not found' });
        if (link.expiresAt && new Date() > link.expiresAt) return res.status(410).json({ message: 'Link expired' });
        if (!link.password) return res.status(400).json({ message: 'Link is not password protected' });

        const isMatch = await bcrypt.compare(password, link.password);
        if (!isMatch) return res.status(401).json({ message: 'Invalid password' });

        res.json({ success: true, message: 'Password verified' });
    } catch (error) {
        console.error('Error verifying share password:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Serve public file
// @route   GET /api/share/:token
// @access  Public
router.get('/:token', async (req, res) => {
    try {
        // Find link
        const link = await ShareLink.findOne({ token: req.params.token });

        if (!link) return res.status(404).json({ message: 'Link not found' });

        // Check expiration
        if (link.expiresAt && new Date() > link.expiresAt) {
            return res.status(410).json({ message: 'This shared link has expired.' });
        }

        // Check password (if requested via GET, it assumes no password. If password needed, client should have verified first and potentially sent a temp token, but for simplicity we assume if it has a password, the client can't just GET it directly without a query param or auth wrapper. Since this is an architectural choice, let's require the password in query `?p=...` if it's a simple GET, or better, deny it and require the frontend to render a password page first.)

        if (link.password) {
            const providedPassword = req.query.p; // Not secure for GET, but okay for demo. Usually frontend verifies via POST, then gets a signed short-lived JWT to download.
            if (!providedPassword) {
                return res.status(401).json({ requirePassword: true, message: 'Password required to access this file.' });
            }
            const isMatch = await bcrypt.compare(providedPassword, link.password);
            if (!isMatch) return res.status(401).json({ message: 'Invalid password' });
        }

        // Get File
        const Model = getModel(link.fileType);
        const file = await Model.findById(link.fileId);

        if (!file || !fs.existsSync(file.path)) {
            return res.status(404).json({ message: 'Original file no longer exists.' });
        }

        // Increment view count
        link.viewCount += 1;
        await link.save();

        // Serve file
        res.sendFile(path.resolve(file.path));

    } catch (error) {
        console.error('Error serving shared file:', error);
        res.status(500).json({ message: 'Server error' });
    }
});


module.exports = router;
