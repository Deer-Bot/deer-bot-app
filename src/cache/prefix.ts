'use strict';
import RedisManager from './redis-manager';
import ApiClient from '../api/api-client';

// TODO:
export default class Prefix {
  private static client = RedisManager.getInstance();
  private static db = RedisManager.Guild;
  public static defaultPrefix = '!';

  // Get the prefix for the server from DB and store it into the redis cache
  static async get(guildId: string): Promise<string> {
    if (guildId == undefined) {
      return Prefix.defaultPrefix;
    }

    let prefix = await Prefix.client.get(guildId, Prefix.db) as string;
    if (prefix == null) {
      // Lettura del prefix dal db
      const body = await ApiClient.get('getGuild', {guild: guildId});
      prefix = body.guild?.prefix || Prefix.defaultPrefix;
    }
    // Set nella cache
    await Prefix.client.set(guildId, prefix, Prefix.db);

    return prefix;
  }

  // Save the prefix into the DB and update the cache
  static async set(guildId: string, prefix: string): Promise<void> {
    // Salva il prefix nel db
    await ApiClient.post(`setGuild`, {guild: guildId, prefix: prefix});
    await Prefix.client.set(guildId, prefix, Prefix.db);
  }
}
