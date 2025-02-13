const mongoose = require('mongoose');

const stalkSchema = new mongoose.Schema({
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        required: true
    },
    viewCount: {
        type: Number,
        default: 1
    },
    lastViewed: {
        type: Date,
        default: Date.now
    }
});

// Index for efficient querying
stalkSchema.index({ postId: 1 });

module.exports = mongoose.model('Stalk', stalkSchema);