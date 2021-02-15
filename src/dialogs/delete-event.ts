import ApiClient from '../api/api-client';
import Dialog from '../base/dialog';
import Session, {Event, UserConversation} from '../cache/session';
import MessageDecorator from '../common/message-decorator';

export enum Steps {
  SelectEvent = 0,
  ChooseActions,
  ConfirmDelete
}

const pageSize = 5;

export default class DeleteEventDialog extends Dialog {
  constructor() {
    super();
    this.type = 'delete';
  }

  static async start(message: EnrichedMessage): Promise<void> {
    const conversation: UserConversation = {
      type: 'delete',
      step: Steps.SelectEvent,
      valid: true,
    };

    // Chiama la Function per prendere gli eventi dell'utente
    const {events, hasNext}: {events: Event[], hasNext: boolean} = await ApiClient.get(`getEvents`, {
      author: message.author.id,
      offset: 0,
      number: pageSize,
    });

    if (events.length > 0) {
      conversation.events = events;
      conversation.offset = 0;
      conversation.hasNext = hasNext;

      const embed = await MessageDecorator.eventsList(message.client, events, 1);
      const listMessage = await message.author.send(embed);

      if (hasNext) {
        listMessage.react(MessageDecorator.prevEmoji);
      }

      for (let i = 0; i < events.length; i++) {
        listMessage.react(MessageDecorator.numberEmoji[i]);
      }

      if (hasNext) {
        listMessage.react(MessageDecorator.nextEmoji);
      }

      conversation.messageId = listMessage.id;

      await Session.create(message.author.id, conversation);
    } else {
      message.author.send(MessageDecorator.noEventList());
      conversation.valid = false;
    }
  }

  async run(message: EnrichedMessage, conversation: UserConversation): Promise<void> {
    const [event] = conversation.events;

    switch (conversation.step) {
      case Steps.SelectEvent:
        if (MessageDecorator.numberEmoji.includes(message.reaction.toString())) { // numero
          const index = MessageDecorator.numberEmoji.indexOf(message.reaction.toString());
          if (conversation.events[index] == undefined) {
            return;
          }
          conversation.events = [conversation.events[index]];
          await this.sendSelectedEvent(message, conversation);
          return;
        } else if (((message.reaction.toString() === MessageDecorator.nextEmoji && conversation.hasNext) ||
          (message.reaction.toString() === MessageDecorator.prevEmoji && conversation.offset > 0))) {
          conversation.offset += (message.reaction.toString() === MessageDecorator.nextEmoji) ? pageSize : -pageSize; // avanti o indietro
          const {events, hasNext}: {events: Event[], hasNext: boolean} = await ApiClient.get(`getEvents`, {
            author: conversation.events[0].author,
            offset: conversation.offset,
            number: pageSize,
          });

          conversation.events = events;
          conversation.hasNext = hasNext;

          const embed = await MessageDecorator.eventsList(message.client, events, Math.floor(conversation.offset / pageSize) + 1);
          const listMessage = await message.edit(embed);

          conversation.messageId = listMessage.id;
          return;
        }

      case Steps.ChooseActions:

        if (MessageDecorator.cancelEmoji === message.reaction.toString()) {
          await Session.delete(event.author);
          conversation.valid = false;
          await message.channel.send(MessageDecorator.message('Nothing has happened.'));
        } else if (MessageDecorator.deleteEmoji === message.reaction.toString()) {
          // Conferma elimina
          const confirmDeleteMessage = await message.channel.send(MessageDecorator.confirmRemoveEvent());
          confirmDeleteMessage.react(MessageDecorator.confirmEmoji)
              .then(() => confirmDeleteMessage.react(MessageDecorator.cancelEmoji));
          conversation.step = Steps.ConfirmDelete;
          conversation.messageId = confirmDeleteMessage.id;
        }
        break;

      case Steps.ConfirmDelete:
        // Elimina o annulla
        if (MessageDecorator.confirmEmoji === message.reaction.toString()) {
          if (event.id) {
            await ApiClient.delete('deleteEvent', {user: event.author});
          } else {
            await Session.delete(event.author);
          }
          conversation.valid = false;
          await message.channel.send(MessageDecorator.removedEventMessage());
        } else if (MessageDecorator.cancelEmoji === message.reaction.toString()) {
          await Session.delete(event.author);
          conversation.valid = false;
          await message.channel.send(MessageDecorator.message('Nothing has happened.'));
        }
        break;
    }
  }

  private async sendSelectedEvent(message: EnrichedMessage, conversation: UserConversation): Promise<void> {
    const embed = await MessageDecorator.eventEmbed(message.client, conversation.events[0], true);
    const deleteMessage = await message.channel.send(`Select the ${MessageDecorator.deleteEmoji} to delete the event or the ${MessageDecorator.cancelEmoji} to cancel.`, embed);

    deleteMessage.react(MessageDecorator.deleteEmoji);
    deleteMessage.react(MessageDecorator.cancelEmoji);
    conversation.messageId = deleteMessage.id;
    conversation.step = Steps.ChooseActions;
  }

  public messageBelongToDialog(message: EnrichedMessage, conversation: UserConversation): boolean {
    return false;
  }
}
