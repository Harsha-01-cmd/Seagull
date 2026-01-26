const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
    title: { type: String, required: true },
    company: { type: String, required: true },
    location: { type: String },
    description: { type: String },
    applyLink: { type: String, required: true },
    source: { type: String }, // e.g., 'Google', 'LinkedIn', 'Scraper'
    postedDate: { type: Date },
    scrapedAt: { type: Date, default: Date.now },
    tags: [{ type: String }],
});

module.exports = mongoose.model('Job', JobSchema);
