'use strict';
import {Tedis} from 'tedis';
import RedisDb from './db.js';

const cacheConnection = new Tedis({
  host: process.env.REDIS_HOSTNAME,
  port: process.env.REDIS_PORT as any as number,
  password: process.env.REDIS_KEY,
  // set tls,
});

cacheConnection.get = cacheConnection.get.bind(cacheConnection);
cacheConnection.hgetall = cacheConnection.hgetall.bind(cacheConnection);
cacheConnection.set = cacheConnection.set.bind(cacheConnection);
cacheConnection.hmset = cacheConnection.hmset.bind(cacheConnection);
cacheConnection.del = cacheConnection.del.bind(cacheConnection);

interface Databases {
  [index: string]: RedisDb;
}

export default class RedisManager {
  private client: Tedis;
  private db: Databases;
  private static instance: RedisManager;
  public static readonly User = 'user';
  public static readonly Guild = 'guild';

  private constructor() {
    this.client = cacheConnection;
    this.db = {
      user: new RedisDb(0, 300, this.client.hgetall, this.client.hmset, this.client.del),
      guild: new RedisDb(1, 3600, this.client.get, this.client.set, this.client.del),
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

    await this.client.command('select', db.index);
    const result = await db.set(key, value);
    await this.client.expire(key, db.ttl);


    return result === 'OK';
  }

  async get(key: string, dbName: string): Promise< number | string | {[index: string]: string}> {
    const db = this.db[dbName];
    if (db === undefined) {
      throw new Error('Redis database not found');
    }

    await this.client.command('select', db.index);

    const result = await db.get(key);
    await this.client.expire(key, db.ttl);

    return result;
  }

  async del(key: string, dbName: string): Promise<number> {
    const db = this.db[dbName];
    if (db === undefined) {
      throw new Error('Redis database not found');
    }

    await this.client.command('select', db.index);
    return this.client.del(key);
  }
}
