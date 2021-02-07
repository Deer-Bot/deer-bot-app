const redis = require('redis');
const bluebird = require('bluebird');

// Convert Redis client API to use promises, to make it usable with async/await syntax
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

const cacheConnection = redis.createClient({
  host: process.env.REDIS_HOSTNAME,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_KEY,
//  tls: {servername: process.env.REDIS_HOSTNAME}, // Understand
});

class RedisManager {
  constructor() {
    this.client = cacheConnection;
    this.userDB = 0;
    this.guildDB = 1;
  }

  async set(key, value, dbIndex) {
    if (dbIndex > 1) {
      throw new Error('Wrong database index');
    }
    await this.client.selectAsync(dbIndex);

    return dbIndex == this.userDB ? this.client.hmsetAsync(key, value) : this.client.setAsync(key, value);
  }

  async get(key, dbIndex) {
    if (dbIndex > 1) {
      throw new Error('Wrong database index');
    }
    await this.client.selectAsync(dbIndex);

    return dbIndex == this.userDB ? this.client.hgetallAsync(key) : this.client.getAsync(key);
  }
}
const staticClient = new RedisManager();

module.exports = {
  client: staticClient,
  userDB: staticClient.userDB,
  guildDB: staticClient.guildDB,
};

