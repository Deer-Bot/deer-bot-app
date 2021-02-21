import RedisManager from './redis-manager';
import ApiClient from '../api/api-client';

export default class EventMessageManager {
  private static client = RedisManager.getInstance();
  private static db = RedisManager.MessageEvent;

  static async get(messageId: string): Promise<string> {
    if (messageId == undefined) {
      throw new Error('Argument messageId cannot be undefined');
    }

    let eventId = await EventMessageManager.client.get(messageId, EventMessageManager.db) as string;
    if (eventId == null) {
      // Lettura dell'id dal db
      const {event} = await ApiClient.get('getEventByMessage', {messageId: messageId});
      if (event == null) {
        return null;
      }

      eventId = event.id;
    }

    // Set nella cache
    await EventMessageManager.client.set(messageId, eventId, EventMessageManager.db);

    return eventId;
  }

  // Salva l'id dell'evento nel db e aggiorna la cache
  static async set(messageId: string, eventId: string, guildId: string): Promise<void> {
    // Salva l'id nel db
    await ApiClient.post(`setMessage`, {messageId: messageId, eventId: eventId, guildId: guildId});
    await EventMessageManager.client.set(messageId, eventId, EventMessageManager.db);
  }

  static async delete(messageId: string): Promise<void> {
    await EventMessageManager.client.del(messageId, EventMessageManager.db);
  }
}
