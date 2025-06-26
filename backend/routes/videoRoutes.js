const express = require('express');
const multer = require('multer');
const path = require('path');
const Video = require('../models/Video');
const { protect } = require('../middleware/authMiddleware');
const archiver = require('archiver');
const fs = require('fs');

const router = express.Router();

// Multer storage for videos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'videos/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const videoFilter = (req, file, cb) => {
  const filetypes = /mp4|mov|avi|mkv/;
  const mimetype = filetypes.test(file.mimetype);
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Only video files are allowed!'));
};

const upload = multer({ 
  storage: storage,
  fileFilter: videoFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// @route   POST api/videos/upload-multiple
// @desc    Upload multiple videos
// @access  Private
router.post('/upload-multiple', protect, upload.array('videos', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No video files uploaded' });
    }

    const videos = req.files.map(file => ({
      originalName: file.originalname,
      filename: file.filename,
      path: file.path,
      size: file.size,
      user: req.user.id
    }));

    const result = await Video.insertMany(videos);
    res.status(201).json(result);
  } catch (error) {
    console.error('Video upload error:', error);
    res.status(500).json({ message: 'Server error during video upload', error: error.message });
  }
});

// @route   GET api/videos
// @desc    Get all videos for a user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const videos = await Video.find({ user: req.user.id }).sort({ uploadDate: -1 });
    res.json(videos);
  } catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE api/videos/:id
// @desc    Delete a video
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }
    if (video.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    // Optional: remove file from server storage
    // const fs = require('fs');
    // fs.unlink(video.path, (err) => {
    //   if (err) console.error('Error deleting video file:', err);
    // });

    await video.deleteOne();
    res.json({ message: 'Video deleted successfully' });
  } catch (error) {
    console.error('Error deleting video:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Download selected videos as zip
// @route   POST /api/videos/download-zip
// @access  Private
router.post('/download-zip', protect, async (req, res) => {
  const { videoIds } = req.body;
  if (!Array.isArray(videoIds) || videoIds.length === 0) {
    return res.status(400).json({ message: 'No videos selected' });
  }
  try {
    const videos = await Video.find({ _id: { $in: videoIds }, user: req.user.id });
    if (!videos.length) {
      return res.status(404).json({ message: 'No videos found' });
    }
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename=videos.zip');
    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(res);
    for (const vid of videos) {
      if (fs.existsSync(vid.path)) {
        archive.file(vid.path, { name: vid.originalName });
      }
    }
    archive.finalize();
  } catch (error) {
    console.error('Error creating zip:', error);
    res.status(500).json({ message: 'Error creating zip', error: error.message });
  }
});

module.exports = router; 