import Dialog from '../base/dialog';
import Session, {UserConversation} from '../cache/session';
import MessageDecorator from '../common/message-decorator';

const dateRegex = /^(?:(?:31(-)(?:0?[13578]|1[02]))\1|(?:(?:29|30)(-)(?:0?[13-9]|1[0-2])\2))(?:(?:1[6-9]|[2-9]\d)\d{2})$|^(?:29(-)0?2\3(?:(?:(?:1[6-9]|[2-9]\d)(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])00))))$|^(?:0?[1-9]|1\d|2[0-8])(-)(?:(?:0?[1-9])|(?:1[0-2]))\4(?:(?:1[6-9]|[2-9]\d)\d{2})$/;
const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
const numberRegex = /^\d+$/;

export default class CreateEventDialog extends Dialog {
  constructor() {
    super();
    this.type = 'create';
  }

  static async start(message: EnrichedMessage, guildId: string): Promise<void> {
    const conversation: UserConversation = {
      type: 'create',
      step: 0,
      event: {
        guild: guildId,
        author: message.author.id,
      },
    };
    await Session.create(message.author.id, conversation);
    await message.author.send('Type a name for your event');
    await message.reply('check your DMs.');
  }

  async run(message: EnrichedMessage, conversation: UserConversation): Promise<void> {
    let now: Date;
    let inputDate: Date;
    let day: number;
    let month: number;
    let year: number;

    const checkEmoji = '✅';
    const crossEmoji = '❎';

    const trimmedMessage = message.content.trim();
    switch (conversation.step) {
      case 0:
        conversation.event.name = trimmedMessage;
        await message.author.send('Type a description for your event');
        break;

      case 1:
        if (trimmedMessage.length > 2048) {
          conversation.step -= 1;
          await message.author.send('Please type a shorter description');
          break;
        }
        conversation.event.description = trimmedMessage;
        await message.author.send('Type a date for your event (dd-mm-yyyy)');
        break;

      case 2:
        const date = trimmedMessage;
        if (!date.match(dateRegex)) {
          conversation.step -= 1;
          await message.author.send('Date format must be dd-mm-yyyy.');
          break;
        }
        [day, month, year] = date.split('-').map((value) => Number.parseInt(value));

        now = new Date(Date.now());
        now = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0);
        inputDate = new Date(year, month - 1, day);

        if (inputDate.getTime() < now.getTime()) {
          conversation.step -= 1;
          await message.author.send('You cannot travel through time, choose a valid date.');
          break;
        }

        conversation.event.date = date;
        await message.author.send('Type the time (hh:mm)');
        break;

      case 3:
        const time = trimmedMessage;
        if (!time.match(timeRegex)) {
          conversation.step -= 1;
          await message.author.send('Time format must be hh:mm');
          break;
        }
        [day, month, year] = (conversation.event.date as string).split('-').map((value) => Number.parseInt(value));
        const [hours, minutes] = time.split(':').map((value) => Number.parseInt(value));

        now = new Date(Date.now());
        inputDate = new Date(Date.UTC(year, month - 1, day, hours, minutes));

        if (inputDate.getTime() < now.getTime()) {
          conversation.step -= 1;
          await message.author.send('You cannot travel through time, choose a valid time.');
          break;
        }

        conversation.event.date = inputDate;
        await message.author.send('How often (in days) should I remind about your event in the server channel?');
        break;

      case 4:
        // TODO controllare e finire la raccolta dati sui reminder e fare un nuovo case di conferma (vedere come fare)
        const globalReminder = trimmedMessage;
        const globalReminderInt = Number.parseInt(globalReminder);
        if (!globalReminder.match(numberRegex) || globalReminderInt == NaN) {
          conversation.step -= 1;
          await message.author.send('It must be a number');
          break;
        }
        conversation.event.globalReminder = globalReminderInt;
        await message.author.send('How many hours before your event should I notify the participants? (hh:mm)');
        break;

      case 5:
        const privateReminder = trimmedMessage;
        if (!privateReminder.match(timeRegex)) {
          conversation.step -= 1;
          await message.author.send('Time format must be hh:mm');
          break;
        }
        const [hours_, minutes_] = privateReminder.split(':');
        const min: number = (+hours_) * 60 + (+minutes_);
        conversation.event.privateReminder = min;
        const messageEmbed = await MessageDecorator.newEventMessage(message.client, conversation.event, true);
        await message.author.send(messageEmbed);
        const confirmMessage = await message.author.send(`Select ${checkEmoji} to confirm and publish or ${crossEmoji} to change something.`);
        await confirmMessage.react(checkEmoji);
        await confirmMessage.react(crossEmoji);
        conversation.messageId = confirmMessage.id;
        break;

      case 6:
        if (message.reaction.toString() === checkEmoji) {
          // chiamare la funzione e pubblicare il messaggio
        } else if (message.reaction.toString() === crossEmoji) {
          // chiamare la modifica dell'evento
        } else {
          conversation.step -= 1;
        }
    }
    conversation.step += 1;
  }
}
