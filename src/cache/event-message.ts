'use strict';
import ApiClient from '../api/api-client';
import RedisManager from './redis-manager';


export default class EventMessage {
  private static client = RedisManager.getInstance();
  private static db = RedisManager.Message;

  static async get(messageId: string): Promise<string> {
    if (messageId == undefined) {
      throw new Error('Argument messageId cannot be undefined');
    }

    let eventId = await EventMessage.client.get(messageId, EventMessage.db) as string;
    if (eventId == null) {
      // Lettura dell'id dal db
      const {event} = await ApiClient.get('getEventByMessage', {messageId: messageId});
      if (event == null) {
        return null;
      }

      eventId = event.id;
    }

    // Set nella cache
    await EventMessage.client.set(messageId, eventId, EventMessage.db);

    return eventId;
  }

  // Salva l'id dell'evento nel db e aggiorna la cache
  static async set(messageId: string, eventId: string, authorId: string): Promise<void> {
    // Salva l'id nel db
    await ApiClient.post(`setMessage`, {messageId: messageId, eventId: eventId, authorId: authorId});
    await EventMessage.client.set(messageId, eventId, EventMessage.db);
  }

  static async delete(messageId: string): Promise<void> {
    await EventMessage.client.del(messageId, EventMessage.db);
  }
}
