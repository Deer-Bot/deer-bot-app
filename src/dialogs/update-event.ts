import InputValidator from '../common/input-validator';
import ApiClient from '../api/api-client';
import Dialog from '../base/dialog';
import ConversationManager, {Event, UserConversation} from '../cache/conversation-manager';
import MessageDecorator from '../common/message-decorator';
import {TextChannel} from 'discord.js';
import EventMessageManager from '../cache/event-message-manager';
import GuildInfoManager from '../cache/guild-info-manager';

export enum Steps {
  SelectEvent = 0,
  ChooseActions,
  ChangeTitle,
  ChangeDescription,
  ChangeDate,
  ChangeTime,
  ChangeGlobalReminder,
  ChangePrivateReminder,
  ConfirmDelete
}

const pageSize = 5;

export default class UpdateEventDialog extends Dialog {
  constructor() {
    super();
    this.type = 'update';
  }

  static async start(message: EnrichedMessage): Promise<void> {
    const conversation: UserConversation = {
      type: 'update',
      step: Steps.SelectEvent,
      valid: true,
    };

    // Chiama la Function per prendere gli eventi dell'utente
    const {events, hasNext}: {events: Event[], hasNext: boolean} = await ApiClient.get(`getEvents`, {
      authorId: message.author.id,
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

      await ConversationManager.create(message.author.id, conversation);
    } else {
      message.author.send(MessageDecorator.noEventList());
      conversation.valid = false;
    }
  }

  async run(message: EnrichedMessage, conversation: UserConversation): Promise<void> {
    let [event] = conversation.events;
    const trimmedMessage = message.content.trim();
    let timezoneOffset;
    let result;

    switch (conversation.step) {
      case Steps.SelectEvent:
        if (MessageDecorator.numberEmoji.includes(message.reaction.toString())) { // numero
          const index = MessageDecorator.numberEmoji.indexOf(message.reaction.toString());
          if (conversation.events[index] == undefined) {
            return;
          }
          event = conversation.events[index];
          if (event.channelId === GuildInfoManager.unspecifiedChannel) {
            message.channel.send(MessageDecorator.commandError('An event broadcasting channel must be set in the server before updating this event, use the `channel` command and re-run the `update` command.'));
            return;
          }

          conversation.events = [conversation.events[index]];
          await this.sendSelectedEvent(message, conversation);
          return;
        } else if (((message.reaction.toString() === MessageDecorator.nextEmoji && conversation.hasNext) ||
          (message.reaction.toString() === MessageDecorator.prevEmoji && conversation.offset > 0))) {
          conversation.offset += (message.reaction.toString() === MessageDecorator.nextEmoji) ? pageSize : -pageSize; // avanti o indietro
          const {events, hasNext}: {events: Event[], hasNext: boolean} = await ApiClient.get(`getEvents`, {
            authorId: conversation.events[0].authorId,
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
        if (MessageDecorator.fieldsEmoji.includes(message.reaction.toString())) {
          const index = MessageDecorator.fieldsEmoji.indexOf(message.reaction.toString());
          switch (index) {
            case 0:
              await message.channel.send(MessageDecorator.inputTitle());
              conversation.step = Steps.ChangeTitle;
              break;
            case 1:
              await message.channel.send(MessageDecorator.inputDescription());
              conversation.step = Steps.ChangeDescription;
              break;
            case 2:
              await message.channel.send(MessageDecorator.inputDate());
              conversation.step = Steps.ChangeDate;
              break;
            case 3:
              await message.channel.send(MessageDecorator.inputTime());
              conversation.step = Steps.ChangeTime;
              break;
            case 4:
              await message.channel.send(MessageDecorator.inputGlobalReminder());
              conversation.step = Steps.ChangeGlobalReminder;
              break;
            case 5:
              await message.channel.send(MessageDecorator.inputPrivateReminder());
              conversation.step = Steps.ChangePrivateReminder;
              break;
          }
        } else if (MessageDecorator.confirmEmoji === message.reaction.toString()) {
          // Conferma
          // Ci assicuriamo che il channel in cui mandare l'evento sia quello corretto prima di inserirlo in DB
          const guildInfo = await GuildInfoManager.get(event.guildId);
          event.channelId = guildInfo.channelId;
          await ConversationManager.update(event.authorId, conversation);

          // Update event in DB
          const {eventId} = await ApiClient.post('setEvent', {userId: event.authorId});
          conversation.valid = false;

          // Get default channel and publish event
          const targetGuild = await message.client.guilds.fetch(event.guildId);
          const targetChannel = await targetGuild.channels.cache.get(guildInfo.channelId) as TextChannel;
          const publicEventMessage = await MessageDecorator.eventEmbed(message.client, event, false);

          const publishedEventMessage = await targetChannel.send(publicEventMessage);
          publishedEventMessage.react(MessageDecorator.confirmEmoji);
          await message.channel.send(MessageDecorator.okMessage());
          if (event.id) {
            await EventMessageManager.delete(event.messageInfo.messageId);
            const lastMessageChannel = await targetGuild.channels.cache.get(event.messageInfo.channelId);
            (lastMessageChannel as TextChannel).messages.delete(event.messageInfo.messageId)
                .catch((err) => {});
          }

          await EventMessageManager.set(publishedEventMessage.id, eventId, event.guildId);
        } else if (MessageDecorator.deleteEmoji === message.reaction.toString()) {
          // Elimina

          // Conferma elimina
          const confirmDeleteMessage = await message.channel.send(MessageDecorator.confirmRemoveEvent());
          confirmDeleteMessage.react(MessageDecorator.confirmEmoji)
              .then(() => confirmDeleteMessage.react(MessageDecorator.cancelEmoji));
          conversation.step = Steps.ConfirmDelete;
          conversation.messageId = confirmDeleteMessage.id;
        }
        break;

      case Steps.ConfirmDelete:
        if (MessageDecorator.confirmEmoji === message.reaction.toString()) {
          if (event.id) {
            await ApiClient.delete('deleteEvent', {userId: event.authorId});
          } else {
            await ConversationManager.delete(event.authorId);
          }
          conversation.valid = false;
          await message.channel.send(MessageDecorator.removedEventMessage());
        } else if (MessageDecorator.cancelEmoji === message.reaction.toString()) {
          await this.sendSelectedEvent(message, conversation);
        }
        break;

      case Steps.ChangeTitle:
        event.name = trimmedMessage;
        await this.sendSelectedEvent(message, conversation);
        break;

      case Steps.ChangeDescription:
        if (trimmedMessage.length > 2048) {
          await message.channel.send(MessageDecorator.inputDescription(false));
          break;
        }
        event.description = trimmedMessage;
        await this.sendSelectedEvent(message, conversation);
        break;
      case Steps.ChangeDate:
        const date = trimmedMessage;
        timezoneOffset = (await GuildInfoManager.get(event.guildId)).timezoneOffset;
        result = InputValidator.validateDateUpdate(date, new Date(event.date), timezoneOffset);

        if (result === 'patternError' || result === 'timeError') {
          await message.channel.send(MessageDecorator.inputDate(result));
          break;
        }

        event.date = result;
        event.localDate = MessageDecorator.formatDate(event.date, timezoneOffset);
        await this.sendSelectedEvent(message, conversation);
        break;

      case Steps.ChangeTime:
        const time = trimmedMessage;
        timezoneOffset = (await GuildInfoManager.get(event.guildId)).timezoneOffset;
        result = InputValidator.validateDateTimeUpdate(new Date(event.date), time, timezoneOffset);

        if (result === 'patternError' || result === 'timeError') {
          await message.channel.send(MessageDecorator.inputTime(result));
          break;
        }

        event.date = result;
        event.localDate = MessageDecorator.formatDate(event.date, timezoneOffset);
        await this.sendSelectedEvent(message, conversation);
        break;

      case Steps.ChangeGlobalReminder:
        const globalReminder = trimmedMessage;
        const globalReminderInt = Number.parseInt(globalReminder);
        if (!InputValidator.validateNumber(globalReminder) || globalReminderInt == NaN || globalReminderInt <= 0) {
          await message.channel.send(MessageDecorator.inputGlobalReminder('patternError'));
          break;
        }
        event.globalReminder = globalReminderInt;
        await this.sendSelectedEvent(message, conversation);
        break;

      case Steps.ChangePrivateReminder:
        const privateReminder = trimmedMessage;
        if (!InputValidator.validateTime(privateReminder)) {
          await message.channel.send(MessageDecorator.inputPrivateReminder('patternError'));
          break;
        }
        const [hours_, minutes_] = privateReminder.split(':');
        const min: number = Number.parseInt(hours_) * 60 + (minutes_ != undefined ? Number.parseInt(minutes_) : 0);
        event.privateReminder = min;
        await this.sendSelectedEvent(message, conversation);
        break;
    }
  }

  private async sendSelectedEvent(message: EnrichedMessage, conversation: UserConversation): Promise<void> {
    const embed = await MessageDecorator.eventEmbed(message.client, conversation.events[0], true);
    await message.channel.send('Selected event', embed);

    const updateMessage = await message.channel.send(MessageDecorator.updateEventEmbed());
    for (const emoji of MessageDecorator.fieldsEmoji) {
      updateMessage.react(emoji);
    }
    updateMessage.react(MessageDecorator.confirmEmoji);
    updateMessage.react(MessageDecorator.deleteEmoji);
    conversation.messageId = updateMessage.id;
    conversation.step = Steps.ChooseActions;
  }

  public messageBelongToDialog(message: EnrichedMessage, conversation: UserConversation): boolean {
    if (conversation.step === Steps.ChooseActions || conversation.step === Steps.SelectEvent) {
      return false;
    }

    return true;
  }
}
