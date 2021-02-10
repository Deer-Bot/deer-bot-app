import Dialog from '../base/dialog';
import {UserConversation} from '../cache/session';

const dateRegex = /^(?:(?:31(-)(?:0?[13578]|1[02]))\1|(?:(?:29|30)(-)(?:0?[13-9]|1[0-2])\2))(?:(?:1[6-9]|[2-9]\d)?\d{2})$|^(?:29(\/|-|\.)0?2\3(?:(?:(?:1[6-9]|[2-9]\d)?(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])00))))$|^(?:0?[1-9]|1\d|2[0-8])(-)(?:(?:0?[1-9])|(?:1[0-2]))\4(?:(?:1[6-9]|[2-9]\d)?\d{2})$/;
const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

export default class CreateEventDialog extends Dialog {
  constructor() {
    super();
    this.type = 'create';
  }

  async run(message: EnrichedMessage, conversation: UserConversation): Promise<void> {
    switch (conversation.step) {
      case 0:
        conversation.event.name = message.content.trim();
        await message.author.send('Type a description for your event');
        break;
      case 1:
        conversation.event.description = message.content.trim();
        await message.author.send('Type a date for your event (dd-mm-yyyy)');
        break;
      case 2:
        const date = message.content.trim();
        if (!date.match(dateRegex)) {
          conversation.step -= 1;
          await message.author.send('Date format must be dd-mm-yyyy');
          break;
        }
        conversation.event.date = date;
        await message.author.send('Type the time (hh:mm)');
        break;
      case 3:
        // TODO aggiustare la data quando passiamo 20 invece che 2020
        const time = message.content.trim();
        if (!time.match(timeRegex)) {
          conversation.step -= 1;
          await message.author.send('Time format must be hh:mm');
          break;
        }
        const [day, month, year] = (conversation.event.date as string).split('-');
        const [hours, minutes] = time.split(':');
        conversation.event.date = new Date(Date.UTC(+year, +month - 1, +day, +hours, +minutes));
        await message.author.send('How often should I remind about your event in the server channel?');
        break;
      case 4:
        // TODO controllare e finire la raccolta dati sui reminder e fare un nuovo case di conferma (vedere come fare)
        const globalReminder = message.content.trim();
        const globalReminderInt = Number.parseInt(globalReminder);
        if (globalReminderInt == NaN) {
          conversation.step -= 1;
          await message.author.send('It must be a number');
          break;
        }
        conversation.event.globalReminder = globalReminderInt;
        await message.author.send('How many hours before your event should I notify the participants? (hh:mm)');
        break;
      case 5:
        const privateReminder = message.content.trim();
        if (!privateReminder.match(timeRegex)) {
          conversation.step -= 1;
          await message.author.send('Time format must be hh:mm');
          break;
        }
        const [hours_, minutes_] = privateReminder.split(':');
        const min: number = (+hours_) * 60 + (+minutes_);
        conversation.event.privateReminder = min;
        await message.author.send('OK');
        break;
    }
    conversation.step += 1;
  }
}
