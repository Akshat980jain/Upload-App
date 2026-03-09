const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Image = require('../models/Image');
const { protect } = require('../middleware/authMiddleware');
const archiver = require('archiver');
const { logActivity } = require('./activityRoutes');

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed!'));
  }
});

// @desc    Get all images for the logged-in user
// @route   GET /api/images
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const images = await Image.find({ user: req.user.id, isDeleted: { $ne: true } }).sort({ uploadDate: -1 });
    res.json(images);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching images', error: error.message });
  }
});

// @desc    Upload multiple images
// @route   POST /api/images/upload-multiple
// @access  Private
router.post('/upload-multiple', protect, upload.array('images', 50), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const uploadedImages = [];

    for (const file of req.files) {
      const newImage = new Image({
        filename: file.filename,
        originalName: file.originalname,
        path: file.path.replace(/\\/g, '/'),
        size: file.size,
        user: req.user.id,
      });

      const savedImage = await newImage.save();
      uploadedImages.push(savedImage);

      // Log activity
      await logActivity(req.user.id, 'upload', savedImage.originalName, 'image');
    }

    res.status(201).json({
      message: `${uploadedImages.length} images uploaded successfully`,
      images: uploadedImages
    });
  } catch (error) {
    res.status(500).json({ message: 'Error uploading images', error: error.message });
  }
});

// @desc    Upload a new image
// @route   POST /api/images/upload
// @access  Private
router.post('/upload', protect, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const newImage = new Image({
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: req.file.path.replace(/\\/g, '/'),
      size: req.file.size,
      user: req.user.id, // Associate image with the logged-in user
    });

    const savedImage = await newImage.save();

    // Log activity
    await logActivity(req.user.id, 'upload', savedImage.originalName, 'image');

    res.status(201).json(savedImage);
  } catch (error) {
    res.status(500).json({ message: 'Error uploading image', error: error.message });
  }
});

// @desc    Delete an image
// @route   DELETE /api/images/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const image = await Image.findById(req.params.id);
    if (!image) return res.status(404).json({ message: 'Image not found' });
    if (image.user.toString() !== req.user.id) return res.status(401).json({ message: 'Not authorized' });

    // Soft delete — move to trash
    image.isDeleted = true;
    image.deletedAt = new Date();
    image.folder = null;
    await image.save();

    // Log activity
    await logActivity(req.user.id, 'delete', image.originalName, 'image');

    res.json({ message: 'Image moved to trash' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting image', error: error.message });
  }
});

// @desc    Get trashed images
// @route   GET /api/images/trash
router.get('/trash', protect, async (req, res) => {
  try {
    const images = await Image.find({ user: req.user.id, isDeleted: true }).sort({ deletedAt: -1 });
    res.json(images);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching trash', error: error.message });
  }
});

// @desc    Restore trashed image
// @route   PUT /api/images/:id/restore
router.put('/:id/restore', protect, async (req, res) => {
  try {
    const image = await Image.findById(req.params.id);
    if (!image || image.user.toString() !== req.user.id) return res.status(404).json({ message: 'Not found' });
    image.isDeleted = false;
    image.deletedAt = null;
    await image.save();

    // Log activity
    await logActivity(req.user.id, 'restore', image.originalName, 'image');

    res.json(image);
  } catch (error) {
    res.status(500).json({ message: 'Error restoring image', error: error.message });
  }
});

// @desc    Permanently delete trashed image
// @route   DELETE /api/images/:id/permanent
router.delete('/:id/permanent', protect, async (req, res) => {
  try {
    const image = await Image.findById(req.params.id);
    if (!image || image.user.toString() !== req.user.id) return res.status(404).json({ message: 'Not found' });
    if (fs.existsSync(image.path)) fs.unlinkSync(image.path);
    await image.deleteOne();

    // Log activity
    await logActivity(req.user.id, 'delete', image.originalName || image.filename, 'image', { permanent: true });

    res.json({ message: 'Permanently deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error permanently deleting', error: error.message });
  }
});

// @desc    Download selected images as zip
// @route   POST /api/images/download-zip
// @access  Private
router.post('/download-zip', protect, async (req, res) => {
  const { imageIds } = req.body;
  if (!Array.isArray(imageIds) || imageIds.length === 0) {
    return res.status(400).json({ message: 'No images selected' });
  }
  try {
    const images = await Image.find({ _id: { $in: imageIds }, user: req.user.id });
    if (!images.length) {
      return res.status(404).json({ message: 'No images found' });
    }
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename=images.zip');
    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(res);
    for (const img of images) {
      if (fs.existsSync(img.path)) {
        archive.file(img.path, { name: img.originalName });
      }
    }
    archive.finalize();
  } catch (error) {
    console.error('Error creating zip:', error);
    res.status(500).json({ message: 'Error creating zip', error: error.message });
  }
});

module.exports = router; 