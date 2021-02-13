import ApiClient from '../api/api-client';
import Dialog from '../base/dialog';
import Session, {Event, UserConversation} from '../cache/session';
import MessageDecorator from '../common/message-decorator';

// const dateRegex = /^(?:(?:31(-)(?:0?[13578]|1[02]))\1|(?:(?:29|30)(-)(?:0?[13-9]|1[0-2])\2))(?:(?:1[6-9]|[2-9]\d)\d{2})$|^(?:29(-)0?2\3(?:(?:(?:1[6-9]|[2-9]\d)(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])00))))$|^(?:0?[1-9]|1\d|2[0-8])(-)(?:(?:0?[1-9])|(?:1[0-2]))\4(?:(?:1[6-9]|[2-9]\d)\d{2})$/;
// const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
// const numberRegex = /^\d+$/;

export default class UpdateEventDialog extends Dialog {
  constructor() {
    super();
    this.type = 'update';
  }

  static async start(message: EnrichedMessage): Promise<void> {
    const conversation: UserConversation = {
      type: 'update',
      step: 0,
    };

    // Chiama la Function per prendere gli eventi dell'utente
    const {events, hasNext}: {events: Event[], hasNext: boolean} = await ApiClient.get(`getEvents`, {author: message.author.id, offset: 0, number: 5});

    if (events.length > 0) {
      conversation.events = events;
      conversation.offset = 0;
      conversation.hasNext = hasNext;

      const embed = await MessageDecorator.eventsList(message.client, events);
      const listMessage = await message.author.send(embed);

      for (let i = 0; i < events.length; i++) {
        await listMessage.react(MessageDecorator.numberEmoji[i]);
      }
      if (hasNext) {
        await listMessage.react(MessageDecorator.nextEmoji);
      }

      conversation.messageId = listMessage.id;

      await Session.create(message.author.id, conversation);
    } else {
      message.author.send(MessageDecorator.noEventList());
    }
  }

  async run(message: EnrichedMessage, conversation: UserConversation): Promise<void> {
    let embed;

    switch (conversation.step) {
      case 0:
        if (MessageDecorator.numberEmoji.includes(message.reaction.toString())) { // numero
          const index = MessageDecorator.numberEmoji.indexOf(message.reaction.toString());
          if (conversation.events[index] == undefined) {
            return;
          }
          embed = await MessageDecorator.eventEmbed(message.client, conversation.events[index], true);
          await message.channel.send('Selected event', embed);

          const updateMessage = await message.channel.send(MessageDecorator.updateEventEmbed());
          for (const emoji of MessageDecorator.fieldsEmoji) {
            updateMessage.react(emoji);
          }
          updateMessage.react(MessageDecorator.confirmEmoji);
          updateMessage.react(MessageDecorator.deleteEmoji);
          conversation.messageId = updateMessage.id;
          conversation.step += 1;
        } else if (message.reaction.toString() === MessageDecorator.nextEmoji && conversation.hasNext) { // avanti
          return;
        } else if (message.reaction.toString() === MessageDecorator.prevEmoji && conversation.offset > 0) { // indietro
          return;
        } else {
          return;
        }
    }
  }

  messageBelongToDialog(message: EnrichedMessage, conversation: UserConversation): boolean {
    return false;
  }
}
