require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const flagRoutes = require('./routes/flagRoutes');

const app = express();
app.use(express.json());

// Enable CORS for Next.js control plane access
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE']
}));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/feature_flags')
    .then(() => console.log('🎯 MongoDB Bound Securely'))
    .catch(err => console.error('Database Connection Failure:', err));

// redis connection 
const { connectRedis } = require('./config/redis');
connectRedis();

// Mount Routes
app.use('/api/v1/flags', flagRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Core Engine active on port ${PORT}`));