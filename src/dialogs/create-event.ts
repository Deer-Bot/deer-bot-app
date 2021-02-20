import {TextChannel} from 'discord.js';
import InputValidator from '../common/input-validator';
import ApiClient from '../api/api-client';
import Dialog from '../base/dialog';
import ConversationManager, {UserConversation} from '../cache/conversation-manager';
import MessageDecorator from '../common/message-decorator';
import {Steps as UpdateSteps} from './update-event';
import EventMessageManager from '../cache/event-message-manager';
import GuildInfoManager from '../cache/guild-info-manager';


enum Steps {
  EnterTitle = 0,
  EnterDescription,
  EnterDate,
  EnterTime,
  EnterGlobalReminder,
  EnterPrivateReminder,
  ChooseAction,
  ConfirmDelete
}

export default class CreateEventDialog extends Dialog {
  constructor() {
    super();
    this.type = 'create';
  }

  static async start(message: EnrichedMessage, guildId: string): Promise<void> {
    const {guild} = await ApiClient.get('getGuild', {guildId: guildId});
    const conversation: UserConversation = {
      type: 'create',
      step: Steps.EnterTitle,
      valid: true,
      events: [
        {
          guildId: guildId,
          authorId: message.author.id,
          channelId: guild.channelId,
        },
      ],
    };
    await ConversationManager.create(message.author.id, conversation);
    await message.author.send(MessageDecorator.inputTitle());
    await message.reply(MessageDecorator.message('Check your DMs.'));
  }

  async run(message: EnrichedMessage, conversation: UserConversation): Promise<void> {
    let timezoneOffset: number;
    const trimmedMessage = message.content.trim();
    const event = conversation.events[0];

    switch (conversation.step) {
      case Steps.EnterTitle:
        event.name = trimmedMessage;
        await message.author.send(MessageDecorator.inputDescription());
        conversation.step = Steps.EnterDescription;
        break;

      case Steps.EnterDescription:
        if (trimmedMessage.length > 2048) {
          await message.author.send(MessageDecorator.inputDescription(false));
          break;
        }
        event.description = trimmedMessage;
        await message.author.send(MessageDecorator.inputDate());
        conversation.step = Steps.EnterDate;
        break;

      case Steps.EnterDate:
        const date = trimmedMessage;
        timezoneOffset = (await GuildInfoManager.get(event.guildId)).timezoneOffset;
        const status = InputValidator.validateDate(date, timezoneOffset);
        if (status !== 'ok') {
          await message.author.send(MessageDecorator.inputDate(status));
          break;
        }

        event.date = date;
        await message.author.send(MessageDecorator.inputTime());
        conversation.step = Steps.EnterTime;
        break;

      case Steps.EnterTime:
        const time = trimmedMessage;
        timezoneOffset = (await GuildInfoManager.get(event.guildId)).timezoneOffset;
        const result = InputValidator.validateDateTime(event.date as string, time, timezoneOffset);
        if (result === 'patternError' || result === 'timeError') {
          await message.author.send(MessageDecorator.inputTime(result));
          break;
        }

        event.date = result;
        event.localDate = MessageDecorator.formatDate(event.date, timezoneOffset);
        await message.author.send(MessageDecorator.inputGlobalReminder());
        conversation.step = Steps.EnterGlobalReminder;
        break;

      case Steps.EnterGlobalReminder:
        const globalReminder = trimmedMessage;
        const globalReminderInt = Number.parseInt(globalReminder);
        if (!InputValidator.validateNumber(globalReminder) || globalReminderInt == NaN || globalReminderInt <= 0) {
          await message.author.send(MessageDecorator.inputGlobalReminder('patternError'));
          break;
        }
        event.globalReminder = globalReminderInt;
        await message.author.send(MessageDecorator.inputPrivateReminder());
        conversation.step = Steps.EnterPrivateReminder;
        break;

      case Steps.EnterPrivateReminder:
        const privateReminder = trimmedMessage;
        if (!InputValidator.validateTime(privateReminder)) {
          await message.author.send(MessageDecorator.inputTime('patternError'));
          break;
        }
        const [hours_, minutes_] = privateReminder.split(':');
        const min: number = Number.parseInt(hours_) * 60 + Number.parseInt(minutes_);
        event.privateReminder = min;
        const messageEmbed = await MessageDecorator.eventEmbed(message.client, event, true);
        await message.author.send(MessageDecorator.confirmMessage());
        const confirmMessage = await message.author.send(messageEmbed);
        await confirmMessage.react(MessageDecorator.confirmEmoji);
        await confirmMessage.react(MessageDecorator.editEmoji);
        await confirmMessage.react(MessageDecorator.deleteEmoji);
        conversation.messageId = confirmMessage.id;
        conversation.step = Steps.ChooseAction;
        break;

      case Steps.ChooseAction:
        if (message.reaction.toString() === MessageDecorator.confirmEmoji) {
          // Chiama la funzione che crea l'evento nel database e invalida la sessione
          const {eventId} = await ApiClient.post('setEvent', {userId: event.authorId});
          conversation.valid = false;

          // Prende la guild in cui pubblicare l'evento e lo pubblica
          const {guild} = await ApiClient.get('getGuild', {guildId: event.guildId});
          const targetGuild = await message.client.guilds.fetch(guild.guildId);
          const targetChannel = await targetGuild.channels.cache.get(guild.channelId);
          const publicEventMessage = await MessageDecorator.eventEmbed(message.client, event, false);

          const publishedEventMessage = await (targetChannel as TextChannel).send(publicEventMessage);
          publishedEventMessage.react(MessageDecorator.confirmEmoji);
          await message.channel.send(MessageDecorator.okMessage());

          await EventMessageManager.set(publishedEventMessage.id, eventId, event.authorId);
        } else if (message.reaction.toString() === MessageDecorator.editEmoji) {
          // Modifica dell'evento
          const embed = MessageDecorator.updateEventEmbed();
          const updateMessage = await message.channel.send(embed);
          for (const emoji of MessageDecorator.fieldsEmoji) {
            updateMessage.react(emoji);
          }
          updateMessage.react(MessageDecorator.confirmEmoji);
          updateMessage.react(MessageDecorator.deleteEmoji);
          conversation.messageId = updateMessage.id;
          conversation.step = UpdateSteps.ChooseActions;
          conversation.type = 'update';
        } else if (message.reaction.toString() === MessageDecorator.deleteEmoji) {
          // Cancella evento (solo cache)
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
          await ConversationManager.delete(event.authorId);
          conversation.valid = false;
          await message.channel.send(MessageDecorator.removedEventMessage());
        } else if (MessageDecorator.cancelEmoji === message.reaction.toString()) {
          const messageEmbed = await MessageDecorator.eventEmbed(message.client, event, true);
          await message.channel.send(MessageDecorator.confirmMessage());
          const confirmMessage = await message.channel.send(messageEmbed);
          await confirmMessage.react(MessageDecorator.confirmEmoji);
          await confirmMessage.react(MessageDecorator.editEmoji);
          await confirmMessage.react(MessageDecorator.deleteEmoji);
          conversation.messageId = confirmMessage.id;
          conversation.step = Steps.ChooseAction;
        }
        break;
    }
  }

  messageBelongToDialog(message: EnrichedMessage, conversation: UserConversation): boolean {
    if (conversation.step < Steps.ChooseAction) {
      return true;
    }
    return false;
  }
}


