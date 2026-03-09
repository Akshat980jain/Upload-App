const mongoose = require('mongoose');

const shareLinkSchema = new mongoose.Schema({
    fileId: { type: mongoose.Schema.Types.ObjectId, required: true },
    fileType: { type: String, enum: ['image', 'video', 'document'], required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    token: { type: String, required: true, unique: true },
    password: { type: String, default: null }, // bcrypt hashed
    expiresAt: { type: Date, default: null },
    viewCount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ShareLink', shareLinkSchema);
