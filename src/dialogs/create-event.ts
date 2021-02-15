import {TextChannel} from 'discord.js';
import InputValidator from '../common/input-validator';
import ApiClient from '../api/api-client';
import Dialog from '../base/dialog';
import Session, {UserConversation} from '../cache/session';
import MessageDecorator from '../common/message-decorator';
import {Steps as UpdateSteps} from './update-event';

enum Steps {
  EnterTitle = 0,
  EnterDescription,
  EnterDate,
  EnterTime,
  EnterGlobalReminder,
  EnterPrivateReminder,
  ChooseAction
}

export default class CreateEventDialog extends Dialog {
  constructor() {
    super();
    this.type = 'create';
  }

  static async start(message: EnrichedMessage, guildId: string): Promise<void> {
    const conversation: UserConversation = {
      type: 'create',
      step: Steps.EnterTitle,
      valid: true,
      events: [
        {
          guild: guildId,
          author: message.author.id,
        },
      ],
    };
    await Session.create(message.author.id, conversation);
    await message.author.send(MessageDecorator.inputTitle());
    await message.reply(MessageDecorator.message('Check your DMs.'));
  }

  async run(message: EnrichedMessage, conversation: UserConversation): Promise<void> {
    let now: Date;
    let inputDate: Date;
    let day: number;
    let month: number;
    let year: number;

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
        if (!InputValidator.validateDate(date)) {
          await message.author.send(MessageDecorator.inputDate('patternError'));
          break;
        }
        [day, month, year] = date.split('-').map((value) => Number.parseInt(value));

        now = new Date(Date.now());
        now = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0);
        inputDate = new Date(year, month - 1, day);

        if (inputDate.getTime() < now.getTime()) {
          await message.author.send(MessageDecorator.inputDate('timeError'));
          break;
        }

        event.date = date;
        await message.author.send(MessageDecorator.inputTime());
        conversation.step = Steps.EnterTime;
        break;

      case Steps.EnterTime:
        const time = trimmedMessage;
        if (!InputValidator.validateTime(time)) {
          await message.author.send(MessageDecorator.inputTime('patternError'));
          break;
        }
        [day, month, year] = (event.date as string).split('-').map((value) => Number.parseInt(value));
        const [hours, minutes] = time.split(':').map((value) => Number.parseInt(value));

        now = new Date(Date.now());
        inputDate = new Date(Date.UTC(year, month - 1, day, hours, minutes));

        if (inputDate.getTime() < now.getTime()) {
          await message.author.send(MessageDecorator.inputTime('timeError'));
          break;
        }

        event.date = inputDate;
        await message.author.send(MessageDecorator.inputGlobalReminder());
        conversation.step = Steps.EnterGlobalReminder;
        break;

      case Steps.EnterGlobalReminder:
        // TODO controllare e finire la raccolta dati sui reminder e fare un nuovo case di conferma (vedere come fare)
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
          await ApiClient.post('setEvent', {user: event.author});
          conversation.valid = false;

          // Prende la guild in cui pubblicare l'evento e lo pubblica
          const {guild} = await ApiClient.get('getGuild', {guild: event.guild});
          const targetGuild = await message.client.guilds.fetch(guild.guild);
          const targetChannel = await targetGuild.channels.cache.get(guild.channel);
          const publicEventMessage = await MessageDecorator.eventEmbed(message.client, event, false);

          await (targetChannel as TextChannel).send(publicEventMessage);
          await message.channel.send(MessageDecorator.okMessage());
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
          // TODO: capire perché non cancella dalla sessione
          await Session.delete(event.author);
          conversation.valid = false;
          await message.channel.send(MessageDecorator.removedEventMessage());
        }
    }
  }

  messageBelongToDialog(message: EnrichedMessage, conversation: UserConversation): boolean {
    if (conversation.step < Steps.ChooseAction) {
      return true;
    }
    return false;
  }
}
