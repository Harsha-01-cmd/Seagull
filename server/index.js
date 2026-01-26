require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const session = require('express-session');
const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());

// Database
mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
})
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB Config Error:', err));

// Auth Setup
app.use(session({ secret: 'secret_key', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => {
    User.findById(id).then(user => done(null, user));
});

passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID || 'dummy_id',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || 'dummy_secret',
    callbackURL: "http://localhost:5000/auth/github/callback"
},
    async (accessToken, refreshToken, profile, done) => {
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
const jobRoutes = require('./routes/jobs');
const applicationRoutes = require('./routes/applications');
const userRoutes = require('./routes/user');
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/user', userRoutes);
app.get('/', (req, res) => res.send('Job Portal API Running'));

// Auth Routes
app.get('/auth/github', passport.authenticate('github', { scope: ['user:email'] }));

app.get('/auth/github/callback',
    passport.authenticate('github', { failureRedirect: '/login' }),
    (req, res) => {
        res.redirect('http://localhost:3000/dashboard');
    }
);

app.get('/auth/user', (req, res) => {
    res.json(req.user || null);
});

app.get('/auth/logout', (req, res) => {
    req.logout(() => {
        res.redirect('http://localhost:3000');
    });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
