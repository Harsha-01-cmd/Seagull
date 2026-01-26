const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const redis = require('redis');

// Redis Client Setup
const redisClient = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});

(async () => {
    redisClient.on('error', (err) => console.log('Redis Client Error', err));
    await redisClient.connect();
})();

// GET /api/jobs
router.get('/', async (req, res) => {
    try {
        // Check Cache
        const cachedJobs = await redisClient.get('jobs:latest');
        if (cachedJobs) {
            console.log('Serving from Redis Cache');
            return res.json(JSON.parse(cachedJobs));
        }

        // Fetch from DB
        const jobs = await Job.find().sort({ postedDate: -1 }).limit(50);

        // Save to Cache (1 hour expiry)
        await redisClient.set('jobs:latest', JSON.stringify(jobs), {
            EX: 3600
        });

        res.json(jobs);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// POST /api/jobs (For scraper to push data)
router.post('/', async (req, res) => {
    try {
        const { title, company, applyLink } = req.body;
        // Simple deduplication check
        let existing = await Job.findOne({ applyLink });
        if (existing) return res.status(200).json({ message: 'Job already exists' });

        const newJob = new Job(req.body);
        await newJob.save();

        // Invalidate Cache
        await redisClient.del('jobs:latest');

        res.status(201).json(newJob);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
