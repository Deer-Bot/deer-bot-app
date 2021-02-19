import ConversationManager, {Event, UserConversation} from '../cache/conversation-manager';
import Dialog from '../base/dialog';
import ApiClient from '../api/api-client';
import MessageDecorator from '../common/message-decorator';
import {MessageEmbed} from 'discord.js';

const eventsPageSize = 5;
const participantsPageSize = 25;

export enum Steps {
  SelectEvent = 0,
  NavigateList
}


export default class ParticipantsDialog extends Dialog {
  constructor() {
    super();
    this.type = 'participants';
  }

  static async start(message: EnrichedMessage): Promise<void> {
    const conversation: UserConversation = {
      type: 'participants',
      step: Steps.SelectEvent,
      valid: true,
    };

    // Chiama la Function per prendere gli eventi dell'utente
    const {events, hasNext}: {events: Event[], hasNext: boolean} = await ApiClient.get(`getEvents`, {
      authorId: message.author.id,
      offset: 0,
      number: eventsPageSize,
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

      await ConversationManager.create(message.author.id, conversation);
    } else {
      message.author.send(MessageDecorator.noEventList());
      conversation.valid = false;
    }
  }

  async run(message: EnrichedMessage, conversation: UserConversation): Promise<void> {
    switch (conversation.step) {
      case Steps.SelectEvent:
        if (MessageDecorator.numberEmoji.includes(message.reaction.toString())) { // numero
          const index = MessageDecorator.numberEmoji.indexOf(message.reaction.toString());

          if (conversation.events[index] == undefined) {
            return;
          }

          conversation.events = [conversation.events[index]];
          conversation.offset = 0;
          const embed = await this.participantsListUpdate(message, conversation);
          const participantsListMessage = await message.channel.send(embed);

          if (conversation.hasNext && conversation.valid) {
            participantsListMessage.react(MessageDecorator.prevEmoji);
            participantsListMessage.react(MessageDecorator.nextEmoji);
          }

          conversation.messageId = participantsListMessage.id;

          return;
        } else if (((message.reaction.toString() === MessageDecorator.nextEmoji && conversation.hasNext) ||
          (message.reaction.toString() === MessageDecorator.prevEmoji && conversation.offset > 0))) {
          conversation.offset += (message.reaction.toString() === MessageDecorator.nextEmoji) ? eventsPageSize : -eventsPageSize; // avanti o indietro
          const {events, hasNext}: {events: Event[], hasNext: boolean} = await ApiClient.get(`getEvents`, {
            authorId: conversation.events[0].authorId,
            offset: conversation.offset,
            number: eventsPageSize,
          });

          conversation.events = events;
          conversation.hasNext = hasNext;

          const embed = await MessageDecorator.eventsList(message.client, events, Math.floor(conversation.offset / eventsPageSize) + 1);
          const listMessage = await message.edit(embed);

          conversation.messageId = listMessage.id;

          return;
        }
        break;
      case Steps.NavigateList:
        if (((message.reaction.toString() === MessageDecorator.nextEmoji && conversation.hasNext) ||
        (message.reaction.toString() === MessageDecorator.prevEmoji && conversation.offset > 0))) {
          conversation.offset += (message.reaction.toString() === MessageDecorator.nextEmoji) ? participantsPageSize : -participantsPageSize;
          const embed = await this.participantsListUpdate(message, conversation);
          await message.edit(embed);
        }
        break;
    }
  }

  messageBelongToDialog(message: EnrichedMessage, conversation: UserConversation): boolean {
    return false;
  }

  private async participantsListUpdate(message: EnrichedMessage, conversation: UserConversation): Promise<MessageEmbed> {
    const [event] = conversation.events;
    let embed;
    if (event.participants && event.participants.length > 0) {
      embed = await MessageDecorator.participantsList(message.client, event, conversation.offset, participantsPageSize);

      if (event.participants.length - conversation.offset > participantsPageSize) { // Controlla se c'è un'altra pagina
        conversation.hasNext = true;
      } else {
        conversation.hasNext = false;
      }

      conversation.step = Steps.NavigateList;
    } else {
      embed = MessageDecorator.noParticipantsList();

      await ConversationManager.delete(event.authorId);
      conversation.valid = false;
    }

    return embed;
  }
}
