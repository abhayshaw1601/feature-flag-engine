const mongoose = require('mongoose');

const FeatureFlagSchema = new mongoose.Schema({
    key: {
        type: String,
        unique: true,
        required: true,
        index: true
    },
    description: { type: String },
    isActive: { type: Boolean, default: false },        // Global Kill-Switch
    rolloutPercentage: { type: Number, default: 0 },    // 0 to 100%
    whitelistedUsers: [{ type: String }],               // Target Whitelist (Overrides)
    rules: [{
        attribute: { type: String, required: true },       // e.g., 'country'
        operator: { type: String, enum: ['EQUALS', 'NOT_EQUALS'], required: true },
        value: { type: String, required: true }            // e.g., 'IN'
    }]
}, { timestamps: true });

module.exports = mongoose.model('FeatureFlag', FeatureFlagSchema);