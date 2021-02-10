'use strict';
import RedisManager from './redis-manager';
import ApiClient from '../api/api-client';

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
      const data = await ApiClient.get('getGuild', {guild: key});
      prefix = data.guild?.prefix || Prefix.defaultPrefix;
    }
    // Set nella cache
    await Prefix.client.set(key, prefix, Prefix.db);

    return prefix;
  }

  // Save the prefix into the DB and update the cache
  static async set(key: string, value: string): Promise<void> {
    // Salva il prefix nel db
    await ApiClient.post(`setGuild`, {guild: key, prefix: value});
    await Prefix.client.set(key, value, Prefix.db);
  }
}
