'use strict';
import RedisManager from './redis-manager';
import ApiClient from '../api/api-client';

export interface GuildInfo {
  prefix?: string,
  timezoneOffset?: number
}

export default class GuildInfoManager {
  private static client = RedisManager.getInstance();
  private static db = RedisManager.GuildInfo;
  public static defaultPrefix = '!';
  public static defaultTimezone = 0;

  // Get the prefix for the server from DB and store it into the redis cache
  static async get(guildId: string): Promise<GuildInfo> {
    if (guildId == undefined) {
      return {
        prefix: GuildInfoManager.defaultPrefix,
        timezoneOffset: GuildInfoManager.defaultTimezone,
      };
    }

    const guildInfo = await GuildInfoManager.client.get(guildId, GuildInfoManager.db) as any as GuildInfo;

    if (Object.keys(guildInfo).length === 0) {
      // Lettura del prefix dal db
      const body = await ApiClient.get('getGuild', {guildId: guildId});
      guildInfo.prefix = body.guild?.prefix || GuildInfoManager.defaultPrefix;
      guildInfo.timezoneOffset = body.guild?.timezoneOffset || GuildInfoManager.defaultTimezone;
    }
    // Set nella cache
    await GuildInfoManager.client.set(guildId, guildInfo, GuildInfoManager.db);

    guildInfo.timezoneOffset = +guildInfo.timezoneOffset;
    return guildInfo;
  }

  // Save the prefix into the DB and update the cache
  static async set(guildId: string, guildInfo: GuildInfo): Promise<void> {
    // Salva il prefix in cache e poi in db
    await GuildInfoManager.client.set(guildId, guildInfo, GuildInfoManager.db);
    await ApiClient.post(`setGuild`, {guildId: guildId, prefix: guildInfo.prefix, timezoneOffset: guildInfo.timezoneOffset});
  }
}
