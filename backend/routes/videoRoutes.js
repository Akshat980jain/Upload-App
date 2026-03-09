const express = require('express');
const multer = require('multer');
const path = require('path');
const Video = require('../models/Video');
const { protect } = require('../middleware/authMiddleware');
const archiver = require('archiver');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const { logActivity } = require('./activityRoutes');

const router = express.Router();

// Multer storage for videos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'videos'));
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
      path: file.path.replace(/\\/g, '/'),
      size: file.size,
      user: req.user.id
    }));

    const result = await Video.insertMany(videos);

    // Log activity
    for (const vid of videos) {
      await logActivity(req.user.id, 'upload', vid.originalName, 'video');
    }

    res.status(201).json(result);

    // Generate thumbnails in background
    setImmediate(async () => {
      for (const video of result) {
        try {
          const thumbnailName = `thumb-${video.filename}.jpg`;
          const thumbnailDir = path.join(__dirname, '..', 'uploads');
          if (!fs.existsSync(thumbnailDir)) fs.mkdirSync(thumbnailDir, { recursive: true });

          await new Promise((resolve, reject) => {
            ffmpeg(path.join(__dirname, '..', video.path))
              .on('end', resolve)
              .on('error', reject)
              .screenshots({
                count: 1,
                folder: thumbnailDir,
                filename: thumbnailName,
                size: '320x240',
                timemarks: ['1']
              });
          });

          // Also get duration
          const duration = await new Promise((resolve) => {
            ffmpeg.ffprobe(path.join(__dirname, '..', video.path), (err, metadata) => {
              resolve(err ? 0 : metadata.format.duration);
            });
          });

          await Video.findByIdAndUpdate(video._id, { thumbnail: thumbnailName, duration: duration || 0 });
        } catch (err) {
          console.error(`Thumbnail generation failed for ${video.filename}:`, err.message);
        }
      }
    });
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
    const videos = await Video.find({ user: req.user.id, isDeleted: { $ne: true } }).sort({ uploadDate: -1 });
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
    if (!video) return res.status(404).json({ message: 'Video not found' });
    if (video.user.toString() !== req.user.id) return res.status(401).json({ message: 'Not authorized' });

    video.isDeleted = true;
    video.deletedAt = new Date();
    video.folder = null;
    await video.save();

    // Log activity
    await logActivity(req.user.id, 'delete', video.originalName, 'video');

    res.json({ message: 'Video moved to trash' });
  } catch (error) {
    console.error('Error deleting video:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/trash', protect, async (req, res) => {
  try {
    const videos = await Video.find({ user: req.user.id, isDeleted: true }).sort({ deletedAt: -1 });
    res.json(videos);
  } catch (error) { res.status(500).json({ message: 'Error fetching trash' }); }
});

router.put('/:id/restore', protect, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video || video.user.toString() !== req.user.id) return res.status(404).json({ message: 'Not found' });
    video.isDeleted = false; video.deletedAt = null; await video.save();

    // Log activity
    await logActivity(req.user.id, 'restore', video.originalName, 'video');

    res.json(video);
  } catch (error) { res.status(500).json({ message: 'Error restoring' }); }
});

router.delete('/:id/permanent', protect, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video || video.user.toString() !== req.user.id) return res.status(404).json({ message: 'Not found' });
    if (fs.existsSync(video.path)) fs.unlinkSync(video.path);
    await video.deleteOne();

    // Log activity
    await logActivity(req.user.id, 'delete', video.originalName || video.filename, 'video', { permanent: true });

    res.json({ message: 'Permanently deleted' });
  } catch (error) { res.status(500).json({ message: 'Error permanently deleting' }); }
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