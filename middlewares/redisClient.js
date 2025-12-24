// redisClient.js
const { createClient } = require('@redis/client');

const redisClient = createClient({
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
  }
});

// Connect to Redis
redisClient.connect()
  .then(() => {
    console.log('Connected to Redis');
  })
  .catch((err) => {
    console.error('Failed to connect to Redis:', err);
  });

module.exports = redisClient;
