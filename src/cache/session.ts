'use strict';
import RedisManager from './redis-manager';

export interface Event {
  id?: string,
  author: string,
  guild: string,
  name?: string,
  description?: string,
  date?: Date | string,
  globalReminder?: number,
  privateReminder?: number,
  globalReminderDate?: Date | string,
  privateReminderDate?: Date | string,
}

export interface UserConversation {
  type: 'create' | 'update' | 'delete',
  step: number,
  messageId?: string,
  offset?: number,
  hasNext?: boolean,
  events?: Event[],
}

export default class Session {
  private static client = RedisManager.getInstance();
  private static db = RedisManager.User;

  static async create(userId: string, value: UserConversation): Promise<void> {
    if (value.events) {
      value.events = JSON.stringify(value.events) as any;
    }

    const result = await Session.client.set(userId, value, Session.db);
    if (result != true) {
      throw new Error('Could not write to Redis cache');
    }
  }

  static async get(userId: string): Promise<UserConversation> {
    const conversation = await Session.client.get(userId, Session.db) as UserConversation;
    if (conversation != null) {
      if (conversation.events) {
        conversation.events = JSON.parse(conversation.events as any as string);
      }
      if (conversation.offset) {
        conversation.offset = +conversation.offset;
      }
      conversation.step = +conversation.step; // To convert string to number
    }

    return conversation;
  }

  static async update(userId: string, value: UserConversation): Promise<void> {
    if (value.events) {
      value.events = JSON.stringify(value.events) as any;
    }

    const result = await Session.client.set(userId, value, Session.db);
    if (result != true) {
      throw new Error('Could not write to Redis cache');
    }
  }
}
