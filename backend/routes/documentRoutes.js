const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Document = require('../models/Document');
const { protect } = require('../middleware/authMiddleware');
const archiver = require('archiver');

const router = express.Router();

// Multer storage for documents
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'documents/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

// Accept all file types for documents
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// @route   POST /api/documents/upload-multiple
// @desc    Upload multiple documents
// @access  Private
router.post('/upload-multiple', protect, upload.array('documents', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No document files uploaded' });
    }

    const docs = req.files.map(file => ({
      originalName: file.originalname,
      filename: file.filename,
      path: file.path,
      size: file.size,
      type: path.extname(file.originalname).substring(1),
      user: req.user.id
    }));

    const result = await Document.insertMany(docs);
    res.status(201).json(result);
  } catch (error) {
    console.error('Document upload error:', error);
    res.status(500).json({ message: 'Server error during document upload', error: error.message });
  }
});

// @route   GET /api/documents
// @desc    Get all documents for a user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const docs = await Document.find({ user: req.user.id }).sort({ uploadDate: -1 });
    res.json(docs);
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/documents/:id
// @desc    Delete a document
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check if the document belongs to the user
    if (document.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized to delete this document' });
    }

    // Delete file from filesystem
    if (fs.existsSync(document.path)) {
      fs.unlinkSync(document.path);
    }

    await document.deleteOne();
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ message: 'Error deleting document', error: error.message });
  }
});

// @desc    Download selected documents as zip
// @route   POST /api/documents/download-zip
// @access  Private
router.post('/download-zip', protect, async (req, res) => {
  const { documentIds } = req.body;
  if (!Array.isArray(documentIds) || documentIds.length === 0) {
    return res.status(400).json({ message: 'No documents selected' });
  }
  try {
    const docs = await Document.find({ _id: { $in: documentIds }, user: req.user.id });
    if (!docs.length) {
      return res.status(404).json({ message: 'No documents found' });
    }
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename=documents.zip');
    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(res);
    for (const doc of docs) {
      if (fs.existsSync(doc.path)) {
        archive.file(doc.path, { name: doc.originalName });
      }
    }
    archive.finalize();
  } catch (error) {
    console.error('Error creating zip:', error);
    res.status(500).json({ message: 'Error creating zip', error: error.message });
  }
});

module.exports = router; 