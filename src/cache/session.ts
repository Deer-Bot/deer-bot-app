'use strict';
import RedisManager from './redisManager';

export default class Session {
  private static client = RedisManager.getInstance();
  private static db = RedisManager.User;

  static async create(userId: string, value: Object): Promise<boolean> {
    return Session.client.set(userId, value, Session.db);
  }

  static async get(userId: string): Promise<Object> {
    return Session.client.get(userId, Session.db);
  }

  static async update(userId: string, value: Object): Promise<boolean> {
    return Session.client.set(userId, value, Session.db);
  }
}
