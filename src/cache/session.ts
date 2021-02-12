'use strict';
import RedisManager from './redis-manager';

export interface Event {
  author: string,
  guild: string,
  name?: string,
  description?: string,
  date?: string | Date,
  globalReminder?: number,
  privateReminder?: number,
}

export interface UserConversation {
  type: 'create' | 'update' | 'delete',
  step: number,
  event?: Event,
  messageId?: string
}

export default class Session {
  private static client = RedisManager.getInstance();
  private static db = RedisManager.User;

  static async create(userId: string, value: UserConversation): Promise<void> {
    value.event = JSON.stringify(value.event) as any;
    const result = await Session.client.set(userId, value, Session.db);
    if (result != true) {
      throw new Error('Could not write to Redis cache');
    }
  }

  static async get(userId: string): Promise<UserConversation> {
    const conversation = await Session.client.get(userId, Session.db) as UserConversation;
    if (conversation != null) {
      conversation.event = JSON.parse(conversation.event as any as string);
      conversation.step = +conversation.step; // To convert string to number
    }

    return conversation;
  }

  static async update(userId: string, value: UserConversation): Promise<void> {
    value.event = JSON.stringify(value.event) as any;
    const result = await Session.client.set(userId, value, Session.db);
    if (result != true) {
      throw new Error('Could not write to Redis cache');
    }
  }
}
