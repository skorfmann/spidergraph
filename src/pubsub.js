import { RedisPubSub } from "graphql-redis-subscriptions";

const Redis = require("ioredis");

// Instantiate Redis clients
const options = {
  host: 'localhost',
  port: 6379,
  retry_strategy: options => {
    // reconnect after
    return Math.max(2 * 100, 3000);
  }
};

const pubsub = new RedisPubSub({
  connection: options
});

const CHANNEL = `propertyAdded`;

export { pubsub, CHANNEL };
