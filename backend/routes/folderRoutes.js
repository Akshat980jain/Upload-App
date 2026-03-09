const express = require('express');
const Folder = require('../models/Folder');
const Image = require('../models/Image');
const Video = require('../models/Video');
const Document = require('../models/Document');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// @route   GET /api/folders
// @desc    Get all folders for the user
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const folders = await Folder.find({ user: req.user.id }).sort({ createdAt: -1 });

        // Get file counts for each folder
        const foldersWithCounts = await Promise.all(
            folders.map(async (folder) => {
                const [imageCount, videoCount, docCount] = await Promise.all([
                    Image.countDocuments({ folder: folder._id, user: req.user.id }),
                    Video.countDocuments({ folder: folder._id, user: req.user.id }),
                    Document.countDocuments({ folder: folder._id, user: req.user.id }),
                ]);
                return {
                    ...folder.toObject(),
                    fileCount: imageCount + videoCount + docCount,
                    imageCount,
                    videoCount,
                    docCount,
                };
            })
        );

        res.json(foldersWithCounts);
    } catch (error) {
        console.error('Error fetching folders:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/folders
// @desc    Create a new folder
// @access  Private
router.post('/', protect, async (req, res) => {
    try {
        const { name, color } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ message: 'Folder name is required' });
        }

        const folder = await Folder.create({
            name: name.trim(),
            color: color || '#4285f4',
            user: req.user.id,
        });

        res.status(201).json({ ...folder.toObject(), fileCount: 0, imageCount: 0, videoCount: 0, docCount: 0 });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'A folder with this name already exists' });
        }
        console.error('Error creating folder:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/folders/remove-files
// @desc    Remove files from their folder (back to unfiled)
// @access  Private
// NOTE: This route MUST be defined BEFORE /:id to prevent Express from matching 'remove-files' as an :id parameter
router.put('/remove-files', protect, async (req, res) => {
    try {
        const { fileIds, fileType } = req.body;
        if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
            return res.status(400).json({ message: 'fileIds array is required' });
        }

        const Model = fileType === 'image' ? Image : fileType === 'video' ? Video : Document;
        await Model.updateMany(
            { _id: { $in: fileIds }, user: req.user.id },
            { folder: null }
        );

        res.json({ message: 'Files removed from folder' });
    } catch (error) {
        console.error('Error removing files:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/folders/:id
// @desc    Rename / change color of a folder
// @access  Private
router.put('/:id', protect, async (req, res) => {
    try {
        const folder = await Folder.findById(req.params.id);
        if (!folder) return res.status(404).json({ message: 'Folder not found' });
        if (folder.user.toString() !== req.user.id) return res.status(401).json({ message: 'Not authorized' });

        const { name, color } = req.body;
        if (name !== undefined) folder.name = name.trim();
        if (color !== undefined) folder.color = color;

        await folder.save();
        res.json(folder);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'A folder with this name already exists' });
        }
        console.error('Error updating folder:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE /api/folders/:id
// @desc    Delete a folder (files inside become unfiled)
// @access  Private
router.delete('/:id', protect, async (req, res) => {
    try {
        const folder = await Folder.findById(req.params.id);
        if (!folder) return res.status(404).json({ message: 'Folder not found' });
        if (folder.user.toString() !== req.user.id) return res.status(401).json({ message: 'Not authorized' });

        // Unfile all files in this folder
        await Promise.all([
            Image.updateMany({ folder: folder._id }, { folder: null }),
            Video.updateMany({ folder: folder._id }, { folder: null }),
            Document.updateMany({ folder: folder._id }, { folder: null }),
        ]);

        await folder.deleteOne();
        res.json({ message: 'Folder deleted' });
    } catch (error) {
        console.error('Error deleting folder:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/folders/:id/move
// @desc    Move files into a folder
// @access  Private
router.put('/:id/move', protect, async (req, res) => {
    try {
        const folder = await Folder.findById(req.params.id);
        if (!folder) return res.status(404).json({ message: 'Folder not found' });
        if (folder.user.toString() !== req.user.id) return res.status(401).json({ message: 'Not authorized' });

        const { fileIds, fileType } = req.body;
        if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
            return res.status(400).json({ message: 'fileIds array is required' });
        }

        const Model = fileType === 'image' ? Image : fileType === 'video' ? Video : Document;
        await Model.updateMany(
            { _id: { $in: fileIds }, user: req.user.id },
            { folder: folder._id }
        );

        res.json({ message: 'Files moved to folder' });
    } catch (error) {
        console.error('Error moving files:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/folders/:id/share
// @desc    Share a folder with a user by email
// @access  Private
router.post('/:id/share', protect, async (req, res) => {
    try {
        const folder = await Folder.findById(req.params.id);
        if (!folder) return res.status(404).json({ message: 'Folder not found' });
        if (folder.user.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized to share this folder' });

        const { email, permission } = req.body;
        if (!email) return res.status(400).json({ message: 'Email is required' });

        const User = require('../models/User'); // Import here to avoid circular dependency
        const userToShare = await User.findOne({ email });

        if (!userToShare) return res.status(404).json({ message: 'User with this email not found' });
        if (userToShare._id.toString() === req.user.id) return res.status(400).json({ message: 'You cannot share a folder with yourself' });

        // Check if already shared
        const alreadyShared = folder.sharedWith.find(s => s.user.toString() === userToShare._id.toString());
        if (alreadyShared) {
            // Update permission
            alreadyShared.permission = permission || 'view';
        } else {
            folder.sharedWith.push({ user: userToShare._id, permission: permission || 'view' });
        }

        await folder.save();
        res.json({ message: 'Folder shared successfully', sharedWith: folder.sharedWith });
    } catch (error) {
        console.error('Error sharing folder:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE /api/folders/:id/share/:userId
// @desc    Remove a user from sharedWith
// @access  Private
router.delete('/:id/share/:userId', protect, async (req, res) => {
    try {
        const folder = await Folder.findById(req.params.id);
        if (!folder) return res.status(404).json({ message: 'Folder not found' });
        if (folder.user.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

        folder.sharedWith = folder.sharedWith.filter(s => s.user.toString() !== req.params.userId);
        await folder.save();

        res.json({ message: 'User removed from folder', sharedWith: folder.sharedWith });
    } catch (error) {
        console.error('Error removing shared user:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/folders/shared
// @desc    Get all folders shared with the user
// @access  Private
router.get('/shared', protect, async (req, res) => {
    try {
        const folders = await Folder.find({ 'sharedWith.user': req.user.id })
            .populate('user', 'name email') // Get owner info
            .sort({ createdAt: -1 });

        // Include file counts (assuming files inherit folder permissions for now, or just to show the count)
        const foldersWithCounts = await Promise.all(
            folders.map(async (folder) => {
                const [imageCount, videoCount, docCount] = await Promise.all([
                    Image.countDocuments({ folder: folder._id }), // Don't filter by user since it's shared
                    Video.countDocuments({ folder: folder._id }),
                    Document.countDocuments({ folder: folder._id }),
                ]);

                // Get this user's specific permission
                const myPermission = folder.sharedWith.find(s => s.user.toString() === req.user.id)?.permission || 'view';

                return {
                    ...folder.toObject(),
                    fileCount: imageCount + videoCount + docCount,
                    imageCount,
                    videoCount,
                    docCount,
                    myPermission,
                    isShared: true
                };
            })
        );

        res.json(foldersWithCounts);
    } catch (error) {
        console.error('Error fetching shared folders:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
