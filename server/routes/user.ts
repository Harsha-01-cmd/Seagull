import express, { Request, Response, NextFunction } from 'express';
import User, { IUser } from '../models/User';

const router = express.Router();

// Middleware
const ensureAuth = (req: Request, res: Response, next: NextFunction) => {
    // Check session or dev bypass
    if (req.isAuthenticated() || req.user) return next();
    res.status(401).json({ message: 'Unauthorized' });
};

// POST /api/user/resume - Save extracted resume text
router.post('/resume', ensureAuth, async (req: Request, res: Response) => {
    try {
        const { resumeText } = req.body;
        const user = req.user as IUser; // Type assertion

        // Update user
        const updatedUser = await User.findByIdAndUpdate(
            user.id,
            {
                $set: {
                    resumeText: resumeText,
                    resumeUploadedAt: new Date()
                }
            },
            { new: true }
        );

        res.json(updatedUser);
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

// GET /api/user/profile - Get current profile data
router.get('/profile', ensureAuth, async (req: Request, res: Response) => {
    try {
        const user = req.user as IUser;
        const profile = await User.findById(user.id);
        res.json(profile);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
