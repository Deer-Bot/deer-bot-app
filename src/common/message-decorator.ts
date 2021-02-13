import Discord from 'discord.js';
import {Event} from '../cache/session';

const pads = (s: number): string => {
  return s < 10 ? `0${s}` : `${s}`;
};

export default class MessageDecorator {
  public static async newEventMessage(client: Discord.Client, event: Event, isAuthor: boolean): Promise<Discord.MessageEmbed> {
    const guild = await client.guilds.fetch(event.guild);
    const member = await guild.members.fetch(event.author);
    const minutes = event.privateReminder % 60;
    const date = event.date as Date;
    const dateString = [pads(date.getDate()), pads(date.getMonth()), pads(date.getFullYear())].join('-');

    const embed = new Discord.MessageEmbed();
    embed.setTitle(event.name)
        .setDescription(event.description)
        .setAuthor(member.displayName, member.user.displayAvatarURL())
        .addField('Date', `${dateString} ${date.getHours()}:${pads(date.getMinutes())}`)
        .setColor('#FFD700')
        .setTimestamp();

    if (isAuthor) {
      embed.addFields(
          {name: 'Server reminder', value: `Every ${event.globalReminder} day(s)`, inline: true},
          {name: 'Private reminder', value: `${Math.floor(event.privateReminder / 60)}:${pads(minutes)} hour(s) before the event`, inline: true},
      );
    }

    return embed;
  }
}
