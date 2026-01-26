const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' }, // Optional if manual entry
    company: { type: String, required: true },
    role: { type: String, required: true },
    status: {
        type: String,
        enum: ['Applied', 'Interview', 'Offer', 'Rejected', 'Wishlist'],
        default: 'Applied'
    },
    appliedDate: { type: Date, default: Date.now },
    notes: { type: String },
    predictionScore: { type: Number }, // ML Prediction
});

module.exports = mongoose.model('Application', ApplicationSchema);
