const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
    filename: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: ['image', 'video']
    },
    originalName: {
        type: String,
        required: true
    }
}, { _id: false });

const postSchema = new mongoose.Schema({
    content: {
        type: String,
        required: false
    },
    media: [mediaSchema],
    timestamp: {
        type: Date,
        default: Date.now
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
});

// Remove any existing indexes before creating the model
postSchema.pre('save', async function(next) {
    try {
        await mongoose.connection.collections['posts']?.dropIndexes();
    } catch (err) {
        // Ignore error if collection doesn't exist or indexes can't be dropped
        console.log('Note: Indexes could not be dropped, this is normal for first run');
    }
    next();
});

const Post = mongoose.model('Post', postSchema);

// Ensure indexes are dropped when the application starts
Post.collection.dropIndexes().catch(err => {
    // Ignore error if collection doesn't exist or indexes can't be dropped
    console.log('Note: Indexes could not be dropped, this is normal for first run');
});

module.exports = Post;
