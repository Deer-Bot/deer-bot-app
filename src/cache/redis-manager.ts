import {TedisPool} from 'tedis';
import RedisDb from './redis-db.js';

const connectionPool = new TedisPool({
  host: process.env.REDIS_HOSTNAME,
  port: process.env.REDIS_PORT as any as number,
  password: process.env.REDIS_KEY,
  tls: {
    servername: process.env.REDIS_HOSTNAME,
  },
});

interface Databases {
  [index: string]: RedisDb;
}

export default class RedisManager {
  private pool: TedisPool;
  private db: Databases;
  private static instance: RedisManager;
  public static readonly Conversation = 'conversation';
  public static readonly GuildInfo = 'guildInfo';
  public static readonly MessageEvent = 'messageEvent';


  private constructor() {
    this.pool = connectionPool;
    this.db = {
      conversation: new RedisDb(0, 300, (key, tedis) => tedis.hgetall(key), (key, value, tedis) => tedis.hmset(key, value), (key, tedis) => tedis.del(key)),
      guildInfo: new RedisDb(1, 3600, (key, tedis) => tedis.hgetall(key), (key, value, tedis) => tedis.hmset(key, value), (key, tedis) => tedis.del(key)),
      messageEvent: new RedisDb(2, 3600, (key, tedis) => tedis.get(key), (key, value, tedis) => tedis.set(key, value), (key, tedis) => tedis.del(key)),
    };
  }

  public static getInstance(): RedisManager {
    if (!RedisManager.instance) {
      RedisManager.instance = new RedisManager();
    }

    return RedisManager.instance;
  }

  async set(key: string, value: Object, dbName: string): Promise<boolean> {
    const client = await this.pool.getTedis();
    const db = this.db[dbName];
    if (db === undefined) {
      throw new Error('Redis database not found');
    }

    await client.command('select', db.index);
    const result = await db.set(key, value, client);
    await client.expire(key, db.ttl);
    this.pool.putTedis(client);


    return result === 'OK';
  }

  async get(key: string, dbName: string): Promise< number | string | {[index: string]: string}> {
    const client = await this.pool.getTedis();
    const db = this.db[dbName];
    if (db === undefined) {
      throw new Error('Redis database not found');
    }

    await client.command('select', db.index);

    const result = await db.get(key, client);
    await client.expire(key, db.ttl);
    this.pool.putTedis(client);

    return result;
  }

  async del(key: string, dbName: string): Promise<number> {
    const client = await this.pool.getTedis();
    const db = this.db[dbName];
    if (db === undefined) {
      throw new Error('Redis database not found');
    }

    await client.command('select', db.index);
    const result = await db.del(key, client);
    this.pool.putTedis(client);

    return result;
  }
}
