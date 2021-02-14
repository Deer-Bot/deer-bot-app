import InputValidator from '../common/input-validator';
import ApiClient from '../api/api-client';
import Dialog from '../base/dialog';
import Session, {Event, UserConversation} from '../cache/session';
import MessageDecorator from '../common/message-decorator';
import {TextChannel} from 'discord.js';

export enum Steps {
  SelectEvent = 0,
  ChooseActions,
  ChangeTitle,
  ChangeDescription,
  ChangeDate,
  ChangeTime,
  ChangeGlobalReminder,
  ChangePrivateReminder,
}

export default class UpdateEventDialog extends Dialog {
  constructor() {
    super();
    this.type = 'update';
  }

  static async start(message: EnrichedMessage): Promise<void> {
    const conversation: UserConversation = {
      type: 'update',
      step: Steps.SelectEvent,
    };

    // Chiama la Function per prendere gli eventi dell'utente
    const {events, hasNext}: {events: Event[], hasNext: boolean} = await ApiClient.get(`getEvents`, {
      author: message.author.id,
      offset: 0,
      number: 5,
    });

    if (events.length > 0) {
      conversation.events = events;
      conversation.offset = 0;
      conversation.hasNext = hasNext;

      const embed = await MessageDecorator.eventsList(message.client, events);
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
    }
  }

  async run(message: EnrichedMessage, conversation: UserConversation): Promise<void> {
    const [event] = conversation.events;
    let trimmedMessage;
    let day;
    let month;
    let year;
    let now;
    let inputDate;

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
          conversation.offset += (message.reaction.toString() === MessageDecorator.nextEmoji) ? 5 : -5; // avanti o indietro
          const {events, hasNext}: {events: Event[], hasNext: boolean} = await ApiClient.get(`getEvents`, {
            author: conversation.events[0].author,
            offset: conversation.offset,
            number: 5,
          });

          conversation.events = events;
          conversation.hasNext = hasNext;

          const embed = await MessageDecorator.eventsList(message.client, events);
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
          await ApiClient.post('setEvent', {user: event.author}); // Update event in DB
          // Get default channel and publish event
          const {guild} = await ApiClient.get('getGuild', {guild: event.guild});
          const targetGuild = await message.client.guilds.fetch(guild.guild);
          const targetChannel = await targetGuild.channels.cache.get(guild.channel);
          const publicEventMessage = await MessageDecorator.eventEmbed(message.client, event, false);

          await (targetChannel as TextChannel).send(publicEventMessage);
          await message.channel.send(MessageDecorator.okMessage());
        } else if (MessageDecorator.deleteEmoji === message.reaction.toString()) {
          // Elimina
          await ApiClient.delete('deleteEvent', {user: event.author});
          await message.channel.send(MessageDecorator.removedEventMessage());
        }
        break;

      case Steps.ChangeTitle:
        trimmedMessage = message.content.trim();
        event.name = trimmedMessage;
        await this.sendSelectedEvent(message, conversation);
        break;

      case Steps.ChangeDescription:
        trimmedMessage = message.content.trim();
        if (trimmedMessage.length > 2048) {
          await message.channel.send(MessageDecorator.inputDescription(false));
          break;
        }
        event.description = trimmedMessage;
        await this.sendSelectedEvent(message, conversation);
        break;

      case Steps.ChangeDate:
        trimmedMessage = message.content.trim();
        const date = trimmedMessage;
        if (!InputValidator.validateDate(date)) {
          await message.channel.send(MessageDecorator.inputDate('patternError'));
          break;
        }
        [day, month, year] = date.split('-').map((value) => Number.parseInt(value));

        // Compare new date with current date
        now = new Date(Date.now());
        const prevDate = new Date(event.date);
        inputDate = new Date(year, month - 1, day, prevDate.getHours(), prevDate.getMinutes());
        if (inputDate.getTime() < now.getTime()) {
          await message.channel.send(MessageDecorator.inputDate('timeError'));
          break;
        }
        event.date = inputDate;
        await this.sendSelectedEvent(message, conversation);
        break;

      case Steps.ChangeTime:
        trimmedMessage = message.content.trim();
        const time = trimmedMessage;
        if (!InputValidator.validateTime(time)) {
          await message.channel.send(MessageDecorator.inputTime('patternError'));
          break;
        }
        const currentDate = new Date(event.date);
        [day, month, year] = [currentDate.getUTCDate(), currentDate.getUTCMonth(), currentDate.getUTCFullYear()];
        const [hours, minutes] = time.split(':').map((value) => Number.parseInt(value));

        now = new Date(Date.now());
        inputDate = new Date(Date.UTC(year, month, day, hours, minutes));
        // Compare current time with new time
        if (inputDate.getTime() < now.getTime()) {
          await message.channel.send(MessageDecorator.inputTime('timeError'));
          break;
        }
        event.date = inputDate;
        await this.sendSelectedEvent(message, conversation);
        break;

      case Steps.ChangeGlobalReminder:
        trimmedMessage = message.content.trim();
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
        trimmedMessage = message.content.trim();
        const privateReminder = trimmedMessage;
        if (!InputValidator.validateTime(privateReminder)) {
          await message.channel.send(MessageDecorator.inputTime('patternError'));
          break;
        }
        const [hours_, minutes_] = privateReminder.split(':');
        const min: number = Number.parseInt(hours_) * 60 + Number.parseInt(minutes_);
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

  messageBelongToDialog(message: EnrichedMessage, conversation: UserConversation): boolean {
    if (conversation.step === Steps.ChooseActions || conversation.step === Steps.SelectEvent) {
      return false;
    }

    return true;
  }
}
