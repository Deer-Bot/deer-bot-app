import {TextChannel} from 'discord.js';
import InputValidator from '../common/input-validator';
import ApiClient from '../api/api-client';
import Dialog from '../base/dialog';
import Session, {UserConversation} from '../cache/session';
import MessageDecorator from '../common/message-decorator';

export default class CreateEventDialog extends Dialog {
  constructor() {
    super();
    this.type = 'create';
  }

  static async start(message: EnrichedMessage, guildId: string): Promise<void> {
    const conversation: UserConversation = {
      type: 'create',
      step: 0,
      events: [
        {
          guild: guildId,
          author: message.author.id,
        },
      ],
    };
    await Session.create(message.author.id, conversation);
    await message.author.send(MessageDecorator.inputTitle());
    await message.reply('check your DMs.');
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
      case 0:
        event.name = trimmedMessage;
        await message.author.send(MessageDecorator.inputDescription());
        break;

      case 1:
        if (trimmedMessage.length > 2048) {
          conversation.step -= 1;
          await message.author.send(MessageDecorator.inputDescription(false));
          break;
        }
        event.description = trimmedMessage;
        await message.author.send(MessageDecorator.inputDate());
        break;

      case 2:
        const date = trimmedMessage;
        if (!InputValidator.validateDate(date)) {
          conversation.step -= 1;
          await message.author.send(MessageDecorator.inputDate('patternError'));
          break;
        }
        [day, month, year] = date.split('-').map((value) => Number.parseInt(value));

        now = new Date(Date.now());
        now = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0);
        inputDate = new Date(year, month - 1, day);

        if (inputDate.getTime() < now.getTime()) {
          conversation.step -= 1;
          await message.author.send(MessageDecorator.inputDate('timeError'));
          break;
        }

        event.date = date;
        await message.author.send(MessageDecorator.inputTime());
        break;

      case 3:
        const time = trimmedMessage;
        if (!InputValidator.validateTime(time)) {
          conversation.step -= 1;
          await message.author.send(MessageDecorator.inputTime('patternError'));
          break;
        }
        [day, month, year] = (event.date as string).split('-').map((value) => Number.parseInt(value));
        const [hours, minutes] = time.split(':').map((value) => Number.parseInt(value));

        now = new Date(Date.now());
        inputDate = new Date(Date.UTC(year, month - 1, day, hours, minutes));

        if (inputDate.getTime() < now.getTime()) {
          conversation.step -= 1;
          await message.author.send(MessageDecorator.inputTime('timeError'));
          break;
        }

        event.date = inputDate;
        await message.author.send(MessageDecorator.inputGlobalReminder());
        break;

      case 4:
        // TODO controllare e finire la raccolta dati sui reminder e fare un nuovo case di conferma (vedere come fare)
        const globalReminder = trimmedMessage;
        const globalReminderInt = Number.parseInt(globalReminder);
        if (!InputValidator.validateNumber(globalReminder) || globalReminderInt == NaN || globalReminderInt <= 0) {
          conversation.step -= 1;
          await message.author.send(MessageDecorator.inputGlobalReminder('patternError'));
          break;
        }
        event.globalReminder = globalReminderInt;
        await message.author.send(MessageDecorator.inputPrivateReminder());
        break;

      case 5:
        const privateReminder = trimmedMessage;
        if (!InputValidator.validateTime(privateReminder)) {
          conversation.step -= 1;
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
        break;

      case 6:
        if (message.reaction.toString() === MessageDecorator.confirmEmoji) {
          // chiamare la funzione e pubblicare il messaggio
          await ApiClient.post('setEvent', {user: event.author});
          // Get default channel and publish event
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
          conversation.messageId = updateMessage.id;
          conversation.step = 0; // this will become 1
          conversation.type = 'update';
        } else {
          conversation.step -= 1;
        }
    }
    conversation.step += 1;
  }

  messageBelongToDialog(message: EnrichedMessage, conversation: UserConversation): boolean {
    if (conversation.step < 6) {
      return true;
    }
    return false;
  }
}
