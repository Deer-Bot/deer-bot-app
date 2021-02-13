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

  public static async eventsList(client: Client, events: Event[]): Promise<MessageEmbed> {
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
}
