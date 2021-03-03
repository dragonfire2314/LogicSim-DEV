const session = require('express-session');
const connectRedis = require('connect-redis');
const redisClient = require('../database/redis');

const RedisStore = connectRedis(session);

module.exports = session({
    store: new RedisStore({client: redisClient}),
    secret: 'THIS_MUST_NOT_BE_KNOWN',
    saveUninitalized: false,
    name: 'cookie12',
    cookie: {
        secure: false, //Turn on for https only
        httpOnly: true, 
        maxAge: 1000 * 60 * 30 //30 Minutes
    }
});