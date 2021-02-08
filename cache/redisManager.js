'use strict';
const redis = require('redis');
const bluebird = require('bluebird');
const RedisDb = require('./db.js');

// Convert Redis client API to use promises, to make it usable with async/await syntax
// bluebird.promisifyAll(redis.RedisClient.prototype);
// bluebird.promisifyAll(redis.Multi.prototype);

const cacheConnection = redis.createClient({
  host: process.env.REDIS_HOSTNAME,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_KEY,
//  tls: {servername: process.env.REDIS_HOSTNAME}, // Understand
});

// Convert Redis client API to use promises, to make it usable with async/await syntax
cacheConnection.get = bluebird.promisify(cacheConnection.get).bind(cacheConnection);
cacheConnection.set = bluebird.promisify(cacheConnection.set).bind(cacheConnection);
cacheConnection.hgetall = bluebird.promisify(cacheConnection.hgetall).bind(cacheConnection);
cacheConnection.hmset = bluebird.promisify(cacheConnection.hmset).bind(cacheConnection);
cacheConnection.select = bluebird.promisify(cacheConnection.select).bind(cacheConnection);
cacheConnection.expire = bluebird.promisify(cacheConnection.expire).bind(cacheConnection);


class RedisManager {
  constructor() {
    this.client = cacheConnection;
    this.db = {
      user: new RedisDb(0, 300, this.client.hgetall, this.client.hmset),
      guild: new RedisDb(1, 3600, this.client.get, this.client.set),
    };
  }

  async set(key, value, dbName) {
    const db = this.db[dbName];
    if (db === undefined) {
      throw new Error('Redis database not found');
    }

    await this.client.select(db.index);
    const result = await db.set(key, value);
    await this.client.expire(key, db.ttl);

    return result;
  }

  async get(key, dbName) {
    const db = this.db[dbName];
    if (db === undefined) {
      throw new Error('Redis database not found');
    }

    await this.client.select(db.index);
    const result = await db.get(key);
    await this.client.expire(key, db.ttl);

    return result;
  }
}

// Costruzione oggetto da esportare
const staticClient = new RedisManager();
const exportObj = {
  client: staticClient,
};

const dbNames = Object.keys(staticClient.db);
for (dbName of dbNames) {
  exportObj[dbName] = dbName;
}

module.exports = exportObj;
