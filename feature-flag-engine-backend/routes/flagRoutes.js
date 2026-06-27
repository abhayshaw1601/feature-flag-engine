const router = require('express').Router();
const FeatureFlag = require('../models/FeatureFlag');
const { evaluateRules, isUserInRollout } = require('../utils/evaluator');
const { redisClient } = require('../config/redis');
const { redisSubscriber } = require('../config/redis');

// Keep track of active open connections to prevent memory leaks
let activeClients = [];

// Subscribe the main thread Redis instance to the channel once on boot
redisSubscriber.subscribe('flag-updates', (message) => {
    const parsedFlag = JSON.parse(message);

    // Broadcast the fresh configuration payload to every open client connection instantly
    activeClients.forEach(client => {
        client.res.write(`data: ${JSON.stringify(parsedFlag)}\n\n`);
    });
});

// 1. RUNTIME EVALUATION: Used by application clients to get flag statuses
router.post('/evaluate', async (req, res) => {
    try {
        const { userId, context = {} } = req.body;

        if (!userId) {
            return res.status(400).json({ error: "userId is required for evaluation" });
        }

        const activeFlags = await FeatureFlag.find({ isActive: true });
        const evaluatedFlags = {};

        activeFlags.forEach(flag => {
            // Check Whitelist Bypass first
            if (flag.whitelistedUsers && flag.whitelistedUsers.includes(userId)) {
                console.log(`🎯 Whitelist Match! Giving feature to ${userId} instantly.`);
                evaluatedFlags[flag.key] = true;
                return;
            }

            // Fallback to standard targeting rules + percentage rollout
            const passesTargeting = evaluateRules(flag.rules, context);
            if (passesTargeting) {
                evaluatedFlags[flag.key] = isUserInRollout(userId, flag.key, flag.rolloutPercentage);
            } else {
                evaluatedFlags[flag.key] = false;
            }
        });

        res.json({ flags: evaluatedFlags });
    } catch (err) {
        res.status(500).json({ error: "Evaluation Error", details: err.message });
    }
});

// 2. DASHBOARD MANAGEMENT: Fetch all flags
router.get('/', async (req, res) => {
    try {
        const flags = await FeatureFlag.find().sort({ createdAt: -1 });
        res.json(flags);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. DASHBOARD MANAGEMENT: Create a flag
router.post('/', async (req, res) => {
    try {
        const newFlag = new FeatureFlag(req.body);
        await newFlag.save();
        res.status(201).json(newFlag);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// 4. DASHBOARD MANAGEMENT: Update sliders, killswitches, or whitelists
// router.put('/:id', async (req, res) => {
//     try {
//         const updatedFlag = await FeatureFlag.findByIdAndUpdate(req.params.id, req.body, { new: true });
//         res.json(updatedFlag);
//     } catch (err) {
//         res.status(400).json({ error: err.message });
//     }
// });


// PUT: Update flag changes (Kill switch toggle, sliders, or whitelists)
// PUT: Update flag changes using the flag KEY (e.g., /api/v1/flags/new-dashboard-v2)
router.put('/:key', async (req, res) => {
    try {
        // Find by the human-readable 'key' instead of the long hex '_id'
        const updatedFlag = await FeatureFlag.findOneAndUpdate(
            { key: req.params.key },
            req.body,
            { returnDocument: 'after' } // Fixes the Mongoose warning shown in image_9c1b22.png!
        );

        if (!updatedFlag) {
            return res.status(404).json({ error: `Flag with key '${req.params.key}' not found.` });
        }

        // Publish to message bus
        await redisClient.publish('flag-updates', JSON.stringify(updatedFlag));
        console.log(`📢 Broadcasted update for flag key: ${updatedFlag.key}`);

        res.json(updatedFlag);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.get('/stream', (req, res) => {
    // Set essential standard headers to keep HTTP connection alive continuously
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders(); // Establish the immediate connection flush

    const clientId = Date.now();
    const newClient = { id: clientId, res };
    activeClients.push(newClient);

    console.log(`🔌 Client App Connected to SSE Stream. Total Active Pipelines: ${activeClients.length}`);

    // When a user closes their app or disconnects, clean up memory allocation
    req.on('close', () => {
        activeClients = activeClients.filter(client => client.id !== clientId);
        console.log(`Client App Disconnected. Remaining Active Pipelines: ${activeClients.length}`);
    });
});

module.exports = router;