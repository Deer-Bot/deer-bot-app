import {Client, MessageEmbed} from 'discord.js';
import {Event} from '../cache/conversation-manager';

const pads = (s: number): string => {
  return s < 10 ? `0${s}` : `${s}`;
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
  public static cancelEmoji = '❎';
  public static deerEmoji = '🦌';

  public static async eventEmbed(client: Client, event: Event, isAuthor: boolean): Promise<MessageEmbed> {
    const guild = await client.guilds.fetch(event.guildId);
    const member = await guild.members.fetch(event.authorId);
    const minutes = event.privateReminder % 60;

    const embed = new MessageEmbed();
    embed.setTitle(event.name)
        .setDescription(event.description)
        .setAuthor(member.displayName, member.user.displayAvatarURL())
        .addField('Date', event.localDate)
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

    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      const guild = await client.guilds.fetch(event.guildId);
      let fieldsName = ['\u200b', '\u200b', '\u200b'];

      if (i === 0) {
        fieldsName = ['Event name', 'Date', 'Server and participants'];
      }

      const participants = `${event.participants ? event.participants.length : 0} ${event.participants?.length == 1 ? 'person' : 'people'} will participate`;
      embed.addFields(
          {name: fieldsName[0], value: `**${i + 1}.** ${event.name}`, inline: true},
          {name: fieldsName[1], value: event.localDate, inline: true},
          {name: fieldsName[2], value: `${guild.name} **-** ${participants}`, inline: true},
      );
    }

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

    embed.setFooter('Select the check reaction to confirm or the bin reaction to delete the event.');

    return embed;
  }

  public static noEventList(): MessageEmbed {
    return new MessageEmbed().setTitle('You don\'t have any events at the moment.').setColor('RED');
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
      msg = 'Date format must be **dd/mm/yyyy**.';
    } else if (error == 'timeError') {
      msg = 'You cannot travel through time, choose a valid date.';
    }

    const embed = new MessageEmbed().setTitle(msg).setColor(error ? 'RED' : gold);
    if (!error) {
      embed.setDescription('Use the format **dd/mm/yyyy**.');
    }

    return embed;
  }

  public static inputTime(error?: 'patternError' | 'timeError'): MessageEmbed {
    let msg ='Type the time';
    if (error == 'patternError') {
      msg = 'Time format must be **hh:mm**.';
    } else if (error == 'timeError') {
      msg = 'You cannot travel through time, choose a valid time.';
    }

    const embed = new MessageEmbed().setTitle(msg).setColor(error ? 'RED' : gold);
    if (!error) {
      embed.setDescription('Use the format **hh:mm**.');
    }

    return embed;
  }

  public static inputGlobalReminder(error?: 'patternError'): MessageEmbed {
    const msg = error == 'patternError' ? 'It must be a positive number.': 'How often (in days) should I remind about your event in the server channel?';

    return new MessageEmbed().setTitle(msg).setColor(error ? 'RED' : gold);
  }

  public static inputPrivateReminder(error?: 'patternError'): MessageEmbed {
    const msg = error == 'patternError' ? 'Time format must be **hh:mm**, maximum 24 hours.': 'How many hours before your event should I notify the participants?';

    const embed = new MessageEmbed().setTitle(msg).setColor(error ? 'RED' : gold);
    if (!error) {
      embed.setDescription('Use the format **hh** or **hh:mm**, maximum 24 hours.');
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

  public static confirmRemoveEvent(): MessageEmbed {
    return new MessageEmbed()
        .setTitle('Are you sure you want to cancel this event?')
        .setColor(gold);
  }

  public static okMessage(): MessageEmbed {
    return new MessageEmbed().setTitle(`All set! ${MessageDecorator.deerEmoji}`).setColor(gold);
  }

  public static removedEventMessage(): MessageEmbed {
    return new MessageEmbed().setTitle(`Event successfully removed! ${MessageDecorator.deerEmoji}`).setColor(gold);
  }

  public static message(message: string): MessageEmbed {
    return new MessageEmbed().setTitle(message).setColor(gold);
  }

  public static noParticipantsList(): MessageEmbed {
    return new MessageEmbed().setTitle('This event has no participants at the moment.').setColor('RED');
  }

  public static async participantsList(client: Client, event: Event, offset: number, pageSize: number): Promise<MessageEmbed> {
    const embed = new MessageEmbed();
    const participants = event.participants;

    const participantsNames = [];
    const guild = await client.guilds.fetch(event.guildId);

    for (let i = offset; i < offset + pageSize && i < participants.length; i++ ) {
      const participant = await guild.members.fetch({
        user: participants[i],
        cache: true,
        force: true,
      });
      participantsNames.push(`**${participant.displayName}** (${participant.user.tag})`);
    }

    embed.setTitle(`Participants of ${event.name}`)
        .setDescription(participantsNames.join('\n'))
        .setFooter(`Page ${Math.floor(offset / pageSize) + 1}`)
        .setColor(gold);

    return embed;
  }

  public static conversationError() {
    return MessageDecorator.message('Something went wrong during the conversation.').setColor('RED');
  }

  public static commandError(message?: string) {
    const msg = message ? message : 'Something went wrong while executing the command.';

    return MessageDecorator.message(msg).setColor('RED');
  }

  public static formatDate(date: Date, timezoneOffset: number): string {
    const localDate = new Date(date.getTime());
    localDate.setUTCHours(localDate.getUTCHours() + timezoneOffset);
    const [year, month, day, hours, minutes] = [localDate.getUTCFullYear(), localDate.getUTCMonth(), localDate.getUTCDate(), localDate.getUTCHours(), localDate.getUTCMinutes()];
    const timeZone = timezoneOffset > 0 ? `+${timezoneOffset}` : `${timezoneOffset}`;

    return `${pads(day)}/${pads(month + 1)}/${year} at ${pads(hours)}:${pads(minutes)} GMT${timezoneOffset == 0 ? '' : timeZone}`;
  }

  public static setupMessage(): MessageEmbed {
    return new MessageEmbed()
        .setTitle('Hi, I am Deer')
        .setDescription(`I can help you to create and manage events for your server, but first of all, use the following commands to let me know the things I need to work properly. ${MessageDecorator.deerEmoji}`)
        .addFields(
            {name: '!channel', value: 'To set a channel for broadcasting events', inline: true},
            {name: '!timezone', value: 'To set up your timezone', inline: true},
        )
        .setColor(gold);
  }
}
