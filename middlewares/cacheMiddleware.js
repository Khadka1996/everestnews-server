const redis = require('redis');
const client = redis.createClient();

const getCache = (key) => {
  return new Promise((resolve, reject) => {
    // Check if Redis client is connected before trying to access it
    if (!client.connected) {
      return reject(new Error('Redis client is not connected.'));
    }

    client.get(key, (err, data) => {
      if (err) reject(err);
      resolve(data);
    });
  });
};

const setCache = (key, value, expiration = 3600) => {
  if (!client.connected) {
    return Promise.reject(new Error('Redis client is not connected.'));
  }

  return new Promise((resolve, reject) => {
    client.setex(key, expiration, JSON.stringify(value), (err) => {
      if (err) reject(err);
      resolve();
    });
  });
};

module.exports = { getCache, setCache };
