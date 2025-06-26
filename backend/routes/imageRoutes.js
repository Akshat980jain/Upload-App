const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Image = require('../models/Image');
const { protect } = require('../middleware/authMiddleware');
const archiver = require('archiver');

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 20 * 1024 * 1024 // 20MB limit
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
    const images = await Image.find({ user: req.user.id }).sort({ uploadDate: -1 });
    res.json(images);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching images', error: error.message });
  }
});

// @desc    Upload multiple images
// @route   POST /api/images/upload-multiple
// @access  Private
router.post('/upload-multiple', protect, upload.array('images', 1000), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const uploadedImages = [];

    for (const file of req.files) {
      const newImage = new Image({
        filename: file.filename,
        originalName: file.originalname,
        path: file.path,
        size: file.size,
        user: req.user.id,
      });

      const savedImage = await newImage.save();
      uploadedImages.push(savedImage);
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
      path: req.file.path,
      size: req.file.size,
      user: req.user.id, // Associate image with the logged-in user
    });

    const savedImage = await newImage.save();
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

    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    // Check if the image belongs to the user
    if (image.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized to delete this image' });
    }

    // Delete file from filesystem
    if (fs.existsSync(image.path)) {
      fs.unlinkSync(image.path);
    }

    await image.deleteOne(); // Use deleteOne() on the document instance
    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting image', error: error.message });
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