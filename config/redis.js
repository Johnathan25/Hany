const { createClient } = require("redis");


// Create a Redis client with the URL from the environment variable
const redisClient = createClient({
  url: process.env.REDIS_URL,
});


// if error accur alert (notify) me
redisClient.on("error", (err) => {
  console.error("Redis Client Error:", err);
});

const connectRedis = async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
    console.log("Redis connected successfully");
  }
};

module.exports = {
  redisClient,
  connectRedis,
};