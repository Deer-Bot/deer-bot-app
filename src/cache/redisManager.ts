'use strict';
import redis, {RedisClient} from 'redis';
import bluebird from 'bluebird';
import RedisDb from './db.js';

// Convert Redis client API to use promises, to make it usable with async/await syntax
// bluebird.promisifyAll(redis.RedisClient.prototype);
// bluebird.promisifyAll(redis.Multi.prototype);

const cacheConnection = redis.createClient({
  host: process.env.REDIS_HOSTNAME,
  port: process.env.REDIS_PORT as any as number,
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

interface Databases {
  [index: string]: RedisDb;
}

declare module 'redis' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface Commands<R> {
    set(key: string, value: string): Promise<'OK'>;
    get(key: string): Promise<string>;
    hgetall(key: string): Promise<Object>;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface OverloadedSetCommand<T, U, R> {
    (key: string, arg1: T | { [key: string]: T } | T[]): Promise<'OK'>
  }
}

export default class RedisManager {
  private client: RedisClient;
  private db: Databases;
  private static instance: RedisManager;
  public static readonly User = 'user';
  public static readonly Guild = 'guild';

  private constructor() {
    this.client = cacheConnection;
    this.db = {
      user: new RedisDb(0, 300, this.client.hgetall, this.client.hmset),
      guild: new RedisDb(1, 3600, this.client.get, this.client.set),
    };
  }

  public static getInstance(): RedisManager {
    if (!RedisManager.instance) {
      RedisManager.instance = new RedisManager();
    }

    return RedisManager.instance;
  }

  async set(key: string, value: Object, dbName: string): Promise<boolean> {
    const db = this.db[dbName];
    if (db === undefined) {
      throw new Error('Redis database not found');
    }

    await this.client.select(db.index);
    const result = await db.set(key, value);
    await this.client.expire(key, db.ttl);


    return result === 'OK';
  }

  async get(key: string, dbName: string): Promise<string | Object> {
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
