const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Middleware
const ensureAuth = (req, res, next) => {
    // Check session or dev bypass
    if (req.isAuthenticated() || req.user) return next();
    res.status(401).json({ message: 'Unauthorized' });
};

// POST /api/user/resume - Save extracted resume text
router.post('/resume', ensureAuth, async (req, res) => {
    try {
        const { resumeText } = req.body;

        // Update user
        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            {
                $set: {
                    resumeText: resumeText,
                    resumeUploadedAt: new Date()
                }
            },
            { new: true }
        );

        res.json(updatedUser);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

// GET /api/user/profile - Get current profile data
router.get('/profile', ensureAuth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
