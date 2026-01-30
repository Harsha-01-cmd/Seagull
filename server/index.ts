require('dotenv').config();
import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import passport from 'passport';
import { Strategy as GitHubStrategy } from 'passport-github2';
import session from 'express-session';
import User, { IUser } from './models/User';

// Import Routes
import jobRoutes from './routes/jobs';
import applicationRoutes from './routes/applications';
import userRoutes from './routes/user';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));

// ...

passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID || 'dummy_id',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || 'dummy_secret',
    callbackURL: `${process.env.SERVER_URL || 'http://localhost:5000'}/auth/github/callback`
},

    // ...

    app.get('/auth/github/callback',
        passport.authenticate('github', { failureRedirect: '/login' }),
        (req: Request, res: Response) => {
            res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard`);
        }
    );

// ...

app.get('/auth/logout', (req: Request, res: Response, next: NextFunction) => {
    req.logout((err) => {
        if (err) return next(err);
        res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}`);
    });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
