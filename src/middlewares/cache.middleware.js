const redis = require('../config/redis');

const cache = (duration) => {
    return async (req, res, next) => {
        console.log("duration",duration)
         console.log("request ",req)
         console.log("response ",res)
        // Create unique key from URL + query params
        const key = `cache:${req.originalUrl}`;

        try {
            // Check if data exists in cache
            const cachedData = await redis.get(key);
          
            if (cachedData) {
                console.log('Cache HIT:', key);
                return res.status(200).json(JSON.parse(cachedData));
            }

            console.log('Cache MISS:', key);

            // Override res.json to store response in cache
            const originalJson = res.json.bind(res);
            res.json = async (data) => {
                // Store in cache with expiry
                await redis.setex(key, duration, JSON.stringify(data));
                return originalJson(data);
            };

            next();

        } catch (error) {
            // If Redis fails → just continue without cache
            console.error('Cache error:', error);
            next();
        }
    };
};

// Clear cache by pattern
const clearCache = async (pattern) => {
    try {
        const keys = await redis.keys(`cache:${pattern}`);
        if (keys.length > 0) {
            await redis.del(...keys);
            console.log('Cache cleared:', keys);
        }
    } catch (error) {
        console.error('Clear cache error:', error);
    }
};

module.exports = { cache, clearCache };