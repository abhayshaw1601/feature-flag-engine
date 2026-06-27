const crypto = require('crypto');

/**
 * Deterministically decides if a user falls within a rollout percentage slot.
 */
function isUserInRollout(userId, flagKey, percentage) {
    if (percentage === 0) return false;
    if (percentage === 100) return true;

    const hashInput = `${userId}:${flagKey}`;
    const hashHex = crypto.createHash('md5').update(hashInput).digest('hex');
    const hashInt = parseInt(hashHex.substring(0, 8), 16);
    const userScore = hashInt % 100;

    console.log(`\n--- 🎲 Hashing Check for ${userId} ---`);
    console.log(`User Score: ${userScore} | Target Threshold: < ${percentage}`);

    return userScore < percentage;
}

/**
 * Evaluates whether a specific user context satisfies targeting constraints.
 */
function evaluateRules(rules, context) {
    console.log(`\n--- 🎯 Targeting Rule Check ---`);
    console.log(`User Context:`, context);

    for (const rule of rules) {
        const userValue = context[rule.attribute];

        if (rule.operator === 'EQUALS' && userValue !== rule.value) {
            console.log(`❌ Rule Failed: ${rule.attribute} ('${userValue}') !== '${rule.value}'`);
            return false;
        }
        if (rule.operator === 'NOT_EQUALS' && userValue === rule.value) {
            console.log(`❌ Rule Failed: ${rule.attribute} ('${userValue}') === '${rule.value}'`);
            return false;
        }
    }
    console.log(`✅ Targeting Rules Passed! Moving to hashing...`);
    return true;
}

module.exports = { isUserInRollout, evaluateRules };