const express = require('express');
const router = express.Router();
const Application = require('../models/Application');

// Middleware to check auth
const ensureAuth = (req, res, next) => {
    if (req.isAuthenticated()) return next();
    res.status(401).json({ message: 'Unauthorized' });
};

// GET /api/applications (My Applications)
router.get('/', ensureAuth, async (req, res) => {
    try {
        const apps = await Application.find({ userId: req.user.id }).sort({ appliedDate: -1 });
        res.json(apps);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /api/applications (Track new application)
router.post('/', ensureAuth, async (req, res) => {
    try {
        const { company, role, jobId, status } = req.body;

        const newApp = new Application({
            userId: req.user.id,
            company,
            role,
            jobId, // Optional
            status: status || 'Applied'
        });

        await newApp.save();
        res.status(201).json(newApp);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
