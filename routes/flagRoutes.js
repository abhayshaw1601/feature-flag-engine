const router = require('express').Router();
const FeatureFlag = require('../models/FeatureFlag');
const { evaluateRules, isUserInRollout } = require('../utils/evaluator');

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
router.put('/:id', async (req, res) => {
    try {
        const updatedFlag = await FeatureFlag.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedFlag);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;