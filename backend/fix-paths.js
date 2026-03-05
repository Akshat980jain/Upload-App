/**
 * fix-paths.js
 * One-time migration script to fix Windows backslash paths in MongoDB.
 * Run: node fix-paths.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Image = require('./models/Image');
const Video = require('./models/Video');
const Document = require('./models/Document');

async function fixPaths() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✔ Connected to MongoDB');

        let totalFixed = 0;

        // Fix Image paths
        const images = await Image.find({ path: { $regex: /\\\\/ } });
        for (const img of images) {
            img.path = img.path.replace(/\\/g, '/');
            await img.save();
        }
        console.log(`  Images fixed: ${images.length}`);
        totalFixed += images.length;

        // Fix Video paths
        const videos = await Video.find({ path: { $regex: /\\\\/ } });
        for (const vid of videos) {
            vid.path = vid.path.replace(/\\/g, '/');
            await vid.save();
        }
        console.log(`  Videos fixed: ${videos.length}`);
        totalFixed += videos.length;

        // Fix Document paths
        const docs = await Document.find({ path: { $regex: /\\\\/ } });
        for (const doc of docs) {
            doc.path = doc.path.replace(/\\/g, '/');
            await doc.save();
        }
        console.log(`  Documents fixed: ${docs.length}`);
        totalFixed += docs.length;

        console.log(`\n✔ Total records fixed: ${totalFixed}`);
    } catch (error) {
        console.error('✖ Error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('✔ Disconnected from MongoDB');
    }
}

fixPaths();
