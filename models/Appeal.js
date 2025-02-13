const mongoose = require('mongoose');

const appealSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true
    },
    postId: {
        type: String,
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    adminResponse: {
        type: String,
        default: null
    },
    processed: {
        type: Boolean,
        default: false
    },
    processedAt: {
        type: Date,
        default: null
    }
});

// Pre-save middleware to set processedAt when status changes
appealSchema.pre('save', function(next) {
    if (this.isModified('status') && (this.status === 'approved' || this.status === 'rejected')) {
        this.processed = true;
        this.processedAt = new Date();
    }
    next();
});

module.exports = mongoose.model('Appeal', appealSchema);