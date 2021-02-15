import {Client, MessageEmbed} from 'discord.js';
import {Event} from '../cache/session';

const pads = (s: number): string => {
  return s < 10 ? `0${s}` : `${s}`;
};

const dateToString = (date: Date): string => {
  const dateString = [pads(date.getUTCDate()), pads(date.getUTCMonth() + 1), pads(date.getUTCFullYear())].join('-');
  return `${dateString} at ${date.getUTCHours()}:${pads(date.getUTCMinutes())}`;
};

const gold = '#FFD700';

export default class MessageDecorator {
  public static fieldsEmoji = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣'];
  public static numberEmoji = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'];
  public static prevEmoji = '◀';
  public static nextEmoji = '▶';
  public static confirmEmoji = '✅';
  public static editEmoji = '✏';
  public static deleteEmoji = '🗑';


  public static async eventEmbed(client: Client, event: Event, isAuthor: boolean): Promise<MessageEmbed> {
    const guild = await client.guilds.fetch(event.guild);
    const member = await guild.members.fetch(event.author);
    const minutes = event.privateReminder % 60;
    const date = new Date(event.date);

    const embed = new MessageEmbed();
    embed.setTitle(event.name)
        .setDescription(event.description)
        .setAuthor(member.displayName, member.user.displayAvatarURL())
        .addField('Date', dateToString(date) )
        .setColor(gold);

    if (isAuthor) {
      embed.addFields(
          {name: 'Server reminder', value: `Every ${event.globalReminder} day(s)`, inline: true},
          {name: 'Private reminder', value: `${Math.floor(event.privateReminder / 60)}:${pads(minutes)} hour(s) before the event`, inline: true},
      );
    }

    return embed;
  }

  public static async eventsList(client: Client, events: Event[], page: number): Promise<MessageEmbed> {
    const embed = new MessageEmbed();
    embed.setTitle('Your events')
        .setColor(gold);

    const eventNames = [];
    const eventDates = [];
    const serverNames = [];
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      const guild = await client.guilds.fetch(event.guild);
      eventNames.push(`**${i + 1}.** ${event.name}`);
      eventDates.push(dateToString(new Date(event.date)));
      serverNames.push(guild.name);
    }

    embed.addFields(
        {name: 'Event name', value: eventNames.join('\n'), inline: true},
        {name: 'Date', value: eventDates.join('\n'), inline: true},
        {name: 'Server', value: serverNames.join('\n'), inline: true},
    );

    embed.setFooter(`Page ${page}`);

    return embed;
  }

  public static updateEventEmbed(): MessageEmbed {
    const embed = new MessageEmbed();
    embed.setTitle('Select the reaction corresponding to the field you want to change.')
        .setDescription(
            '**1.** Edit title\n' +
            '**2.** Edit description\n' +
            '**3.** Edit date\n' +
            '**4.** Edit time\n' +
            '**5.** Edit server reminder \n' +
            '**6.** Edit private reminder',
        )
        .setColor(gold);

    return embed;
  }

  public static noEventList(): MessageEmbed {
    return new MessageEmbed().setDescription('You don\'t have any events at the moment.').setColor('RED');
  }

  public static inputTitle(): MessageEmbed {
    return new MessageEmbed().setTitle('Type a title for your event').setColor(gold);
  }

  public static inputDescription(error?: boolean): MessageEmbed {
    const msg = error ? 'Please type a shorter description' : 'Type a description for your event';

    return new MessageEmbed().setTitle(msg).setColor(error ? 'RED' : gold);
  }

  public static inputDate(error?: 'patternError' | 'timeError'): MessageEmbed {
    let msg ='Type a date for your event';
    if (error == 'patternError') {
      msg = 'Date format must be dd-mm-yyyy.';
    } else if (error == 'timeError') {
      msg = 'You cannot travel through time, choose a valid date.';
    }

    const embed = new MessageEmbed().setTitle(msg).setColor(error ? 'RED' : gold);
    if (!error) {
      embed.setDescription('Use the format dd-mm-yyyy');
    }

    return embed;
  }

  public static inputTime(error?: 'patternError' | 'timeError'): MessageEmbed {
    let msg ='Type the time';
    if (error == 'patternError') {
      msg = 'Time format must be hh:mm.';
    } else if (error == 'timeError') {
      msg = 'You cannot travel through time, choose a valid time.';
    }

    const embed = new MessageEmbed().setTitle(msg).setColor(error ? 'RED' : gold);
    if (!error) {
      embed.setDescription('Use the format hh:mm');
    }

    return embed;
  }

  public static inputGlobalReminder(error?: 'patternError'): MessageEmbed {
    const msg = error == 'patternError' ? 'It must be a positive number': 'How often (in days) should I remind about your event in the server channel?';

    return new MessageEmbed().setTitle(msg).setColor(error ? 'RED' : gold);
  }

  public static inputPrivateReminder(error?: 'patternError'): MessageEmbed {
    const msg = error == 'patternError' ? 'Time format must be hh:mm': 'How many hours before your event should I notify the participants?';

    const embed = new MessageEmbed().setTitle(msg).setColor(error ? 'RED' : gold);
    if (!error) {
      embed.setDescription('Use the format hh:mm');
    }

    return embed;
  }

  public static confirmMessage(): MessageEmbed {
    return new MessageEmbed()
        .setDescription(`Select the ${MessageDecorator.confirmEmoji} reaction to confirm and publish,` +
          `the ${MessageDecorator.editEmoji} reaction to make some changes or ` +
          `the ${MessageDecorator.deleteEmoji} to cancel the event.`,
        )
        .setColor(gold);
  }

  public static okMessage(): MessageEmbed {
    return new MessageEmbed().setTitle('All set! 🦌').setColor(gold);
  }

  public static removedEventMessage(): MessageEmbed {
    return new MessageEmbed().setTitle('Event successfully removed! 🦌').setColor(gold);
  }

  public static message(message: string): MessageEmbed {
    return new MessageEmbed().setDescription(message).setColor(gold);
  }
}
