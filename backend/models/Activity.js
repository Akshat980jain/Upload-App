const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, enum: ['upload', 'delete', 'restore', 'move', 'create_folder', 'delete_folder', 'share', 'edit_image'], required: true },
    targetName: { type: String, required: true },
    targetType: { type: String, enum: ['image', 'video', 'document', 'folder'], required: true },
    metadata: { type: mongoose.Schema.Types.Mixed }, // Extra context like folder name
    createdAt: { type: Date, default: Date.now }
});

activitySchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Activity', activitySchema);
