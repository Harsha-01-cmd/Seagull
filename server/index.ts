require('dotenv').config();
import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import passport from 'passport';
import { Strategy as GitHubStrategy } from 'passport-github2';
import session from 'express-session';
import { createClient } from 'redis';
import RedisStore from 'connect-redis';
import User, { IUser } from './models/User';

// Import Routes
import jobRoutes from './routes/jobs';
import applicationRoutes from './routes/applications';
import userRoutes from './routes/user';

const app = express();
const PORT = process.env.PORT || 5000;

// Redis Client for Session Store (Upstash requires TLS)
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const redisClient = createClient({
    url: redisUrl,
    socket: {
        tls: redisUrl.startsWith('rediss://') || redisUrl.includes('upstash.io'),
        rejectUnauthorized: false
    }
});
redisClient.on('error', (err) => console.log('Redis Client Error:', err.message));
redisClient.connect().catch((err) => console.log('Redis Connect Error:', err.message));

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());

// Database
mongoose.connect(process.env.MONGO_URI as string, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
} as mongoose.ConnectOptions)
    .then(() => console.log('MongoDB Connected'))
    .catch((err: Error) => console.error('MongoDB Config Error:', err));

// Auth Setup
app.set('trust proxy', 1); // Trust first proxy (Render/Vercel)
app.use(session({
    store: new RedisStore({ client: redisClient }),
    secret: process.env.SESSION_SECRET || 'secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // Secure in production
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // None for cross-site
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user: any, done) => done(null, user.id));
passport.deserializeUser((id: string, done) => {
    User.findById(id).then(user => done(null, user));
});

passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID || 'dummy_id',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || 'dummy_secret',
    callbackURL: `${process.env.SERVER_URL || 'http://localhost:5000'}/auth/github/callback`
},
    async (accessToken: string, refreshToken: string, profile: any, done: Function) => {
        try {
            console.log('GitHub Profile Found:', profile.username);
            let user = await User.findOne({ githubId: profile.id });
            if (!user) {
                user = await new User({
                    githubId: profile.id,
                    username: profile.username,
                    displayName: profile.displayName,
                    avatarUrl: profile.photos[0].value,
                    email: profile.emails ? profile.emails[0].value : ''
                }).save();
            }
            return done(null, user);
        } catch (err) {
            console.error('GitHub Auth Error:', err);
            return done(err, null);
        }
    }
));

// Routes
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/user', userRoutes);
app.get('/', (req: Request, res: Response) => { res.send('Job Portal API Running') });

// Auth Routes
app.get('/auth/github', passport.authenticate('github', { scope: ['user:email'] }));

app.get('/auth/github/callback',
    passport.authenticate('github', { failureRedirect: '/login' }),
    (req: Request, res: Response) => {
        res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard`);
    }
);

app.get('/auth/user', (req: Request, res: Response) => {
    res.json(req.user || null);
});

app.get('/auth/logout', (req: Request, res: Response, next: NextFunction) => {
    req.logout((err) => {
        if (err) return next(err);
        res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}`);
    });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
