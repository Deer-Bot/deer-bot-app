'use strict';
import RedisManager from './redis-manager';

interface AbstractUserConversation {
  type: 'create' | 'update' | 'delete',
  step: any,
  valid: any,
  messageId?: string,
  offset?: any,
  hasNext?: any,
  events?: any
}

export interface UserConversation extends AbstractUserConversation {
  step: number,
  valid: boolean,
  offset?: number,
  hasNext?: boolean,
  events?: Event[],
}

export interface Event {
  id?: string,
  author: string,
  guild: string,
  channel: string,
  messageId?: string,
  name?: string,
  description?: string,
  date?: Date | string,
  globalReminder?: number,
  privateReminder?: number,
  globalReminderDate?: Date | string,
  privateReminderDate?: Date | string,
}

export default class Session {
  private static client = RedisManager.getInstance();
  private static db = RedisManager.User;

  static async create(userId: string, value: UserConversation): Promise<void> {
    const flattened = flattenConversation(value);

    const result = await Session.client.set(userId, flattened, Session.db);

    if (result != true) {
      throw new Error('Could not write to Redis cache');
    }
  }

  static async get(userId: string): Promise<UserConversation> {
    const flatConversation = await Session.client.get(userId, Session.db);
    return enflateConversation(flatConversation as any as FlatUserConversation);
  }

  static async update(userId: string, value: UserConversation): Promise<void> {
    const flattened = flattenConversation(value);

    const result = await Session.client.set(userId, flattened, Session.db);
    if (result != true) {
      throw new Error('Could not write to Redis cache');
    }
  }

  static async delete(userId: string): Promise<void> {
    const result = await Session.client.del(userId, Session.db);
    if (result === 0) {
      throw new Error('Could not delete from Redis cache');
    }
  }
}

interface FlatUserConversation extends AbstractUserConversation {
  step: string,
  valid: string,
  offset?: string,
  hasNext?: string,
  events?: string,
}

function flattenConversation(conversation: UserConversation): FlatUserConversation {
  const flattened: AbstractUserConversation = conversation;

  flattened.step = flattened.step.toString();
  flattened.valid = flattened.valid.toString();
  if (conversation.events) {
    flattened.events = JSON.stringify(conversation.events);
  }
  if (conversation.offset !== undefined) {
    flattened.offset = flattened.offset.toString();
  }
  if (conversation.hasNext !== undefined) {
    flattened.hasNext = flattened.hasNext.toString();
  }

  return flattened as FlatUserConversation;
}

function enflateConversation(conversation: FlatUserConversation): UserConversation {
  let enflated: AbstractUserConversation = conversation;

  if (enflated != null && Object.keys(enflated).length > 0) {
    if (enflated.events) {
      enflated.events = JSON.parse(enflated.events);
    }
    if (enflated.offset) {
      enflated.offset = +enflated.offset;
    }
    if (enflated.hasNext) {
      enflated.hasNext = enflated.hasNext as any === 'true';
    }

    enflated.step = +enflated.step; // To convert string to number
    enflated.valid = enflated.valid as any === 'true';
  } else {
    enflated = null;
  }

  return enflated as UserConversation;
}
