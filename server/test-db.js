require('dotenv').config();
const mongoose = require('mongoose');

const uri = process.env.MONGO_URI;
console.log("Testing Connection to:", uri.replace(/:([^:@]{1,})@/, ':****@')); // Hide password

mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000, // Fail fast
    socketTimeoutMS: 45000,
})
    .then(() => {
        console.log('✅ SUCCESS: Connected to MongoDB Atlas!');
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ FAILED:', err.name);
        console.error('Reason:', err.reason);
        console.error('Full Error:', err);
        process.exit(1);
    });
