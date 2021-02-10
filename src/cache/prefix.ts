'use strict';
import RedisManager from './redisManager';
const axios = require('axios').default;
const endpoint = process.env.API_ENDPOINT;

export default class Prefix {
  private static client = RedisManager.getInstance();
  private static db = RedisManager.Guild;
  public static defaultPrefix = '!';

  // Get the prefix for the server from DB and store it into the redis cache
  static async get(key: string): Promise<string> {
    if (key == undefined) {
      return Prefix.defaultPrefix;
    }

    let prefix = await Prefix.client.get(key, Prefix.db) as string;
    if (prefix == null) {
      // Lettura del prefix dal db
      try {
        const res = await axios.get(`${endpoint}getGuild`, {
          params: {
            guild: key,
          },
        });
        if (res.status === 200) {
          prefix = res.data.guild.prefix;
        } else {
          prefix = Prefix.defaultPrefix;
        }
      } catch (err) {
        console.log(err);
      }
    }
    // Set nella cache
    await Prefix.client.set(key, prefix, Prefix.db);

    return prefix;
  }

  // Save the prefix into the DB and update the cache
  static async set(key: string, value: string): Promise<boolean> {
    // Salva il prefix nel db
    try {
      const res = await axios.post(`${endpoint}setGuild`, {guild: key, prefix: value});
      if (res.status === 200) {
        // Aggiorna il prefix nella cache
        return Prefix.client.set(key, value, Prefix.db);
      }
    } catch (err) {
      console.log(err);
    }

    return false;
  }
}
