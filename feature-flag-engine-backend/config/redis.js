const { createClient } = require('redis');

const redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://127.0.0.1:6379'
});

const redisSubscriber = createClient({
    url: process.env.REDIS_URL || 'redis://127.0.0.1:6379'
});

let redisClientErrorLogged = false;
let redisSubErrorLogged = false;

redisClient.on('error', (err) => {
    if (!redisClientErrorLogged) {
        console.warn('⚠️ Redis Client: Unable to connect (running without Redis cache/realtime updates).');
        redisClientErrorLogged = true;
    }
});

redisSubscriber.on('error', (err) => {
    if (!redisSubErrorLogged) {
        console.warn('⚠️ Redis Subscriber: Unable to connect (running without Redis cache/realtime updates).');
        redisSubErrorLogged = true;
    }
});

const connectRedis = async () => {
    try {
        await redisClient.connect();
        await redisSubscriber.connect();
        console.log('⚡ Redis Cache & Subscriber Nodes Connected');
    } catch (err) {
        // Errors are already caught by the 'error' event listeners above
    }
};

module.exports = { redisClient, redisSubscriber, connectRedis };