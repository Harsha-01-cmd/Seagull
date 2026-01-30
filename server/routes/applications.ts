import express, { Request, Response, NextFunction } from 'express';
import Application from '../models/Application';
import { IUser } from '../models/User';

const router = express.Router();

// Middleware to check auth
const ensureAuth = (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated()) return next();
    res.status(401).json({ message: 'Unauthorized' });
};

// GET /api/applications (My Applications)
router.get('/', ensureAuth, async (req: Request, res: Response) => {
    try {
        const user = req.user as IUser;
        const apps = await Application.find({ userId: user.id }).sort({ appliedDate: -1 });
        res.json(apps);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

// POST /api/applications (Track new application)
router.post('/', ensureAuth, async (req: Request, res: Response) => {
    try {
        const { company, role, jobId, status } = req.body;
        const user = req.user as IUser;

        const newApp = new Application({
            userId: user.id,
            company,
            role,
            jobId, // Optional
            status: status || 'Applied'
        });

        await newApp.save();
        res.status(201).json(newApp);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
