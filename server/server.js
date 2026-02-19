'use strict';
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();

/* ---- Security Middleware ---- */
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_ORIGIN || '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));
app.use(express.json({ limit: '10kb' }));

/* ---- Rate Limiting ---- */
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests. Please try again in 15 minutes.' }
});
app.use('/api/', apiLimiter);

/* ---- API Routes ---- */
app.use('/api/apply', require('./routes/apply'));
app.use('/api/volunteer', require('./routes/volunteer'));
app.use('/api/contact', require('./routes/contact'));

/* ---- Health Check ---- */
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});

/* ---- Root ---- */
app.get('/', (req, res) => {
    res.json({ message: 'JusticeVAWA API is running ✅', version: '1.0.0' });
});

/* ---- 404 for unknown routes ---- */
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found.' });
});

/* ---- Error Handler ---- */
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error.' });
});

/* ---- Connect MongoDB & Start ---- */
const PORT = process.env.PORT || 3000;

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log('✅ MongoDB connected');
        app.listen(PORT, () => {
            console.log(`🚀 JusticeVAWA API running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('❌ MongoDB connection failed:', err.message);
        process.exit(1);
    });
